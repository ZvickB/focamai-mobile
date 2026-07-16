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
import { useAuth } from "../contexts/useAuth";
import { normalizeRankingPreference } from "../lib/preferences/rankingPreference";
import { buildPhaseEvent, replacePhaseEvent } from "./searchPhaseEvents";
import { clearFlowSnapshot, readFlowSnapshot, saveFlowSnapshot } from "./searchFlowSnapshot";
import {
  createMobileAnalyticsRun,
  trackMobileAnalytics,
  trackMobileSearchStarted,
} from "../lib/mobileAnalytics";

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
      image:
        result.moderation?.outcome === "hide_image" || entry.moderation?.outcome === "hide_image"
          ? ""
          : entry.image || result.image,
      isPrime: Boolean(
        result.isPrime ||
        isPositivePrimeFlag(entry.isPrime) ||
        isPositivePrimeFlag(entry.is_prime),
      ),
      link: entry.link || result.link,
      moderation: entry.moderation || result.moderation,
    };
  });
}

export function mergeDeepDiveEligibilityIntoResults(currentResults, eligibility) {
  const decisions = Array.isArray(eligibility?.decisions)
    ? eligibility.decisions
    : Array.isArray(eligibility)
      ? eligibility
      : [];

  if (!Array.isArray(currentResults) || decisions.length === 0) {
    return currentResults;
  }

  const decisionsByCandidateId = new Map(
    decisions
      .map((decision) => {
        const candidateId = decision?.candidate_id || decision?.candidateId || decision?.id;
        return candidateId ? [String(candidateId), decision] : null;
      })
      .filter(Boolean),
  );

  return currentResults.map((result) => {
    const decision = decisionsByCandidateId.get(String(result.id));

    if (!decision) return result;

    return {
      ...result,
      deepDiveEligibility: {
        confidence: String(decision.confidence || "low"),
        mode: String(decision.mode || "hide"),
        reason: String(decision.reason || ""),
        recommendation: String(decision.recommendation || "hide"),
      },
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
  const { rankingPreference } = useAuth();
  const activeSearchSessionRef = useRef(null);
  const enrichmentPollTimerRef = useRef(null);
  const finalResultsRef = useRef([]);
  const finalizingRequestIdRef = useRef(null);
  const followUpNotesRef = useRef("");
  const queryQualityPollTimerRef = useRef(null);
  const retryFeedbackRef = useRef("");
  const retryAdviceRequestIdRef = useRef(0);
  const mobileAnalyticsRunRef = useRef(null);
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
  const [retryAdviceError, setRetryAdviceError] = useState("");
  const [retryFeedback, setRetryFeedback] = useState("");
  const [retrySearchQuery, setRetrySearchQuery] = useState("");
  const [shouldAskMarketplaceBeforeSearch, setShouldAskMarketplaceBeforeSearch] = useState(false);
  const [showMarketplacePrompt, setShowMarketplacePrompt] = useState(false);
  const [restoredFlowPhase, setRestoredFlowPhase] = useState(null);
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
    let hasReceivedEligibility = false;
    let hasReceivedEnrichment = false;

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
            enrich: hasReceivedEnrichment ? "complete" : "timeout",
          },
        }));
        updatePhaseEvent(
          buildPhaseEvent({
            detail: hasReceivedEnrichment
              ? "Pick explanations ready; optional comparison check ended"
              : "Enrichment was not ready yet",
            phase: "enrich",
            requestId,
            status: hasReceivedEnrichment ? "complete" : "timeout",
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
        const eligibilitySettled = Array.isArray(payload.deepDiveEligibility?.decisions);

        if (payload.ready && entries.length > 0) {
          hasReceivedEnrichment = true;
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
        }

        if (eligibilitySettled) {
          hasReceivedEligibility = true;
          setFinalResults((currentResults) =>
            mergeDeepDiveEligibilityIntoResults(currentResults, payload.deepDiveEligibility),
          );
        }

        if (hasReceivedEnrichment && hasReceivedEligibility) {
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
    const discoveryToken = activeSearchSession?.discoveryToken || discoverySummary?.discoveryToken;
    const submittedQuery = activeSearchSession?.submittedQuery || discoverySummary?.query;

    if (!discoveryToken || !submittedQuery) {
      return;
    }

    const baseSnapshot = {
      amazonDomain: activeSearchSession?.amazonDomain || discoverySummary?.amazonDomain || "",
      candidatePool: activeSearchSession?.candidatePool || discoverySummary?.candidatePool || null,
      discoveryToken,
      followUpNotes: followUpNotesRef.current,
      previewItems: Array.isArray(discoverySummary?.previewItems) ? discoverySummary.previewItems : [],
      productQuery,
      refinementPrompt,
      submittedQuery,
    };

    if (finalResults.length > 0) {
      void saveFlowSnapshot({ ...baseSnapshot, finalResults, phase: "results" });
      return;
    }

    if (refinementPrompt) {
      void saveFlowSnapshot({ ...baseSnapshot, phase: "refine" });
    }
  }, [activeSearchSession, discoverySummary, finalResults, productQuery, refinementPrompt]);

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

  useEffect(() => {
    let isMounted = true;

    readFlowSnapshot().then((snapshot) => {
      if (!isMounted || !snapshot || activeSearchSessionRef.current) {
        return;
      }

      const requestId = searchRequestIdRef.current + 1;
      searchRequestIdRef.current = requestId;

      const restoredSession = {
        amazonDomain: snapshot.amazonDomain || DEFAULT_AMAZON_DOMAIN,
        candidatePool: snapshot.candidatePool || null,
        candidateCount: Array.isArray(snapshot.candidatePool?.candidates)
          ? snapshot.candidatePool.candidates.length
          : 0,
        constraintRefresh: null,
        discoveryToken: snapshot.discoveryToken,
        phases: {
          discover: "complete",
          finalize: snapshot.phase === "results" ? "complete" : "idle",
          refine: "complete",
        },
        previewCount: Array.isArray(snapshot.previewItems) ? snapshot.previewItems.length : 0,
        requestId,
        submittedQuery: snapshot.submittedQuery,
      };

      setSession(restoredSession);
      setProductQuery(snapshot.productQuery || snapshot.submittedQuery || "");
      setFollowUpNotes(snapshot.followUpNotes || "");
      setDiscoverySummary({
        amazonDomain: restoredSession.amazonDomain,
        candidateCount: restoredSession.candidateCount,
        candidatePool: restoredSession.candidatePool,
        discoveryToken: restoredSession.discoveryToken,
        previewCount: restoredSession.previewCount,
        previewItems: Array.isArray(snapshot.previewItems) ? snapshot.previewItems : [],
        query: snapshot.submittedQuery,
        source: "restored",
        timingMs: undefined,
      });

      if (snapshot.refinementPrompt) {
        setRefinementPrompt(snapshot.refinementPrompt);
      }

      if (snapshot.phase === "results" && Array.isArray(snapshot.finalResults)) {
        setFinalResults(snapshot.finalResults);
      }

      setRestoredFlowPhase(snapshot.phase);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function clearRestoredFlowPhase() {
    setRestoredFlowPhase(null);
  }

  function runDiscoverySearch({
    amazonDomainOverride,
    cacheMode = "",
    initialFollowUpNotes = "",
    queryOverride,
    retrySearchQueryOverride = "",
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
    setRetrySearchQuery(String(retrySearchQueryOverride || "").trim());

    const nextSession = createSearchSession({
      amazonDomain: requestedAmazonDomain,
      requestId,
      submittedQuery: normalizedQuery,
    });
    const mobileAnalyticsRun = createMobileAnalyticsRun({
      amazonDomain: requestedAmazonDomain,
      query: normalizedQuery,
    });
    nextSession.mobileAnalyticsRun = mobileAnalyticsRun;
    mobileAnalyticsRunRef.current = mobileAnalyticsRun;
    trackMobileSearchStarted(mobileAnalyticsRun);

    setSession(nextSession);
    setIsDiscovering(true);
    setIsGeneratingPrompt(true);
    setIsFinalizing(false);
    setErrorMessage("");
    setDiscoverySummary(null);
    setFinalResults([]);
    setFollowUpNotes(String(initialFollowUpNotes ?? "").trim());
    void clearFlowSnapshot();
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
        trackMobileAnalytics(mobileAnalyticsRun, "search_failed", { stage: "discovery" });
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
        trackMobileAnalytics(mobileAnalyticsRun, "refinement_presented");
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
        trackMobileAnalytics(mobileAnalyticsRun, "search_failed", { stage: "refinement" });
      })
      .finally(() => {
        if (isActiveRequest(requestId)) {
          setIsGeneratingPrompt(false);
        }
      });

    return true;
  }

  function startDiscoverySearch({
    cacheMode = "",
    initialFollowUpNotes = "",
    queryOverride,
    retrySearchQueryOverride = "",
  } = {}) {
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
        retrySearchQueryOverride,
      };
      setErrorMessage("");
      setShowMarketplacePrompt(true);
      return false;
    }

    return runDiscoverySearch({
      cacheMode,
      initialFollowUpNotes,
      queryOverride: normalizedQuery,
      retrySearchQueryOverride,
    });
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
    const mobileAnalyticsRun = mobileAnalyticsRunRef.current;
    trackMobileAnalytics(mobileAnalyticsRun, "refinement_completed");
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
        rankingPreference: normalizeRankingPreference(rankingPreference),
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
      trackMobileAnalytics(mobileAnalyticsRun, "results_shown", {
        items: nextFinalResults.map((result, index) => ({
          badgeType: result.badgeType || result.badge_type || "",
          isBestPick: index === 0,
          position: index + 1,
          provider: result.provider || result.source || "",
          resultKey: result.id || result.title || "",
        })),
        query: session.submittedQuery,
        resultCount: nextFinalResults.length,
      });
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
      startEnrichmentPolling({
        amazonDomain: finalizeAmazonDomain,
        query: finalizeQuery,
        requestId,
        token: finalizeDiscoveryToken,
      });

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
      trackMobileAnalytics(mobileAnalyticsRun, "search_failed", { stage: "finalize" });
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
      return false;
    }

    if (!session?.submittedQuery) {
      console.info("[Focamai API] retry-advice request not attempted", {
        reason: "missing-submitted-query",
      });
      setRetryAdviceError("Start a fresh search before asking for a better direction.");
      return false;
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
    trackMobileAnalytics(mobileAnalyticsRunRef.current, "retry_started");
    setIsGeneratingRetryAdvice(true);
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
        return false;
      }

      const suggestedQuery = String(payload.suggestedQuery || "").trim();

      if (!suggestedQuery) {
        setRetryAdviceError("We couldn't prepare a safe updated search. Try changing your note.");
        return false;
      }

      return startDiscoverySearch({
        cacheMode: "refresh",
        queryOverride: suggestedQuery,
        retrySearchQueryOverride: suggestedQuery,
      });
    } catch (error) {
      if (isRetryAdviceRequestStale()) {
        return false;
      }

      setRetryAdviceError(
        error instanceof Error
          ? error.message
          : "Unable to suggest a better search direction.",
      );
      return false;
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
    setRetryAdviceError("");
    setIsGeneratingRetryAdvice(false);
    setRetryFeedback(nextValue);
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
    setRetrySearchQuery("");
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
    clearRestoredFlowPhase,
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
    restoredFlowPhase,
    retryAdviceError,
    retryFeedback,
    retrySearchQuery,
    selectedAmazonDomain,
    showMarketplacePrompt,
    confirmSelectedAmazonDomain,
    setFollowUpNotes,
    setProductQuery,
    setRetryFeedback: updateRetryFeedback,
    setSelectedAmazonDomain,
    startDiscoverySearch,
    ...(__DEV__ ? { loadDevFixture } : {}),
  };
}
