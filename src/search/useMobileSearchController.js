import { useEffect, useRef, useState } from "react";
import {
  discoverProducts,
  finalizeSearch,
  getRetryAdvice,
  getRefinementPrompt,
  normalizeFinalResults,
  normalizeQueryQualitySuggestion,
  normalizePreviewResults,
  normalizeRefinementSuggestions,
  pollEnrichment,
  pollQueryQuality,
} from "./searchApi";
import { buildConstraintRefreshQuery, detectHardConstraint } from "./searchConstraints";
import { isPositivePrimeFlag } from "./primeEligibility";
import {
  DEFAULT_AMAZON_DOMAIN,
  hasSeenAmazonMarketplacePrompt,
  loadAmazonMarketplacePreference,
  getAmazonMarketplaceLabel,
  normalizeAmazonDomain,
  saveAmazonMarketplaceSelection,
} from "./amazonMarketplaces";
import { historyStore } from "../lib/history/historyStore";
import { buildPhaseEvent, replacePhaseEvent } from "./searchPhaseEvents";

const ENRICHMENT_POLL_INTERVAL_MS = 1500;
const ENRICHMENT_POLL_TIMEOUT_MS = 30000;
const QUERY_QUALITY_POLL_INTERVAL_MS = 1500;
const QUERY_QUALITY_POLL_TIMEOUT_MS = 20000;

function createSearchSession({ amazonDomain, requestId, submittedQuery }) {
  return {
    amazonDomain,
    candidatePool: null,
    candidateCount: 0,
    constraintRefresh: null,
    discoveryToken: "",
    phases: {
      discover: "running",
      finalize: "idle",
      refine: "running",
    },
    previewCount: 0,
    requestId,
    submittedQuery,
  };
}

function buildRefreshedDiscoverySummary(discoveryPayload, query, fallbackAmazonDomain) {
  const nextSummary = buildDiscoverySummary(discoveryPayload, query);

  return {
    ...nextSummary,
    amazonDomain: normalizeAmazonDomain(discoveryPayload.amazonDomain) || fallbackAmazonDomain,
  };
}

function hasRunningPhase(session) {
  return Object.values(session?.phases || {}).some((status) => status === "running");
}

function getFinalResultsKey(results) {
  return Array.isArray(results) ? results.map((item) => String(item?.id || "")).join("|") : "";
}

function resultNeedsEnrichment(result) {
  const featureBullets = Array.isArray(result?.feature_bullets)
    ? result.feature_bullets.map((bullet) => normalizeEnrichmentText(bullet)).filter(Boolean)
    : [];

  return !normalizeEnrichmentText(result?.fit_reason) ||
    !normalizeEnrichmentText(result?.caveat) ||
    featureBullets.length === 0;
}

function shouldStartEnrichmentPolling(results) {
  return Array.isArray(results) && results.length > 0 && results.some(resultNeedsEnrichment);
}

function buildDiscoverySummary(discoveryPayload, query) {
  const candidates = Array.isArray(discoveryPayload.candidatePool?.candidates)
    ? discoveryPayload.candidatePool.candidates
    : [];
  const previewResults = Array.isArray(discoveryPayload.previewResults)
    ? discoveryPayload.previewResults
    : [];

  return {
    amazonDomain: discoveryPayload.amazonDomain || "",
    candidateCount: candidates.length,
    candidatePool: discoveryPayload.candidatePool || null,
    discoveryToken: discoveryPayload.discoveryToken || "",
    previewCount: previewResults.length,
    previewItems: normalizePreviewResults(previewResults),
    query,
    source: discoveryPayload.source || "unknown",
    timingMs: discoveryPayload.clientTimingMs,
  };
}

function buildRefinementPrompt(refinementPayload) {
  return {
    followUpPlaceholder:
      refinementPayload.followUpPlaceholder ||
      "Add budget, size, must-haves, dealbreakers, or how you plan to use it.",
    helperText: refinementPayload.helperText || "",
    prompt: refinementPayload.prompt || "What should we optimize for?",
    suggestedRefinements: normalizeRefinementSuggestions(refinementPayload),
    timingMs: refinementPayload.clientTimingMs,
  };
}

export function mergeEnrichmentIntoResults(currentResults, entries) {
  if (!Array.isArray(currentResults) || !Array.isArray(entries) || entries.length === 0) {
    return currentResults;
  }

  const entriesByCandidateId = new Map(
    entries
      .map((entry) => {
        const candidateId = entry?.candidate_id || entry?.candidateId || entry?.id;

        return candidateId ? [String(candidateId), entry] : null;
      })
      .filter(Boolean),
  );

  if (entriesByCandidateId.size === 0) {
    return currentResults;
  }

  return currentResults.map((result) => {
    const entry = entriesByCandidateId.get(String(result.id));

    if (!entry) {
      return result;
    }

    const caveat = normalizeEnrichmentText(entry.caveat);
    const fitReason = normalizeEnrichmentText(entry.fit_reason ?? entry.fitReason);
    const featureBullets = normalizeEnrichmentBullets(
      entry.feature_bullets ?? entry.featureBullets,
    );

    return {
      ...result,
      caveat: caveat || result.caveat,
      delivery: normalizeEnrichmentText(entry.delivery) || result.delivery || "",
      feature_bullets: featureBullets.length ? featureBullets : result.feature_bullets,
      fit_reason: fitReason || result.fit_reason,
      image: entry.image || result.image,
      isPrime: Boolean(
        result.isPrime ||
        isPositivePrimeFlag(entry.isPrime) ||
        isPositivePrimeFlag(entry.is_prime),
      ),
      link: entry.link || result.link,
    };
  });
}

const ENRICHMENT_TEXT_KEYS = ["text", "value", "message", "suggestion", "query"];

export function normalizeEnrichmentText(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of ENRICHMENT_TEXT_KEYS) {
      if (typeof value[key] === "string" && value[key].trim()) {
        return value[key].trim();
      }
    }
  }

  return "";
}

export function normalizeEnrichmentBullets(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((bullet) => normalizeEnrichmentText(bullet))
    .filter((text) => typeof text === "string" && text.length > 0);
}

export function useMobileSearchController() {
  const activeSearchSessionRef = useRef(null);
  const enrichmentPollTimerRef = useRef(null);
  const finalResultsRef = useRef([]);
  const finalizingRequestIdRef = useRef(null);
  const followUpNotesRef = useRef("");
  const queryQualityPollTimerRef = useRef(null);
  const retryFeedbackRef = useRef("");
  const retryAdviceRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const selectedAmazonDomainTouchedRef = useRef(false);
  const [activeSearchSession, setActiveSearchSession] = useState(null);
  const [productQuery, setProductQuery] = useState("");
  const [selectedAmazonDomain, setSelectedAmazonDomainState] = useState(DEFAULT_AMAZON_DOMAIN);
  const [discoverySummary, setDiscoverySummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [finalResults, setFinalResults] = useState([]);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingRetryAdvice, setIsGeneratingRetryAdvice] = useState(false);
  const [isCheckingQueryQuality, setIsCheckingQueryQuality] = useState(false);
  const [phaseEvents, setPhaseEvents] = useState([]);
  const [querySuggestion, setQuerySuggestion] = useState(null);
  const [refinementPrompt, setRefinementPrompt] = useState(null);
  const [retryAdvice, setRetryAdvice] = useState(null);
  const [retryAdviceError, setRetryAdviceError] = useState("");
  const [retryFeedback, setRetryFeedback] = useState("");
  const [shouldAskMarketplaceBeforeSearch, setShouldAskMarketplaceBeforeSearch] = useState(false);
  const [showMarketplacePrompt, setShowMarketplacePrompt] = useState(false);
  const pendingMarketplaceSearchRef = useRef(null);

  function updatePhaseEvent(nextEvent) {
    setPhaseEvents((currentEvents) => replacePhaseEvent(currentEvents, nextEvent));
  }

  function setSession(nextSession) {
    activeSearchSessionRef.current = nextSession;
    setActiveSearchSession(nextSession);
  }

  function updateSessionForRequest(requestId, updateSession) {
    if (activeSearchSessionRef.current?.requestId !== requestId) {
      return false;
    }

    const nextSession = updateSession(activeSearchSessionRef.current);
    setSession(nextSession);

    return true;
  }

  function isActiveRequest(requestId) {
    return activeSearchSessionRef.current?.requestId === requestId;
  }

  function stopEnrichmentPolling() {
    if (enrichmentPollTimerRef.current) {
      clearTimeout(enrichmentPollTimerRef.current);
      enrichmentPollTimerRef.current = null;
    }
  }

  function stopQueryQualityPolling({ clearSuggestion = false, updateState = true } = {}) {
    if (queryQualityPollTimerRef.current) {
      clearTimeout(queryQualityPollTimerRef.current);
      queryQualityPollTimerRef.current = null;
    }

    if (!updateState) {
      return;
    }

    setIsCheckingQueryQuality(false);

    if (clearSuggestion) {
      setQuerySuggestion(null);
    }
  }

  function clearRetryAdviceState() {
    retryAdviceRequestIdRef.current += 1;
    setRetryAdvice(null);
    setRetryAdviceError("");
    setIsGeneratingRetryAdvice(false);
  }

  function startQueryQualityPolling({ amazonDomain, query, requestId, token }) {
    const pollingStartedAt = Date.now();

    if (!token || !query) {
      return;
    }

    updateSessionForRequest(requestId, (currentSession) => ({
      ...currentSession,
      phases: {
        ...currentSession.phases,
        queryQuality: "running",
      },
    }));
    updatePhaseEvent(
      buildPhaseEvent({
        detail: "Checking whether a more specific search would help",
        phase: "queryQuality",
        requestId,
        status: "running",
      }),
    );
    setIsCheckingQueryQuality(true);

    const scheduleNextPoll = () => {
      if (queryQualityPollTimerRef.current) {
        clearTimeout(queryQualityPollTimerRef.current);
        queryQualityPollTimerRef.current = null;
      }

      if (!isActiveRequest(requestId)) {
        setIsCheckingQueryQuality(false);
        return;
      }

      const hasTimedOut = Date.now() - pollingStartedAt >= QUERY_QUALITY_POLL_TIMEOUT_MS;

      if (hasTimedOut) {
        updateSessionForRequest(requestId, (currentSession) => ({
          ...currentSession,
          phases: {
            ...currentSession.phases,
            queryQuality: "timeout",
          },
        }));
        updatePhaseEvent(
          buildPhaseEvent({
            detail: "No query suggestion was ready",
            phase: "queryQuality",
            requestId,
            status: "timeout",
          }),
        );
        setIsCheckingQueryQuality(false);
        return;
      }

      queryQualityPollTimerRef.current = setTimeout(runPoll, QUERY_QUALITY_POLL_INTERVAL_MS);
    };

    const runPoll = async () => {
      if (!isActiveRequest(requestId)) {
        setIsCheckingQueryQuality(false);
        return;
      }

      try {
        const payload = await pollQueryQuality({
          amazonDomain,
          query,
          token,
        });

        if (!isActiveRequest(requestId)) {
          setIsCheckingQueryQuality(false);
          return;
        }

        if (payload.ready) {
          const normalizedSuggestion = normalizeQueryQualitySuggestion(payload, query);
          const shouldShowSuggestion = Boolean(payload.shouldSuggest && normalizedSuggestion);

          if (shouldShowSuggestion) {
            setQuerySuggestion({
              amazonDomain,
              classification: normalizedSuggestion.classification,
              confidence: normalizedSuggestion.confidence,
              originalQuery: normalizedSuggestion.originalQuery || query,
              query,
              reason: normalizedSuggestion.reason,
              requestId,
              suggestedQuery: normalizedSuggestion.suggestedQuery,
              token,
            });
          }

          updateSessionForRequest(requestId, (currentSession) => ({
            ...currentSession,
            phases: {
              ...currentSession.phases,
              queryQuality: "complete",
            },
          }));
          updatePhaseEvent(
            buildPhaseEvent({
              detail: shouldShowSuggestion
                ? "Suggested a more specific search"
                : "No query suggestion needed",
              phase: "queryQuality",
              requestId,
              status: "complete",
              timingMs: payload.clientTimingMs,
            }),
          );
          setIsCheckingQueryQuality(false);
          return;
        }
      } catch {
        // Query-quality recovery is optional; keep the original search uninterrupted.
      }

      scheduleNextPoll();
    };

    runPoll();
  }

  function startEnrichmentPolling({ amazonDomain, query, requestId, token }) {
    const pollingStartedAt = Date.now();

    updateSessionForRequest(requestId, (currentSession) => ({
      ...currentSession,
      phases: {
        ...currentSession.phases,
        enrich: "running",
      },
    }));
    updatePhaseEvent(
      buildPhaseEvent({
        detail: "Checking for richer pick explanations",
        phase: "enrich",
        requestId,
        status: "running",
      }),
    );

    const scheduleNextPoll = () => {
      stopEnrichmentPolling();

      if (!isActiveRequest(requestId)) {
        return;
      }

      const hasTimedOut = Date.now() - pollingStartedAt >= ENRICHMENT_POLL_TIMEOUT_MS;

      if (hasTimedOut) {
        updateSessionForRequest(requestId, (currentSession) => ({
          ...currentSession,
          phases: {
            ...currentSession.phases,
            enrich: "timeout",
          },
        }));
        updatePhaseEvent(
          buildPhaseEvent({
            detail: "Enrichment was not ready yet",
            phase: "enrich",
            requestId,
            status: "timeout",
          }),
        );
        return;
      }

      enrichmentPollTimerRef.current = setTimeout(runPoll, ENRICHMENT_POLL_INTERVAL_MS);
    };

    const runPoll = async () => {
      if (!isActiveRequest(requestId)) {
        return;
      }

      try {
        const payload = await pollEnrichment({
          amazonDomain,
          query,
          token,
        });

        if (!isActiveRequest(requestId)) {
          return;
        }

        const entries = Array.isArray(payload.entries) ? payload.entries : [];

        if (payload.ready && entries.length > 0) {
          setFinalResults((currentResults) => mergeEnrichmentIntoResults(currentResults, entries));
          updateSessionForRequest(requestId, (currentSession) => ({
            ...currentSession,
            phases: {
              ...currentSession.phases,
              enrich: "complete",
            },
          }));
          updatePhaseEvent(
            buildPhaseEvent({
              detail: `${entries.length} enriched picks ready`,
              phase: "enrich",
              requestId,
              status: "complete",
              timingMs: payload.clientTimingMs,
            }),
          );
          stopEnrichmentPolling();
          return;
        }
      } catch {
        // Enrichment is best-effort; keep the shortlist usable if polling fails.
      }

      scheduleNextPoll();
    };

    scheduleNextPoll();
  }

  useEffect(() => {
    return () => {
      stopEnrichmentPolling();
      stopQueryQualityPolling({ updateState: false });
    };
  }, []);

  useEffect(() => {
    finalResultsRef.current = finalResults;
  }, [finalResults]);

  useEffect(() => {
    followUpNotesRef.current = followUpNotes;
  }, [followUpNotes]);

  useEffect(() => {
    retryFeedbackRef.current = retryFeedback;
  }, [retryFeedback]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      loadAmazonMarketplacePreference(),
      hasSeenAmazonMarketplacePrompt(),
    ])
      .then(([preference, hasSeenPrompt]) => {
        if (isMounted && !selectedAmazonDomainTouchedRef.current) {
          setSelectedAmazonDomainState(preference.domain);
          setShouldAskMarketplaceBeforeSearch(!preference.hasSavedPreference && !hasSeenPrompt);
          setShowMarketplacePrompt(false);
        }
      })
      .catch(() => {
        if (isMounted && !selectedAmazonDomainTouchedRef.current) {
          setSelectedAmazonDomainState(DEFAULT_AMAZON_DOMAIN);
          setShouldAskMarketplaceBeforeSearch(true);
          setShowMarketplacePrompt(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function runDiscoverySearch({
    amazonDomainOverride,
    cacheMode = "",
    initialFollowUpNotes = "",
    queryOverride,
  } = {}) {
    const normalizedQuery = String(queryOverride ?? productQuery).trim();
    const requestedAmazonDomain =
      normalizeAmazonDomain(amazonDomainOverride ?? selectedAmazonDomain) || DEFAULT_AMAZON_DOMAIN;

    if (!normalizedQuery) {
      console.info("[Focamai API] search request not attempted", {
        reason: "empty-query",
        stage: "runDiscoverySearch",
      });
      setErrorMessage("Enter a product query first.");
      setDiscoverySummary(null);
      return false;
    }

    if (queryOverride !== undefined) {
      setProductQuery(normalizedQuery);
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    const previousSession = activeSearchSessionRef.current;
    const previousSessionWasRunning =
      Boolean(previousSession) && (hasRunningPhase(previousSession) || finalizingRequestIdRef.current);
    finalizingRequestIdRef.current = null;
    stopEnrichmentPolling();
    stopQueryQualityPolling({ clearSuggestion: true });
    clearRetryAdviceState();

    const nextSession = createSearchSession({
      amazonDomain: requestedAmazonDomain,
      requestId,
      submittedQuery: normalizedQuery,
    });

    setSession(nextSession);
    setIsDiscovering(true);
    setIsGeneratingPrompt(true);
    setIsFinalizing(false);
    setErrorMessage("");
    setDiscoverySummary(null);
    setFinalResults([]);
    setFollowUpNotes(String(initialFollowUpNotes ?? "").trim());
    setRetryFeedback("");
    setPhaseEvents([
      ...(previousSessionWasRunning
        ? [
            buildPhaseEvent({
              detail: "Previous in-flight responses will be ignored",
              phase: "session",
              requestId: previousSession.requestId,
              status: "stale",
            }),
          ]
        : []),
      buildPhaseEvent({
        detail: cacheMode === "refresh"
          ? `Starting refreshed discovery request for ${requestedAmazonDomain}`
          : `Starting discovery request for ${requestedAmazonDomain}`,
        phase: "discover",
        requestId,
        status: "running",
      }),
      buildPhaseEvent({
        detail: "Starting follow-up prompt request",
        phase: "refine",
        requestId,
        status: "running",
      }),
    ]);
    setRefinementPrompt(null);

    discoverProducts({ amazonDomain: requestedAmazonDomain, cacheMode, query: normalizedQuery })
      .then((discoveryPayload) => {
        if (!isActiveRequest(requestId)) {
          return;
        }

        const nextSummary = buildDiscoverySummary(discoveryPayload, normalizedQuery);
        const nextAmazonDomain =
          normalizeAmazonDomain(discoveryPayload.amazonDomain) || requestedAmazonDomain;

        setDiscoverySummary({
          ...nextSummary,
          amazonDomain: nextAmazonDomain,
        });
        if (!nextSummary.discoveryToken) {
          updateSessionForRequest(requestId, (currentSession) => ({
            ...currentSession,
            amazonDomain: nextAmazonDomain,
            candidatePool: nextSummary.candidatePool,
            candidateCount: nextSummary.candidateCount,
            discoveryToken: "",
            phases: {
              ...currentSession.phases,
              discover: "failed",
            },
            previewCount: nextSummary.previewCount,
          }));
          setErrorMessage("This search session expired before it could be finalized. Start the search again.");
          updatePhaseEvent(
            buildPhaseEvent({
              detail: "Discovery returned no session token",
              phase: "discover",
              requestId,
              status: "failed",
              timingMs: nextSummary.timingMs,
            }),
          );
          return;
        }

        updateSessionForRequest(requestId, (currentSession) => ({
          ...currentSession,
          amazonDomain: nextAmazonDomain,
          candidatePool: nextSummary.candidatePool,
          candidateCount: nextSummary.candidateCount,
          discoveryToken: nextSummary.discoveryToken,
          phases: {
            ...currentSession.phases,
            discover: "complete",
          },
          previewCount: nextSummary.previewCount,
        }));
        updatePhaseEvent(
          buildPhaseEvent({
            detail: `${nextSummary.candidateCount} candidates, ${nextSummary.previewCount} preview results on ${nextAmazonDomain}`,
            phase: "discover",
            requestId,
            status: "complete",
            timingMs: nextSummary.timingMs,
          }),
        );
        startQueryQualityPolling({
          amazonDomain: nextAmazonDomain,
          query: normalizedQuery,
          requestId,
          token: nextSummary.discoveryToken,
        });
      })
      .catch((error) => {
        if (!isActiveRequest(requestId)) {
          return;
        }

        updateSessionForRequest(requestId, (currentSession) => ({
          ...currentSession,
          phases: {
            ...currentSession.phases,
            discover: "failed",
          },
        }));
        setErrorMessage(error instanceof Error ? error.message : "Unable to run discovery.");
        updatePhaseEvent(
          buildPhaseEvent({
            detail: "Discovery request failed",
            phase: "discover",
            requestId,
            status: "failed",
          }),
        );
      })
      .finally(() => {
        if (isActiveRequest(requestId)) {
          setIsDiscovering(false);
        }
      });

    getRefinementPrompt({ query: normalizedQuery })
      .then((refinementPayload) => {
        if (!isActiveRequest(requestId)) {
          return;
        }

        const nextPrompt = buildRefinementPrompt(refinementPayload);

        setRefinementPrompt(nextPrompt);
        updateSessionForRequest(requestId, (currentSession) => ({
          ...currentSession,
          phases: {
            ...currentSession.phases,
            refine: "complete",
          },
        }));
        updatePhaseEvent(
          buildPhaseEvent({
            detail: "Follow-up prompt ready",
            phase: "refine",
            requestId,
            status: "complete",
            timingMs: nextPrompt.timingMs,
          }),
        );
      })
      .catch(() => {
        if (!isActiveRequest(requestId)) {
          return;
        }

        updateSessionForRequest(requestId, (currentSession) => ({
          ...currentSession,
          phases: {
            ...currentSession.phases,
            refine: "failed",
          },
        }));
        setErrorMessage("The follow-up question did not load yet.");
        updatePhaseEvent(
          buildPhaseEvent({
            detail: "Follow-up prompt request failed",
            phase: "refine",
            requestId,
            status: "failed",
          }),
        );
      })
      .finally(() => {
        if (isActiveRequest(requestId)) {
          setIsGeneratingPrompt(false);
        }
      });

    return true;
  }

  function startDiscoverySearch({ cacheMode = "", initialFollowUpNotes = "", queryOverride } = {}) {
    const normalizedQuery = String(queryOverride ?? productQuery).trim();

    if (!normalizedQuery) {
      console.info("[Focamai API] search request not attempted", {
        reason: "empty-query",
        stage: "startDiscoverySearch",
      });
      setErrorMessage("Enter a product query first.");
      setDiscoverySummary(null);
      return false;
    }

    if (shouldAskMarketplaceBeforeSearch) {
      console.info("[Focamai API] search request not attempted", {
        reason: "awaiting-marketplace-confirmation",
        stage: "startDiscoverySearch",
      });
      if (queryOverride !== undefined) {
        setProductQuery(normalizedQuery);
      }

      pendingMarketplaceSearchRef.current = {
        cacheMode,
        initialFollowUpNotes,
        queryOverride: normalizedQuery,
      };
      setErrorMessage("");
      setShowMarketplacePrompt(true);
      return false;
    }

    return runDiscoverySearch({ cacheMode, initialFollowUpNotes, queryOverride: normalizedQuery });
  }

  async function refreshDiscoveryForHardConstraints({
    constraintMatch,
    followUpNotes: notesForRequest,
    requestId,
    session,
  }) {
    const cachedRefresh = session.constraintRefresh;

    if (cachedRefresh?.requestId === requestId) {
      return cachedRefresh;
    }

    const refreshQuery = buildConstraintRefreshQuery(session.submittedQuery, notesForRequest);

    stopQueryQualityPolling({ clearSuggestion: true });
    updateSessionForRequest(requestId, (currentSession) => ({
      ...currentSession,
      phases: {
        ...currentSession.phases,
        constraintRefresh: "running",
      },
    }));
    updatePhaseEvent(
      buildPhaseEvent({
        detail: `Refreshing discovery for ${constraintMatch.matchedTerm || "hard constraint"}`,
        phase: "constraintRefresh",
        requestId,
        status: "running",
      }),
    );

    let payload;

    try {
      payload = await discoverProducts({
        amazonDomain: session.amazonDomain,
        cacheMode: "refresh",
        query: refreshQuery,
      });
    } catch (error) {
      if (isActiveRequest(requestId) && finalizingRequestIdRef.current === requestId) {
        updateSessionForRequest(requestId, (currentSession) => ({
          ...currentSession,
          phases: {
            ...currentSession.phases,
            constraintRefresh: "failed",
          },
        }));
        updatePhaseEvent(
          buildPhaseEvent({
            detail: "Constraint refresh request failed",
            phase: "constraintRefresh",
            requestId,
            status: "failed",
          }),
        );
      }

      throw error;
    }

    if (!isActiveRequest(requestId) || finalizingRequestIdRef.current !== requestId) {
      return null;
    }

    if (!payload.discoveryToken) {
      updateSessionForRequest(requestId, (currentSession) => ({
        ...currentSession,
        phases: {
          ...currentSession.phases,
          constraintRefresh: "failed",
        },
      }));
      updatePhaseEvent(
        buildPhaseEvent({
          detail: "Constraint refresh returned no session token",
          phase: "constraintRefresh",
          requestId,
          status: "failed",
        }),
      );
      throw new Error("This search session expired before it could be finalized. Start the search again.");
    }

    const nextSummary = buildRefreshedDiscoverySummary(
      payload,
      refreshQuery,
      session.amazonDomain,
    );
    const refreshedDiscovery = {
      amazonDomain: nextSummary.amazonDomain,
      candidatePool: nextSummary.candidatePool || session.candidatePool,
      constraintCategory: constraintMatch.category,
      discoveryToken: nextSummary.discoveryToken,
      matchedTerm: constraintMatch.matchedTerm,
      query: refreshQuery,
      requestId,
    };

    setDiscoverySummary(nextSummary);
    stopQueryQualityPolling({ clearSuggestion: true });
    updateSessionForRequest(requestId, (currentSession) => ({
      ...currentSession,
      amazonDomain: refreshedDiscovery.amazonDomain,
      candidatePool: refreshedDiscovery.candidatePool,
      candidateCount: nextSummary.candidateCount,
      constraintRefresh: refreshedDiscovery,
      discoveryToken: refreshedDiscovery.discoveryToken,
      phases: {
        ...currentSession.phases,
        constraintRefresh: "complete",
        discover: "complete",
      },
      previewCount: nextSummary.previewCount,
    }));
    updatePhaseEvent(
      buildPhaseEvent({
        detail: `${nextSummary.candidateCount} refreshed candidates for ${constraintMatch.matchedTerm}`,
        phase: "constraintRefresh",
        requestId,
        status: "complete",
        timingMs: nextSummary.timingMs,
      }),
    );

    return refreshedDiscovery;
  }

  async function finalizeFocusedPicks({ followUpNotesOverride } = {}) {
    const session = activeSearchSessionRef.current;
    const notesForRequest = String(followUpNotesOverride ?? followUpNotes).trim();

    if (finalizingRequestIdRef.current) {
      console.info("[Focamai API] finalize request not attempted", {
        reason: "finalize-already-running",
      });
      return false;
    }

    if (!session?.discoveryToken || !session?.submittedQuery) {
      console.info("[Focamai API] finalize request not attempted", {
        hasDiscoveryToken: Boolean(session?.discoveryToken),
        hasSubmittedQuery: Boolean(session?.submittedQuery),
        reason: "missing-session-data",
      });
      const requestId = session?.requestId || searchRequestIdRef.current;

      setErrorMessage("This search session expired. Start the search again before showing focused picks.");
      if (requestId) {
        updateSessionForRequest(requestId, (currentSession) => ({
          ...currentSession,
          phases: {
            ...currentSession.phases,
            finalize: "failed",
          },
        }));
        updatePhaseEvent(
          buildPhaseEvent({
            detail: "Finalize blocked because the discovery token is missing",
            phase: "finalize",
            requestId,
            status: "failed",
          }),
        );
      }
      return false;
    }

    const requestId = session.requestId;
    finalizingRequestIdRef.current = requestId;

    setIsFinalizing(true);
    setErrorMessage("");
    setFinalResults([]);
    updateSessionForRequest(requestId, (currentSession) => ({
      ...currentSession,
      phases: {
        ...currentSession.phases,
        finalize: "running",
      },
    }));
    updatePhaseEvent(
      buildPhaseEvent({
        detail: notesForRequest.trim() ? "Sending refined shortlist request" : "Sending shortlist request",
        phase: "finalize",
        requestId,
        status: "running",
      }),
    );
    stopEnrichmentPolling();

    try {
      let finalizeAmazonDomain = session.amazonDomain;
      let finalizeCandidatePool = session.candidatePool;
      let finalizeDiscoveryToken = session.discoveryToken;
      let finalizeQuery = session.submittedQuery;
      const constraintMatch = detectHardConstraint(notesForRequest);

      if (constraintMatch.shouldRefresh) {
        const refreshedDiscovery = await refreshDiscoveryForHardConstraints({
          constraintMatch,
          followUpNotes: notesForRequest,
          requestId,
          session,
        });

        if (!refreshedDiscovery) {
          return false;
        }

        finalizeAmazonDomain = refreshedDiscovery.amazonDomain;
        finalizeCandidatePool = refreshedDiscovery.candidatePool;
        finalizeDiscoveryToken = refreshedDiscovery.discoveryToken;
        finalizeQuery = refreshedDiscovery.query;
      }

      const payload = await finalizeSearch({
        amazonDomain: finalizeAmazonDomain,
        discoveryToken: finalizeDiscoveryToken,
        followUpNotes: notesForRequest,
        query: finalizeQuery,
      });

      if (!isActiveRequest(requestId) || finalizingRequestIdRef.current !== requestId) {
        return false;
      }

      const nextFinalResults = normalizeFinalResults(
        payload.results,
        finalizeCandidatePool,
        `${requestId}-${session.discoveryToken}`,
      );

      setFinalResults(nextFinalResults);
      if (nextFinalResults.length > 0) {
        void historyStore.save({
          amazonDomain: finalizeAmazonDomain,
          followUp: notesForRequest,
          query: session.submittedQuery,
          results: nextFinalResults,
        }).catch(() => {});
      }
      updateSessionForRequest(requestId, (currentSession) => ({
        ...currentSession,
        phases: {
          ...currentSession.phases,
          finalize: "complete",
        },
      }));
      updatePhaseEvent(
        buildPhaseEvent({
          detail: `${nextFinalResults.length} focused picks`,
          phase: "finalize",
          requestId,
          status: "complete",
          timingMs: payload.clientTimingMs,
        }),
      );
      if (shouldStartEnrichmentPolling(nextFinalResults)) {
        startEnrichmentPolling({
          amazonDomain: finalizeAmazonDomain,
          query: finalizeQuery,
          requestId,
          token: finalizeDiscoveryToken,
        });
      }

      return true;
    } catch (error) {
      if (!isActiveRequest(requestId) || finalizingRequestIdRef.current !== requestId) {
        return false;
      }

      updateSessionForRequest(requestId, (currentSession) => ({
        ...currentSession,
        phases: {
          ...currentSession.phases,
          finalize: "failed",
        },
      }));
      setErrorMessage(error instanceof Error ? error.message : "Unable to finalize results.");
      updatePhaseEvent(
        buildPhaseEvent({
          detail: "Finalize request failed",
          phase: "finalize",
          requestId,
          status: "failed",
        }),
      );
      return false;
    } finally {
      if (isActiveRequest(requestId) && finalizingRequestIdRef.current === requestId) {
        finalizingRequestIdRef.current = null;
        setIsFinalizing(false);
      }
    }
  }

  async function requestRetryAdvice({ rejectionFeedback } = {}) {
    const session = activeSearchSessionRef.current;
    const normalizedVisibleFeedback = retryFeedback.trim();
    const normalizedFeedback = String(rejectionFeedback ?? normalizedVisibleFeedback).trim();

    if (finalResults.length === 0 || !normalizedFeedback || isGeneratingRetryAdvice) {
      console.info("[Focamai API] retry-advice request not attempted", {
        hasFeedback: Boolean(normalizedFeedback),
        hasFinalResults: finalResults.length > 0,
        isGeneratingRetryAdvice,
      });
      return;
    }

    if (!session?.submittedQuery) {
      console.info("[Focamai API] retry-advice request not attempted", {
        reason: "missing-submitted-query",
      });
      setRetryAdvice(null);
      setRetryAdviceError("Start a fresh search before asking for a better direction.");
      return;
    }

    const requestId = retryAdviceRequestIdRef.current + 1;
    const snapshot = {
      feedback: normalizedFeedback,
      followUpNotes,
      requestId,
      resultsKey: getFinalResultsKey(finalResults),
      searchRequestId: session.requestId,
      submittedQuery: session.submittedQuery,
      visibleFeedback: normalizedVisibleFeedback,
    };

    retryAdviceRequestIdRef.current = requestId;
    setIsGeneratingRetryAdvice(true);
    setRetryAdvice(null);
    setRetryAdviceError("");
    setErrorMessage("");

    function isRetryAdviceRequestStale() {
      return (
        retryAdviceRequestIdRef.current !== snapshot.requestId ||
        activeSearchSessionRef.current?.requestId !== snapshot.searchRequestId ||
        activeSearchSessionRef.current?.submittedQuery !== snapshot.submittedQuery ||
        followUpNotesRef.current !== snapshot.followUpNotes ||
        retryFeedbackRef.current.trim() !== snapshot.visibleFeedback ||
        getFinalResultsKey(finalResultsRef.current) !== snapshot.resultsKey
      );
    }

    try {
      const payload = await getRetryAdvice({
        followUpNotes,
        query: session.submittedQuery,
        rejectionFeedback: normalizedFeedback,
        shortlist: finalResults.map((result) => ({
          title: result.title || "",
        })),
      });

      if (isRetryAdviceRequestStale()) {
        return;
      }

      setRetryAdvice({
        recommendation: payload.recommendation || "",
        rationale: payload.rationale || "",
        suggestedQuery: payload.suggestedQuery || "",
        timingMs: payload.clientTimingMs,
      });
    } catch (error) {
      if (isRetryAdviceRequestStale()) {
        return;
      }

      setRetryAdviceError(
        error instanceof Error
          ? error.message
          : "Unable to suggest a better search direction.",
      );
    } finally {
      if (retryAdviceRequestIdRef.current === snapshot.requestId) {
        setIsGeneratingRetryAdvice(false);
      }
    }
  }

  function dismissQuerySuggestion() {
    setQuerySuggestion(null);
  }

  function updateRetryFeedback(nextValue) {
    retryAdviceRequestIdRef.current += 1;
    setRetryAdvice(null);
    setRetryAdviceError("");
    setIsGeneratingRetryAdvice(false);
    setRetryFeedback(nextValue);
  }

  function applyRetrySuggestion(query) {
    const nextQuery = String(query || retryAdvice?.suggestedQuery || "").trim();

    if (!nextQuery) {
      setRetryAdviceError("Add a suggested search before starting again.");
      return false;
    }

    startDiscoverySearch({ cacheMode: "refresh", queryOverride: nextQuery });
    return true;
  }

  function loadDevFixture(scene) {
    if (!__DEV__) {
      return;
    }

    const {
      MOCK_DISCOVERY_SUMMARY,
      MOCK_FINAL_RESULTS,
      MOCK_PRODUCT_QUERY,
      MOCK_REFINEMENT_PROMPT,
    } = require("../dev/devFixtures");

    searchRequestIdRef.current += 1;
    finalizingRequestIdRef.current = null;
    stopEnrichmentPolling();
    stopQueryQualityPolling({ clearSuggestion: true, updateState: false });
    clearRetryAdviceState();

    const mockSession = {
      amazonDomain: "amazon.com",
      candidatePool: null,
      candidateCount: 24,
      constraintRefresh: null,
      discoveryToken: "dev-token-abc123",
      phases: { discover: "complete", finalize: "complete", refine: "complete" },
      previewCount: 6,
      requestId: searchRequestIdRef.current,
      submittedQuery: MOCK_PRODUCT_QUERY,
    };

    setProductQuery(MOCK_PRODUCT_QUERY);
    setDiscoverySummary(MOCK_DISCOVERY_SUMMARY);
    setRefinementPrompt(MOCK_REFINEMENT_PROMPT);
    setFollowUpNotes("");
    setErrorMessage("");
    setIsDiscovering(false);
    setIsGeneratingPrompt(false);
    setIsFinalizing(false);
    setPhaseEvents([]);
    setRetryFeedback("");
    setRetryAdvice(null);
    setRetryAdviceError("");

    if (scene === "results" || scene === "detail") {
      setFinalResults(MOCK_FINAL_RESULTS);
      finalResultsRef.current = MOCK_FINAL_RESULTS;
      mockSession.phases.finalize = "complete";
    } else {
      setFinalResults([]);
      finalResultsRef.current = [];
    }

    activeSearchSessionRef.current = mockSession;
    setActiveSearchSession(mockSession);
  }

  function applyQuerySuggestion() {
    const nextQuery = String(querySuggestion?.suggestedQuery || "").trim();

    if (!nextQuery) {
      dismissQuerySuggestion();
      return;
    }

    startDiscoverySearch({ queryOverride: nextQuery });
  }

  const previewItems = Array.isArray(discoverySummary?.previewItems)
    ? discoverySummary.previewItems
    : [];
  const canFinalize =
    Boolean(activeSearchSession?.discoveryToken && discoverySummary?.discoveryToken) && !isFinalizing;
  const canRequestRetryAdvice =
    finalResults.length > 0 &&
    !isFinalizing &&
    !isGeneratingRetryAdvice;
  const hasStartedSearch = Boolean(
    activeSearchSession || discoverySummary || refinementPrompt || isDiscovering || isGeneratingPrompt,
  );

  function hasMarketplaceScopedSearchState() {
    return Boolean(
      activeSearchSessionRef.current ||
        discoverySummary ||
        refinementPrompt ||
        finalResults.length > 0 ||
        isDiscovering ||
        isGeneratingPrompt ||
        isFinalizing,
    );
  }

  function resetSearchAfterMarketplaceChange(nextAmazonDomain) {
    const previousSession = activeSearchSessionRef.current;
    const resetRequestId = searchRequestIdRef.current + 1;

    searchRequestIdRef.current = resetRequestId;
    finalizingRequestIdRef.current = null;
    stopEnrichmentPolling();
    stopQueryQualityPolling({ clearSuggestion: true });
    clearRetryAdviceState();
    setSession(null);
    setIsDiscovering(false);
    setIsGeneratingPrompt(false);
    setIsFinalizing(false);
    setDiscoverySummary(null);
    setFinalResults([]);
    setFollowUpNotes("");
    setRefinementPrompt(null);
    setRetryFeedback("");
    setErrorMessage(
      `Amazon store changed to ${getAmazonMarketplaceLabel(nextAmazonDomain)}. Search again to use this store.`,
    );
    setPhaseEvents([
      buildPhaseEvent({
        detail: "Amazon store changed; previous marketplace-scoped responses will be ignored",
        eventKey: "marketplace-changed",
        phase: "session",
        requestId: previousSession?.requestId || resetRequestId,
        status: "stale",
      }),
    ]);
  }

  function setSelectedAmazonDomain(nextDomain) {
    const normalizedDomain = normalizeAmazonDomain(nextDomain) || DEFAULT_AMAZON_DOMAIN;
    const domainChanged = normalizedDomain !== selectedAmazonDomain;

    selectedAmazonDomainTouchedRef.current = true;
    setSelectedAmazonDomainState(normalizedDomain);
    saveAmazonMarketplaceSelection(normalizedDomain);
    setShouldAskMarketplaceBeforeSearch(false);
    pendingMarketplaceSearchRef.current = null;
    setShowMarketplacePrompt(false);

    if (domainChanged && hasMarketplaceScopedSearchState()) {
      resetSearchAfterMarketplaceChange(normalizedDomain);
    }
  }

  function confirmSelectedAmazonDomain(nextDomain = selectedAmazonDomain) {
    const normalizedDomain = normalizeAmazonDomain(nextDomain) || DEFAULT_AMAZON_DOMAIN;
    const domainChanged = normalizedDomain !== selectedAmazonDomain;
    const pendingSearch = pendingMarketplaceSearchRef.current;

    selectedAmazonDomainTouchedRef.current = true;
    setSelectedAmazonDomainState(normalizedDomain);
    saveAmazonMarketplaceSelection(normalizedDomain);
    setShouldAskMarketplaceBeforeSearch(false);
    pendingMarketplaceSearchRef.current = null;
    setShowMarketplacePrompt(false);

    if (pendingSearch) {
      return runDiscoverySearch({
        ...pendingSearch,
        amazonDomainOverride: normalizedDomain,
      });
    }

    if (domainChanged && hasMarketplaceScopedSearchState()) {
      resetSearchAfterMarketplaceChange(normalizedDomain);
    }

    return false;
  }

  return {
    activeSearchSession,
    canFinalize,
    canRequestRetryAdvice,
    dismissQuerySuggestion,
    discoverySummary,
    errorMessage,
    finalResults,
    finalizeFocusedPicks,
    followUpNotes,
    applyQuerySuggestion,
    isCheckingQueryQuality,
    isDiscovering,
    isFinalizing,
    isGeneratingRetryAdvice,
    isGeneratingPrompt,
    hasStartedSearch,
    phaseEvents,
    previewItems,
    productQuery,
    querySuggestion,
    refinementPrompt,
    requestRetryAdvice,
    retryAdvice,
    retryAdviceError,
    retryFeedback,
    selectedAmazonDomain,
    showMarketplacePrompt,
    confirmSelectedAmazonDomain,
    setFollowUpNotes,
    setProductQuery,
    setRetryFeedback: updateRetryFeedback,
    setSelectedAmazonDomain,
    startDiscoverySearch,
    applyRetrySuggestion,
    ...(__DEV__ ? { loadDevFixture } : {}),
  };
}
