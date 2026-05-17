import { useEffect, useRef, useState } from "react";
import {
  discoverProducts,
  finalizeSearch,
  getRetryAdvice,
  getRefinementPrompt,
  normalizeFinalResults,
  normalizePreviewResults,
  pollEnrichment,
  pollQueryQuality,
} from "./searchApi";
import {
  DEFAULT_AMAZON_DOMAIN,
  hasSeenAmazonMarketplacePrompt,
  loadAmazonMarketplacePreference,
  getAmazonMarketplaceLabel,
  normalizeAmazonDomain,
  saveAmazonMarketplacePromptSeen,
  saveAmazonDomainPreference,
} from "./amazonMarketplaces";
import { buildPhaseEvent, replacePhaseEvent } from "./searchPhaseEvents";

const ENRICHMENT_POLL_INTERVAL_MS = 1500;
const ENRICHMENT_POLL_TIMEOUT_MS = 30000;
const QUERY_QUALITY_POLL_INTERVAL_MS = 1500;
const QUERY_QUALITY_POLL_TIMEOUT_MS = 20000;
const MAX_RETRY_COUNT = 2;

function createSearchSession({ amazonDomain, requestId, submittedQuery }) {
  return {
    amazonDomain,
    candidatePool: null,
    candidateCount: 0,
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
    timingMs: refinementPayload.clientTimingMs,
  };
}

function mergeEnrichmentIntoResults(currentResults, entries) {
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

    return {
      ...result,
      caveat: entry.caveat ?? result.caveat,
      feature_bullets: Array.isArray(entry.feature_bullets)
        ? entry.feature_bullets
        : Array.isArray(entry.featureBullets)
          ? entry.featureBullets
          : result.feature_bullets,
      fit_reason: entry.fit_reason ?? entry.fitReason ?? result.fit_reason,
      image: entry.image || result.image,
      link: entry.link || result.link,
    };
  });
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
  const [isApplyingQuerySuggestion, setIsApplyingQuerySuggestion] = useState(false);
  const [isCheckingQueryQuality, setIsCheckingQueryQuality] = useState(false);
  const [phaseEvents, setPhaseEvents] = useState([]);
  const [querySuggestion, setQuerySuggestion] = useState(null);
  const [refinementPrompt, setRefinementPrompt] = useState(null);
  const [retryAdvice, setRetryAdvice] = useState(null);
  const [retryAdviceError, setRetryAdviceError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [retryFeedback, setRetryFeedback] = useState("");
  const [showMarketplacePrompt, setShowMarketplacePrompt] = useState(false);

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
      setIsApplyingQuerySuggestion(false);
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
          const shouldShowSuggestion = Boolean(payload.shouldSuggest && payload.suggestedQuery);

          if (shouldShowSuggestion) {
            setQuerySuggestion({
              amazonDomain,
              classification: payload.classification || "",
              confidence: payload.confidence || "",
              originalQuery: payload.originalQuery || query,
              query,
              reason: payload.reason || "",
              requestId,
              suggestedQuery: payload.suggestedQuery,
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
    ]).then(([preference, hasSeenPrompt]) => {
      if (isMounted && !selectedAmazonDomainTouchedRef.current) {
        setSelectedAmazonDomainState(preference.domain);
        setShowMarketplacePrompt(!preference.hasSavedPreference && !hasSeenPrompt);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function startDiscoverySearch({ cacheMode = "", queryOverride } = {}) {
    const normalizedQuery = String(queryOverride ?? productQuery).trim();
    const requestedAmazonDomain = normalizeAmazonDomain(selectedAmazonDomain) || DEFAULT_AMAZON_DOMAIN;

    if (!normalizedQuery) {
      setErrorMessage("Enter a product query first.");
      setDiscoverySummary(null);
      return;
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
    setFollowUpNotes("");
    setRetryCount(0);
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
  }

  async function finalizeFocusedPicks({ followUpNotesOverride } = {}) {
    const session = activeSearchSessionRef.current;
    const notesForRequest = followUpNotesOverride ?? followUpNotes;

    if (finalizingRequestIdRef.current) {
      return;
    }

    if (!session?.discoveryToken || !session?.submittedQuery) {
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
      return;
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
      const payload = await finalizeSearch({
        amazonDomain: session.amazonDomain,
        discoveryToken: session.discoveryToken,
        followUpNotes: notesForRequest,
        query: session.submittedQuery,
      });

      if (!isActiveRequest(requestId) || finalizingRequestIdRef.current !== requestId) {
        return;
      }

      const nextFinalResults = normalizeFinalResults(payload.results, session.candidatePool);

      setFinalResults(nextFinalResults);
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
      if (
        nextFinalResults.length > 0 &&
        !nextFinalResults.some((result) => Boolean(result.fit_reason))
      ) {
        startEnrichmentPolling({
          amazonDomain: session.amazonDomain,
          query: session.submittedQuery,
          requestId,
          token: session.discoveryToken,
        });
      }
    } catch (error) {
      if (!isActiveRequest(requestId) || finalizingRequestIdRef.current !== requestId) {
        return;
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
      return;
    }

    if (!session?.submittedQuery) {
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

    try {
      const payload = await getRetryAdvice({
        followUpNotes,
        query: session.submittedQuery,
        rejectionFeedback: normalizedFeedback,
        shortlist: finalResults.map((result) => ({
          title: result.title || "",
        })),
      });

      const isStale =
        retryAdviceRequestIdRef.current !== snapshot.requestId ||
        activeSearchSessionRef.current?.requestId !== snapshot.searchRequestId ||
        activeSearchSessionRef.current?.submittedQuery !== snapshot.submittedQuery ||
        followUpNotesRef.current !== snapshot.followUpNotes ||
        retryFeedbackRef.current.trim() !== snapshot.visibleFeedback ||
        getFinalResultsKey(finalResultsRef.current) !== snapshot.resultsKey;

      if (isStale) {
        return;
      }

      setRetryAdvice({
        recommendation: payload.recommendation || "",
        rationale: payload.rationale || "",
        suggestedQuery: payload.suggestedQuery || "",
        timingMs: payload.clientTimingMs,
      });
    } catch (error) {
      const isStale =
        retryAdviceRequestIdRef.current !== snapshot.requestId ||
        activeSearchSessionRef.current?.requestId !== snapshot.searchRequestId ||
        activeSearchSessionRef.current?.submittedQuery !== snapshot.submittedQuery ||
        followUpNotesRef.current !== snapshot.followUpNotes ||
        retryFeedbackRef.current.trim() !== snapshot.visibleFeedback ||
        getFinalResultsKey(finalResultsRef.current) !== snapshot.resultsKey;

      if (isStale) {
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

  async function submitRetry() {
    const session = activeSearchSessionRef.current;
    const normalizedFeedback = retryFeedback.trim();

    if (finalizingRequestIdRef.current) {
      return;
    }

    if (finalResults.length === 0 || !normalizedFeedback || retryCount >= MAX_RETRY_COUNT) {
      return;
    }

    if (!session?.discoveryToken || !session?.submittedQuery) {
      const requestId = session?.requestId || searchRequestIdRef.current;

      setErrorMessage("This search session expired. Start the search again before trying again.");
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
            detail: "Retry blocked because the discovery token is missing",
            eventKey: "finalize-retry-blocked",
            phase: "finalize",
            requestId,
            status: "failed",
          }),
        );
      }
      return;
    }

    const requestId = session.requestId;
    const nextRetryCount = retryCount + 1;
    const retryEventKey = `finalize-retry-${nextRetryCount}`;
    finalizingRequestIdRef.current = requestId;

    setIsFinalizing(true);
    setErrorMessage("");
    updateSessionForRequest(requestId, (currentSession) => ({
      ...currentSession,
      phases: {
        ...currentSession.phases,
        finalize: "running",
      },
    }));
    updatePhaseEvent(
      buildPhaseEvent({
        detail: `Sending retry ${nextRetryCount} request`,
        eventKey: retryEventKey,
        phase: "finalize",
        requestId,
        status: "running",
      }),
    );
    stopEnrichmentPolling();

    try {
      const payload = await finalizeSearch({
        amazonDomain: session.amazonDomain,
        discoveryToken: session.discoveryToken,
        excludedCandidateIds: finalResults.map((result) => result.id).filter(Boolean),
        followUpNotes,
        query: session.submittedQuery,
        rejectionFeedback: normalizedFeedback,
        retryCount: nextRetryCount,
      });

      if (!isActiveRequest(requestId) || finalizingRequestIdRef.current !== requestId) {
        return;
      }

      const nextFinalResults = normalizeFinalResults(payload.results, session.candidatePool);

      setFinalResults(nextFinalResults);
      setRetryCount(nextRetryCount);
      setRetryFeedback("");
      setRetryAdvice(null);
      setRetryAdviceError("");
      updateSessionForRequest(requestId, (currentSession) => ({
        ...currentSession,
        phases: {
          ...currentSession.phases,
          finalize: "complete",
        },
      }));
      updatePhaseEvent(
        buildPhaseEvent({
          detail: `${nextFinalResults.length} replacement focused picks`,
          eventKey: retryEventKey,
          phase: "finalize",
          requestId,
          status: "complete",
          timingMs: payload.clientTimingMs,
        }),
      );
      if (
        nextFinalResults.length > 0 &&
        !nextFinalResults.some((result) => Boolean(result.fit_reason))
      ) {
        startEnrichmentPolling({
          amazonDomain: session.amazonDomain,
          query: session.submittedQuery,
          requestId,
          token: session.discoveryToken,
        });
      }
    } catch (error) {
      if (!isActiveRequest(requestId) || finalizingRequestIdRef.current !== requestId) {
        return;
      }

      updateSessionForRequest(requestId, (currentSession) => ({
        ...currentSession,
        phases: {
          ...currentSession.phases,
          finalize: "failed",
        },
      }));
      setErrorMessage(error instanceof Error ? error.message : "Unable to retry focused picks.");
      updatePhaseEvent(
        buildPhaseEvent({
          detail: "Retry finalize request failed",
          eventKey: retryEventKey,
          phase: "finalize",
          requestId,
          status: "failed",
        }),
      );
    } finally {
      if (isActiveRequest(requestId) && finalizingRequestIdRef.current === requestId) {
        finalizingRequestIdRef.current = null;
        setIsFinalizing(false);
      }
    }
  }

  function dismissQuerySuggestion() {
    setQuerySuggestion(null);
    setIsApplyingQuerySuggestion(false);
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

  function applyQuerySuggestion() {
    const nextQuery = String(querySuggestion?.suggestedQuery || "").trim();

    if (!nextQuery) {
      dismissQuerySuggestion();
      return;
    }

    setIsApplyingQuerySuggestion(true);
    startDiscoverySearch({ queryOverride: nextQuery });
    setIsApplyingQuerySuggestion(false);
  }

  const previewItems = Array.isArray(discoverySummary?.previewItems)
    ? discoverySummary.previewItems
    : [];
  const canFinalize =
    Boolean(activeSearchSession?.discoveryToken && discoverySummary?.discoveryToken) && !isFinalizing;
  const canRetry =
    finalResults.length > 0 &&
    retryFeedback.trim().length > 0 &&
    retryCount < MAX_RETRY_COUNT &&
    !isFinalizing;
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
    setRetryCount(0);
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
    saveAmazonDomainPreference(normalizedDomain);
    saveAmazonMarketplacePromptSeen();
    setShowMarketplacePrompt(false);

    if (domainChanged && hasMarketplaceScopedSearchState()) {
      resetSearchAfterMarketplaceChange(normalizedDomain);
    }
  }

  function confirmSelectedAmazonDomain() {
    selectedAmazonDomainTouchedRef.current = true;
    saveAmazonDomainPreference(selectedAmazonDomain);
    saveAmazonMarketplacePromptSeen();
    setShowMarketplacePrompt(false);
  }

  return {
    activeSearchSession,
    canFinalize,
    canRetry,
    canRequestRetryAdvice,
    dismissQuerySuggestion,
    discoverySummary,
    errorMessage,
    finalResults,
    finalizeFocusedPicks,
    followUpNotes,
    applyQuerySuggestion,
    isApplyingQuerySuggestion,
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
    retryCount,
    retryFeedback,
    selectedAmazonDomain,
    showMarketplacePrompt,
    confirmSelectedAmazonDomain,
    setFollowUpNotes,
    setProductQuery,
    setRetryFeedback: updateRetryFeedback,
    setSelectedAmazonDomain,
    startDiscoverySearch,
    submitRetry,
    applyRetrySuggestion,
  };
}
