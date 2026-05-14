import { useRef, useState } from "react";
import {
  discoverProducts,
  finalizeSearch,
  getRefinementPrompt,
  normalizeFinalResults,
  normalizePreviewResults,
} from "./searchApi";

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
  const [refinementPrompt, setRefinementPrompt] = useState(null);

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
    setRefinementPrompt(null);

    discoverProducts({ query: normalizedQuery })
      .then((discoveryPayload) => {
        if (searchRequestIdRef.current !== requestId) {
          return;
        }

        setDiscoverySummary(buildDiscoverySummary(discoveryPayload, normalizedQuery));
      })
      .catch((error) => {
        if (searchRequestIdRef.current !== requestId) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unable to run discovery.");
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

        setRefinementPrompt(buildRefinementPrompt(refinementPayload));
      })
      .catch(() => {
        if (searchRequestIdRef.current !== requestId) {
          return;
        }

        setErrorMessage("The follow-up question did not load yet.");
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

    setIsFinalizing(true);
    setErrorMessage("");
    setFinalResults([]);

    try {
      const payload = await finalizeSearch({
        discoveryToken: discoverySummary.discoveryToken,
        followUpNotes,
        query: discoverySummary.query,
      });

      setFinalResults(normalizeFinalResults(payload.results));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to finalize results.");
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
    previewItems,
    productQuery,
    refinementPrompt,
    setFollowUpNotes,
    setProductQuery,
    startDiscoverySearch,
  };
}
