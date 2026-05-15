import { useRef, useState } from "react";
import {
  discoverProducts,
  finalizeSearch,
  getRefinementPrompt,
  normalizeFinalResults,
  normalizePreviewResults,
} from "./searchApi";
import { buildPhaseEvent, replacePhaseEvent } from "./searchPhaseEvents";

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
  const searchRequestIdRef = useRef(0);
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

  function startDiscoverySearch() {
    const normalizedQuery = productQuery.trim();

    if (!normalizedQuery) {
      setErrorMessage("Enter a product query first.");
      setDiscoverySummary(null);
      return;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    setIsDiscovering(true);
    setIsGeneratingPrompt(true);
    setErrorMessage("");
    setDiscoverySummary(null);
    setFinalResults([]);
    setFollowUpNotes("");
    setPhaseEvents([
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
        if (searchRequestIdRef.current !== requestId) {
          return;
        }

        const nextSummary = buildDiscoverySummary(discoveryPayload, normalizedQuery);

        setDiscoverySummary(nextSummary);
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
        if (searchRequestIdRef.current !== requestId) {
          return;
        }

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
        if (searchRequestIdRef.current === requestId) {
          setIsDiscovering(false);
        }
      });

    getRefinementPrompt({ query: normalizedQuery })
      .then((refinementPayload) => {
        if (searchRequestIdRef.current !== requestId) {
          return;
        }

        const nextPrompt = buildRefinementPrompt(refinementPayload);

        setRefinementPrompt(nextPrompt);
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
        if (searchRequestIdRef.current !== requestId) {
          return;
        }

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
        if (searchRequestIdRef.current === requestId) {
          setIsGeneratingPrompt(false);
        }
      });
  }

  async function finalizeFocusedPicks() {
    if (!discoverySummary?.discoveryToken || !discoverySummary?.query || isFinalizing) {
      return;
    }

    const requestId = searchRequestIdRef.current;

    setIsFinalizing(true);
    setErrorMessage("");
    setFinalResults([]);
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
        discoveryToken: discoverySummary.discoveryToken,
        followUpNotes,
        query: discoverySummary.query,
      });
      const nextFinalResults = normalizeFinalResults(payload.results);

      setFinalResults(nextFinalResults);
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
      setIsFinalizing(false);
    }
  }

  const previewItems = Array.isArray(discoverySummary?.previewItems)
    ? discoverySummary.previewItems
    : [];
  const canFinalize = Boolean(discoverySummary?.discoveryToken) && !isFinalizing;
  const hasStartedSearch = Boolean(discoverySummary || refinementPrompt || isDiscovering || isGeneratingPrompt);

  return {
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
