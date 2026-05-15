import { useRef, useState } from "react";
import {
  discoverProducts,
  finalizeSearch,
  getRefinementPrompt,
  normalizeFinalResults,
  normalizePreviewResults,
} from "./searchApi";
import { buildPhaseEvent, replacePhaseEvent } from "./searchPhaseEvents";

const DEFAULT_AMAZON_DOMAIN = "amazon.com";

function createSearchSession({ requestId, submittedQuery }) {
  return {
    amazonDomain: DEFAULT_AMAZON_DOMAIN,
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

function buildDiscoverySummary(discoveryPayload, query) {
  const candidates = Array.isArray(discoveryPayload.candidatePool?.candidates)
    ? discoveryPayload.candidatePool.candidates
    : [];
  const previewResults = Array.isArray(discoveryPayload.previewResults)
    ? discoveryPayload.previewResults
    : [];

  return {
    candidateCount: candidates.length,
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

export function useMobileSearchController() {
  const activeSearchSessionRef = useRef(null);
  const finalizingRequestIdRef = useRef(null);
  const searchRequestIdRef = useRef(0);
  const [activeSearchSession, setActiveSearchSession] = useState(null);
  const [productQuery, setProductQuery] = useState("");
  const [discoverySummary, setDiscoverySummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [finalResults, setFinalResults] = useState([]);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [phaseEvents, setPhaseEvents] = useState([]);
  const [refinementPrompt, setRefinementPrompt] = useState(null);

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

  function startDiscoverySearch() {
    const normalizedQuery = productQuery.trim();

    if (!normalizedQuery) {
      setErrorMessage("Enter a product query first.");
      setDiscoverySummary(null);
      return;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    const previousSession = activeSearchSessionRef.current;
    const previousSessionWasRunning =
      Boolean(previousSession) && (hasRunningPhase(previousSession) || finalizingRequestIdRef.current);
    finalizingRequestIdRef.current = null;

    const nextSession = createSearchSession({
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
        detail: "Starting discovery request",
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

    discoverProducts({ query: normalizedQuery })
      .then((discoveryPayload) => {
        if (!isActiveRequest(requestId)) {
          return;
        }

        const nextSummary = buildDiscoverySummary(discoveryPayload, normalizedQuery);

        setDiscoverySummary(nextSummary);
        if (!nextSummary.discoveryToken) {
          updateSessionForRequest(requestId, (currentSession) => ({
            ...currentSession,
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
            detail: `${nextSummary.candidateCount} candidates, ${nextSummary.previewCount} preview results`,
            phase: "discover",
            requestId,
            status: "complete",
            timingMs: nextSummary.timingMs,
          }),
        );
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

  async function finalizeFocusedPicks() {
    const session = activeSearchSessionRef.current;

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
        detail: followUpNotes.trim() ? "Sending refined shortlist request" : "Sending shortlist request",
        phase: "finalize",
        requestId,
        status: "running",
      }),
    );

    try {
      const payload = await finalizeSearch({
        discoveryToken: session.discoveryToken,
        followUpNotes,
        query: session.submittedQuery,
      });

      if (!isActiveRequest(requestId) || finalizingRequestIdRef.current !== requestId) {
        return;
      }

      const nextFinalResults = normalizeFinalResults(payload.results);

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

  const previewItems = Array.isArray(discoverySummary?.previewItems)
    ? discoverySummary.previewItems
    : [];
  const canFinalize =
    Boolean(activeSearchSession?.discoveryToken && discoverySummary?.discoveryToken) && !isFinalizing;
  const hasStartedSearch = Boolean(
    activeSearchSession || discoverySummary || refinementPrompt || isDiscovering || isGeneratingPrompt,
  );

  return {
    activeSearchSession,
    canFinalize,
    discoverySummary,
    errorMessage,
    finalResults,
    finalizeFocusedPicks,
    followUpNotes,
    isDiscovering,
    isFinalizing,
    isGeneratingPrompt,
    hasStartedSearch,
    phaseEvents,
    previewItems,
    productQuery,
    refinementPrompt,
    setFollowUpNotes,
    setProductQuery,
    startDiscoverySearch,
  };
}
