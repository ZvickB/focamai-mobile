import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useSearchProgress } from "../../contexts/SearchProgressContext";
import {
  createAnalyticsSearchId,
  getOrCreateAnalyticsSessionId,
  trackAnalytics,
} from "../../lib/analytics";
import { SEARCH_API_PATHS, buildApiUrl } from "../../lib/api";
import { validateSearchInput } from "../../shared/search-input";
import { enrichFinalResultsForDisplay } from "./resultPresentation";

export const RESULT_CARD_COUNT = 6;
export const RESULT_CARD_SLOTS = Array.from({ length: RESULT_CARD_COUNT }, (_, index) => index);
export const MAX_REFINEMENT_RETRIES = 2;

const FINAL_RESULT_BADGE_REVEAL_DELAY_MS = 240;
const ENRICHMENT_POLL_INTERVAL_MS = 1500;
const ENRICHMENT_POLL_TIMEOUT_MS = 30000;
const FINALIZE_REQUEST_TIMEOUT_MS = 45000;
const MAX_RENDERED_DEBUG_RESULTS = RESULT_CARD_COUNT;
const FINALIZE_REQUEST_MODE_DEFAULT = "guided_finalize";
const FINALIZE_REQUEST_MODE_EMPTY_NOTES = "guided_empty_notes";
const FINALIZE_REQUEST_MODE_REFINED = "guided_refined";
const FINALIZE_REQUEST_MODE_RETRY = "guided_retry";
const DEFAULT_AMAZON_DOMAIN = "amazon.com";

function nowMs() {
  return Date.now();
}

function roundTiming(value) {
  return Math.round(value * 10) / 10;
}

function parseServerTimingHeader(headerValue) {
  if (!headerValue || typeof headerValue !== "string") {
    return {};
  }

  return Object.fromEntries(
    headerValue
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [namePart, ...params] = entry.split(";").map((part) => part.trim());
        const durationParam = params.find((part) => part.startsWith("dur="));
        const duration = durationParam ? Number(durationParam.slice(4)) : null;

        return [namePart, Number.isFinite(duration) ? duration : null];
      })
      .filter(([, duration]) => Number.isFinite(duration)),
  );
}

function createFallbackRefinementPrompt(productQuery) {
  return {
    prompt: `What should we optimize for with this ${productQuery}?`,
    helperText:
      "Use this step for natural-language details like budget, size, comfort, style, or where you plan to use it.",
    followUpPlaceholder:
      "Example: I want something lightweight for daily travel, under $200, and easy to clean.",
  };
}

function isBackgroundFramingDisabled() {
  return globalThis.__FOCAMAI_DISABLE_BACKGROUND_FRAMING__ === true;
}

function isEnrichmentPollingDisabled() {
  return globalThis.__FOCAMAI_DISABLE_ENRICHMENT_POLLING__ === true;
}

function createExpiredSessionMessage() {
  return "Your search session expired. Start a new search.";
}

function sanitizeCandidatePool(pool) {
  if (!pool || typeof pool !== "object" || Array.isArray(pool)) {
    return null;
  }

  const safeCandidates = Array.isArray(pool.candidates)
    ? pool.candidates.filter((candidate) => candidate && typeof candidate === "object")
    : [];

  return {
    ...pool,
    candidates: safeCandidates,
  };
}

function appendAmazonDomain(searchParams, amazonDomain) {
  if (amazonDomain) {
    searchParams.set("amazonDomain", amazonDomain);
  }
}

function resolveSubmittedAmazonDomain(payload, fallbackAmazonDomain = "") {
  return (
    payload?.amazonDomain ||
    payload?.candidatePool?.amazonDomain ||
    payload?.candidatePool?.marketplace ||
    fallbackAmazonDomain ||
    DEFAULT_AMAZON_DOMAIN
  );
}

function normalizeResultItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return {
    ...item,
    id: String(item.id ?? ""),
    title: typeof item.title === "string" ? item.title : "",
    subtitle: typeof item.subtitle === "string" ? item.subtitle : "",
    price: typeof item.price === "string" ? item.price : item.price == null ? "" : String(item.price),
    rating: Number.isFinite(Number(item.rating)) ? Number(item.rating) : null,
    reviewCount: Number.isFinite(Number(item.reviewCount)) ? Number(item.reviewCount) : null,
    description: typeof item.description === "string" ? item.description : "",
    fit_reason: typeof item.fit_reason === "string" ? item.fit_reason : "",
    caveat: typeof item.caveat === "string" ? item.caveat : "",
    badgeLabel: typeof item.badgeLabel === "string" ? item.badgeLabel : "",
    image: typeof item.image === "string" ? item.image : "",
    link: typeof item.link === "string" ? item.link : "",
    feature_bullets: Array.isArray(item.feature_bullets)
      ? item.feature_bullets.filter((entry) => typeof entry === "string")
      : [],
  };
}

function normalizeResultList(items, { limit = RESULT_CARD_COUNT } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const normalizedResults = items.map(normalizeResultItem).filter(Boolean);

  return Number.isFinite(limit) ? normalizedResults.slice(0, limit) : normalizedResults;
}

function extractFinalizeResults(payload) {
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.finalizeFast?.shortlist)) {
    return payload.finalizeFast.shortlist;
  }

  return [];
}

async function readJsonResponse(response, requestStartedAt) {
  const responseReceivedAt = nowMs();
  const rawBody = await response.text();
  const responseParsedAt = nowMs();
  const requestId = response.headers?.get?.("x-request-id") || "";
  const contentType = response.headers?.get?.("content-type") || "";
  let payload = {};

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      const bodyPreview = rawBody.trim().slice(0, 120);
      const receivedHtml = contentType.includes("text/html") || /^<!doctype html/i.test(bodyPreview);

      throw new Error(
        receivedHtml
          ? "The server returned HTML instead of JSON. This usually means the deployment route or rewrite handled the API request incorrectly."
          : "The server returned an invalid response. Check the local server or Vercel logs.",
      );
    }
  }

  if (!response.ok) {
    const baseMessage = payload.error || "Request failed.";
    throw new Error(requestId ? `${baseMessage} (request ${requestId})` : baseMessage);
  }

  return {
    ...payload,
    timing: {
      client: {
        roundTripMs: roundTiming(responseReceivedAt - requestStartedAt),
        responseReadMs: roundTiming(responseParsedAt - responseReceivedAt),
        totalMs: roundTiming(responseParsedAt - requestStartedAt),
      },
      server: parseServerTimingHeader(response.headers?.get?.("server-timing") || ""),
    },
  };
}

async function fetchDiscoveryResults(query, { signal } = {}) {
  const searchParams = new URLSearchParams({ query });
  const requestStartedAt = nowMs();
  const response = await fetch(buildApiUrl(`${SEARCH_API_PATHS.rainforestDiscover}?${searchParams.toString()}`), {
    signal,
  });
  return readJsonResponse(response, requestStartedAt);
}

async function fetchRefinementPrompt(query, { signal } = {}) {
  const searchParams = new URLSearchParams({ query });
  const requestStartedAt = nowMs();
  const response = await fetch(buildApiUrl(`${SEARCH_API_PATHS.refine}?${searchParams.toString()}`), {
    signal,
  });
  return readJsonResponse(response, requestStartedAt);
}

async function fetchFramingFields(query, { signal } = {}) {
  const searchParams = new URLSearchParams({ query });
  const requestStartedAt = nowMs();
  const response = await fetch(buildApiUrl(`${SEARCH_API_PATHS.framingFields}?${searchParams.toString()}`), {
    signal,
  });
  return readJsonResponse(response, requestStartedAt);
}

async function probeFinalizeRequest({
  query,
  amazonDomain,
  discoveryToken,
  followUpNotes,
  rejectionFeedback,
  retryCount,
  excludedCandidateIds,
  requestMode,
}) {
  console.log("[mobile-guided-search] finalize probe sent", {
    hasDiscoveryToken: Boolean(discoveryToken),
    amazonDomain,
    query,
    requestMode,
    retryCount,
  });

  const response = await fetch(buildApiUrl(SEARCH_API_PATHS.finalize), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      amazonDomain,
      discoveryToken,
      followUpNotes,
      rejectionFeedback,
      retryCount,
      excludedCandidateIds,
      requestMode,
    }),
  });

  const rawBody = await response.text();

  console.log("[mobile-guided-search] finalize probe response", {
    ok: response.ok,
    status: response.status,
    requestId: response.headers?.get?.("x-request-id") || "",
    bodyPreview: rawBody.trim().slice(0, 400),
  });

  return {
    ok: response.ok,
    status: response.status,
    bodyPreview: rawBody.trim().slice(0, 400),
  };
}

async function probeSimpleFinalizeRoute({
  query,
  amazonDomain,
  discoveryToken,
  requestMode,
}) {
  console.log("[mobile-guided-search] simple finalize probe sent", {
    hasDiscoveryToken: Boolean(discoveryToken),
    amazonDomain,
    query,
    requestMode,
  });

  const response = await fetch(buildApiUrl("/api/search/finalize-probe"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      amazonDomain,
      discoveryToken,
      requestMode,
    }),
  });

  const rawBody = await response.text();

  console.log("[mobile-guided-search] simple finalize probe response", {
    ok: response.ok,
    status: response.status,
    requestId: response.headers?.get?.("x-request-id") || "",
    bodyPreview: rawBody.trim().slice(0, 400),
  });

  return {
    ok: response.ok,
    status: response.status,
    bodyPreview: rawBody.trim().slice(0, 400),
  };
}

function createFinalizeAbortState(externalSignal) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, FINALIZE_REQUEST_TIMEOUT_MS);

  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
    return {
      signal: externalSignal
        ? AbortSignal.any([externalSignal, timeoutController.signal])
        : timeoutController.signal,
      cleanup() {
        clearTimeout(timeoutId);
      },
      wasTimedOut() {
        return timeoutController.signal.aborted && !externalSignal?.aborted;
      },
      wasCanceled() {
        return Boolean(externalSignal?.aborted);
      },
    };
  }

  const requestController = new AbortController();
  const abortFromExternalSignal = () => {
    requestController.abort();
  };
  const canListenToExternalAbort =
    externalSignal &&
    typeof externalSignal.addEventListener === "function" &&
    typeof externalSignal.removeEventListener === "function";

  if (externalSignal?.aborted) {
    requestController.abort();
  } else if (canListenToExternalAbort) {
    externalSignal.addEventListener("abort", abortFromExternalSignal, { once: true });
  }

  const abortFromTimeout = () => {
    requestController.abort();
  };

  if (timeoutController.signal.aborted) {
    requestController.abort();
  } else if (
    typeof timeoutController.signal.addEventListener === "function" &&
    typeof timeoutController.signal.removeEventListener === "function"
  ) {
    timeoutController.signal.addEventListener("abort", abortFromTimeout, { once: true });
  }

  return {
    signal: requestController.signal,
    cleanup() {
      clearTimeout(timeoutId);

      if (canListenToExternalAbort) {
        externalSignal.removeEventListener("abort", abortFromExternalSignal);
      }

      if (
        typeof timeoutController.signal.removeEventListener === "function" &&
        typeof timeoutController.signal.addEventListener === "function"
      ) {
        timeoutController.signal.removeEventListener("abort", abortFromTimeout);
      }
    },
    wasTimedOut() {
      return timeoutController.signal.aborted && !externalSignal?.aborted;
    },
    wasCanceled() {
      return Boolean(externalSignal?.aborted);
    },
  };
}

async function finalizeGuidedSearch({
  query,
  amazonDomain,
  discoveryToken,
  followUpNotes,
  rejectionFeedback,
  retryCount,
  excludedCandidateIds,
  requestMode = FINALIZE_REQUEST_MODE_DEFAULT,
  signal,
}) {
  const requestStartedAt = nowMs();
  const abortState = createFinalizeAbortState(signal);

  try {
    console.log("[mobile-guided-search] finalize request sent", {
      query,
      amazonDomain,
      hasDiscoveryToken: Boolean(discoveryToken),
      requestMode,
      retryCount,
    });

    const response = await fetch(buildApiUrl(SEARCH_API_PATHS.finalize), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: abortState.signal,
      body: JSON.stringify({
        query,
        amazonDomain,
        discoveryToken,
        followUpNotes,
        rejectionFeedback,
        retryCount,
        excludedCandidateIds,
        requestMode,
      }),
    });

    console.log("[mobile-guided-search] finalize response received", {
      ok: response.ok,
      status: response.status,
      requestId: response.headers?.get?.("x-request-id") || "",
    });

    return readJsonResponse(response, requestStartedAt);
  } catch (error) {
    console.log("[mobile-guided-search] finalize request threw", {
      message: error instanceof Error ? error.message : String(error),
      name: error?.name || "",
    });

    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      if (abortState.wasTimedOut()) {
        throw new Error("Search took too long to finalize. Try again.");
      }

      if (abortState.wasCanceled()) {
        const abortError = new Error("Finalize request canceled.");
        abortError.name = "AbortError";
        throw abortError;
      }
    }

    throw error;
  } finally {
    abortState.cleanup();
  }
}

async function fetchEnrichment({ token, query, amazonDomain }) {
  const searchParams = new URLSearchParams({ token, query });
  appendAmazonDomain(searchParams, amazonDomain);
  const requestStartedAt = nowMs();
  const response = await fetch(buildApiUrl(`${SEARCH_API_PATHS.enrichment}?${searchParams.toString()}`));
  return readJsonResponse(response, requestStartedAt);
}

function mergeEnrichmentIntoResults(results, enrichmentEntries) {
  if (!Array.isArray(results) || !Array.isArray(enrichmentEntries) || enrichmentEntries.length === 0) {
    return results;
  }

  const enrichmentById = new Map(
    enrichmentEntries.map((entry) => [String(entry?.candidate_id || entry?.candidateId || ""), entry]),
  );

  return results.map((result) => {
    const entry = enrichmentById.get(String(result.id));

    if (!entry) {
      return result;
    }

    return {
      ...result,
      fit_reason: entry?.fit_reason || entry?.fitReason || "",
      caveat: entry?.caveat || "",
      feature_bullets: Array.isArray(entry?.feature_bullets)
        ? entry.feature_bullets
        : Array.isArray(entry?.featureBullets)
          ? entry.featureBullets
          : Array.isArray(result?.feature_bullets)
            ? result.feature_bullets
            : [],
    };
  });
}

function mergeFinalizeResults(results, sourceCandidatePool) {
  const normalizedCandidatePool = sanitizeCandidatePool(sourceCandidatePool);

  if (!Array.isArray(results) || !Array.isArray(normalizedCandidatePool?.candidates)) {
    return normalizeResultList(results);
  }

  const candidateById = new Map(
    normalizedCandidatePool.candidates.map((candidate) => [String(candidate.id), candidate]),
  );

  return normalizeResultList(
    results
    .map((result) => {
    const sourceCandidate = candidateById.get(String(result.id));

    if (!sourceCandidate) {
      return normalizeResultItem(result);
    }

    return normalizeResultItem({
      ...result,
      image: sourceCandidate.image || result.image,
      link: sourceCandidate.link || result.link,
    });
    }),
  );
}

function buildResultAnalyticsItems(results) {
  if (!Array.isArray(results)) {
    return [];
  }

  return results.map((item, index) => ({
    resultKey: String(item.id),
    position: index,
    provider: item.subtitle || "",
    badgeType: item.badgeLabel || "",
    isBestPick: index === 0 || item.badgeLabel === "Best match",
  }));
}

function findResultById(results, id) {
  if (!Array.isArray(results) || !id) {
    return null;
  }

  return results.find((item) => String(item.id) === String(id)) || null;
}

export function resolveSelectedProductForDisplay({
  previousResults = [],
  previewResults = [],
  results = [],
  selectedProduct,
}) {
  if (!selectedProduct) {
    return null;
  }

  const selectedProductResultSet = selectedProduct.analyticsMeta?.resultSet || "final";
  const selectedProductLiveSource =
    selectedProductResultSet === "previous"
      ? previousResults
      : selectedProductResultSet === "preview"
        ? previewResults
        : results;
  const liveSelectedProduct = selectedProduct.id
    ? findResultById(selectedProductLiveSource, selectedProduct.id) ||
      findResultById(results, selectedProduct.id) ||
      findResultById(previousResults, selectedProduct.id) ||
      findResultById(previewResults, selectedProduct.id)
    : null;

  if (!liveSelectedProduct) {
    return selectedProduct;
  }

  return {
    ...liveSelectedProduct,
    analyticsMeta: selectedProduct.analyticsMeta,
  };
}

export function useGuidedSearch() {
  const { setProgress } = useSearchProgress();
  const backgroundFramingDisabled = isBackgroundFramingDisabled();
  const [productQuery, setProductQuery] = useState("");
  const productQueryRef = useRef("");
  const [selectedProductState, setSelectedProductState] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasStartedSearch, setHasStartedSearch] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [submittedAmazonDomain, setSubmittedAmazonDomain] = useState("");
  const [discoveryToken, setDiscoveryToken] = useState("");
  const [candidatePool, setCandidatePool] = useState(null);
  const [previewResults, setPreviewResults] = useState([]);
  const [results, setResults] = useState([]);
  const [previousResults, setPreviousResults] = useState([]);
  const [refinementPrompt, setRefinementPrompt] = useState(null);
  const [queryFramingFields, setQueryFramingFields] = useState(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [retryFeedback, setRetryFeedback] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [selectionState, setSelectionState] = useState(null);
  const [requestTiming, setRequestTiming] = useState({
    discover: null,
    finalize: null,
    refine: null,
    framingFields: null,
  });
  const [revealedBadgeResultsKey, setRevealedBadgeResultsKey] = useState("");
  const [showPreviewResults, setShowPreviewResults] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isEnrichmentReady, setIsEnrichmentReady] = useState(false);
  const activeSearchIdRef = useRef(0);
  const enrichmentPollRef = useRef({ timerId: null, searchId: 0 });
  const initialRequestRef = useRef({ controller: null, searchId: 0 });
  const finalizeRequestRef = useRef({ requestId: 0, controller: null, searchId: 0 });
  const analyticsSearchIdRef = useRef("");
  const analyticsSessionIdRef = useRef("");
  const hasTrackedRefinementViewRef = useRef(false);
  const hasTrackedPreviewImpressionsRef = useRef(false);

  function trackSearchEvent(name, eventData = {}) {
    if (!analyticsSearchIdRef.current || !analyticsSessionIdRef.current) {
      return;
    }

    trackAnalytics({
      eventType: "search_event",
      searchId: analyticsSearchIdRef.current,
      sessionId: analyticsSessionIdRef.current,
      name,
      eventData,
    });
  }

  function stopEnrichmentPolling() {
    if (enrichmentPollRef.current.timerId !== null) {
      clearTimeout(enrichmentPollRef.current.timerId);
      enrichmentPollRef.current.timerId = null;
    }

    enrichmentPollRef.current.searchId = 0;
  }

  function cancelActiveFinalizeRequest({ preserveRequestId = false } = {}) {
    const activeRequest = finalizeRequestRef.current;

    if (activeRequest.controller) {
      activeRequest.controller.abort();
    }

    finalizeRequestRef.current = {
      requestId: preserveRequestId ? activeRequest.requestId : activeRequest.requestId + 1,
      controller: null,
      searchId: activeRequest.searchId,
    };
  }

  function cancelActiveInitialRequest() {
    const activeRequest = initialRequestRef.current;

    if (activeRequest.controller) {
      activeRequest.controller.abort();
    }

    initialRequestRef.current = {
      controller: null,
      searchId: activeRequest.searchId,
    };
  }

  function expireSearchSession(message = createExpiredSessionMessage()) {
    stopEnrichmentPolling();
    cancelActiveFinalizeRequest();
    finalizeMutation.reset();
    setDiscoveryToken("");
    setCandidatePool(null);
    setResults([]);
    setPreviousResults([]);
    setSelectionState(null);
    setIsEnrichmentReady(false);
    setErrorMessage(message);
  }

  function startEnrichmentPolling({ token, query, searchId, amazonDomain }) {
    if (isEnrichmentPollingDisabled()) {
      return;
    }

    stopEnrichmentPolling();
    enrichmentPollRef.current.searchId = searchId;
    const startedAt = nowMs();

    function schedulePoll() {
      enrichmentPollRef.current.timerId = setTimeout(async () => {
        if (enrichmentPollRef.current.searchId !== searchId) {
          return;
        }

        if (nowMs() - startedAt > ENRICHMENT_POLL_TIMEOUT_MS) {
          stopEnrichmentPolling();
          return;
        }

        try {
          const payload = await fetchEnrichment({ token, query, amazonDomain });

          if (enrichmentPollRef.current.searchId !== searchId) {
            return;
          }

          if (payload.ready && Array.isArray(payload.entries) && payload.entries.length > 0) {
            stopEnrichmentPolling();
            setResults((current) => mergeEnrichmentIntoResults(current, payload.entries));
            setIsEnrichmentReady(true);
            return;
          }
        } catch {
          // Enrichment is best-effort.
        }

        if (enrichmentPollRef.current.searchId === searchId) {
          schedulePoll();
        }
      }, ENRICHMENT_POLL_INTERVAL_MS);
    }

    schedulePoll();
  }

  function applyFinalizePayload(payload, variables) {
    if (variables?.requestId !== finalizeRequestRef.current.requestId) {
      console.log("[mobile-guided-search] finalize response ignored", {
        requestId: variables?.requestId ?? null,
        activeRequestId: finalizeRequestRef.current.requestId,
        reason: "stale_request",
      });
      return;
    }

    const safePayload = payload && typeof payload === "object" ? payload : {};
    const safeCandidatePool = sanitizeCandidatePool(variables?.originalCandidatePool);
    const rawResults = extractFinalizeResults(safePayload);

    console.log("[mobile-guided-search] finalize payload received", {
      resultCount: rawResults.length,
      retryCount: safePayload?.retryCount,
      hasSelection: Boolean(safePayload?.selection),
      timing: safePayload?.timing || null,
    });

    const finalizedResults = enrichFinalResultsForDisplay(
      mergeFinalizeResults(rawResults, safeCandidatePool),
    );
    const hasInlineEnrichment = finalizedResults.some((item) => Boolean(item?.fit_reason || item?.fitReason));
    const previousDisplayResults =
      variables.retryCount > 0 && Array.isArray(variables.previousResults)
        ? enrichFinalResultsForDisplay(normalizeResultList(variables.previousResults))
        : [];

    finalizeRequestRef.current = {
      requestId: variables.requestId,
      controller: null,
      searchId: variables.searchId ?? activeSearchIdRef.current,
    };

    setCandidatePool(safeCandidatePool);
    setPreviousResults(previousDisplayResults);
    setResults(finalizedResults);
    setRevealedBadgeResultsKey("");
    setIsEnrichmentReady(hasInlineEnrichment);
    setRequestTiming((current) => ({
      ...current,
      finalize: safePayload.timing || null,
    }));
    setRetryFeedback("");
    setRetryCount(safePayload.retryCount ?? variables.retryCount ?? 0);
    setSelectionState(safePayload.selection || null);

    const token = variables.discoveryToken;
    const query = variables.query;
    const amazonDomain = variables.amazonDomain;
    const pollSearchId = variables.searchId ?? activeSearchIdRef.current;

    if (!hasInlineEnrichment && token && query && finalizedResults.length > 0) {
      startEnrichmentPolling({ token, query, searchId: pollSearchId, amazonDomain });
    }

    const searchId = analyticsSearchIdRef.current;
    const sessionId = analyticsSessionIdRef.current;
    const resultSet = variables.retryCount > 0 ? "retry" : "final";

    if (searchId && sessionId) {
      trackAnalytics({
        eventType: "search_run_upsert",
        searchId,
        sessionId,
        productQuery: variables.query,
        details: variables.followUpNotes || "",
        enteredAiRefinement: Boolean(variables.followUpNotes),
        usedShowProductsNow: showPreviewResults,
        completedFinalize: true,
        retryRound: safePayload.retryCount ?? variables.retryCount ?? 0,
        bestResultKey: finalizedResults[0]?.id ? String(finalizedResults[0].id) : "",
      });
      trackAnalytics({
        eventType: "search_event",
        searchId,
        sessionId,
        name: "final_results_shown",
        eventData: {
          resultCount: finalizedResults.length,
          resultSet,
          retryRound: safePayload.retryCount ?? variables.retryCount ?? 0,
          requestMode: variables.requestMode || FINALIZE_REQUEST_MODE_DEFAULT,
          usedPrewarm: Boolean(
            safePayload.selection?.reusedCandidateAwarePrior || safePayload.selection?.reusedPreRankArtifact,
          ),
          usedIntentMatchRerank: Boolean(safePayload.selection?.usedIntentMatchRerank),
          flowPath: safePayload.selection?.flowPath || "",
        },
      });

      const impressionItems = buildResultAnalyticsItems(finalizedResults);

      if (impressionItems.length > 0) {
        trackAnalytics({
          eventType: "result_impressions",
          searchId,
          sessionId,
          resultSet,
          items: impressionItems,
        });
      }
    }
  }

  function handleFinalizeError(error, variables) {
    if (variables?.requestId !== finalizeRequestRef.current.requestId) {
      return;
    }

    if (error?.name === "AbortError") {
      finalizeRequestRef.current = {
        requestId: variables?.requestId ?? finalizeRequestRef.current.requestId,
        controller: null,
        searchId: variables?.searchId ?? finalizeRequestRef.current.searchId,
      };
      return;
    }

    finalizeRequestRef.current = {
      requestId: variables?.requestId ?? finalizeRequestRef.current.requestId,
      controller: null,
      searchId: variables?.searchId ?? finalizeRequestRef.current.searchId,
    };

    console.log("[mobile-guided-search] finalize failed", {
      message: error instanceof Error ? error.message : String(error),
      name: error?.name || "",
    });

    const message = error instanceof Error ? error.message : "Unable to finalize the search.";

    if (/session expired|start a new search/i.test(message)) {
      expireSearchSession(message);
      return;
    }

    setErrorMessage(message);
  }

  function startFinalizeMutation(variables) {
    cancelActiveFinalizeRequest({ preserveRequestId: true });
    const nextRequestId = finalizeRequestRef.current.requestId + 1;
    const controller = new AbortController();
    const nextVariables = {
      ...variables,
      originalCandidatePool: sanitizeCandidatePool(variables?.originalCandidatePool),
      previousResults: normalizeResultList(variables?.previousResults, {
        limit: MAX_RENDERED_DEBUG_RESULTS,
      }),
      requestId: nextRequestId,
      searchId: activeSearchIdRef.current,
      signal: controller.signal,
    };

    finalizeRequestRef.current = {
      requestId: nextRequestId,
      controller,
      searchId: activeSearchIdRef.current,
    };

    console.log("[mobile-guided-search] finalize started", {
      query: nextVariables?.query || "",
      hasDiscoveryToken: Boolean(nextVariables?.discoveryToken),
      retryCount: nextVariables?.retryCount ?? 0,
      excludedCandidateIdsCount: Array.isArray(nextVariables?.excludedCandidateIds)
        ? nextVariables.excludedCandidateIds.length
        : 0,
      requestMode: nextVariables?.requestMode || "",
      requestId: nextRequestId,
      submittedAmazonDomain: nextVariables?.amazonDomain || "",
    });
    finalizeMutation.mutate(nextVariables);
  }

  const finalizeMutation = useMutation({
    mutationFn: finalizeGuidedSearch,
    onMutate: () => {
      setErrorMessage("");
    },
    onSuccess: applyFinalizePayload,
    onError: handleFinalizeError,
  });

  const isFinalizing = finalizeMutation.isPending;
  const isLoading = isDiscovering || isGeneratingPrompt || isFinalizing;
  const hasFinalResults = results.length > 0;
  const hasDiscoveryResults = previewResults.length > 0;
  const displayedResults = hasFinalResults ? results : showPreviewResults ? previewResults : [];
  const selectedProductForDisplay = resolveSelectedProductForDisplay({
    previousResults,
    previewResults,
    results,
    selectedProduct: selectedProductState,
  });
  const finalResultsKey = results.map((item) => String(item.id)).join("|");
  const showFinalResultBadges = results.length > 0 && revealedBadgeResultsKey === finalResultsKey;

  useEffect(() => {
    setProgress({
      hasStartedSearch,
      hasDiscoveryResults,
      hasFinalResults,
    });
  }, [hasDiscoveryResults, hasFinalResults, hasStartedSearch, setProgress]);

  useEffect(() => {
    if (results.length === 0) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setRevealedBadgeResultsKey(finalResultsKey);
    }, FINAL_RESULT_BADGE_REVEAL_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [finalResultsKey, results.length]);

  useEffect(() => () => {
    stopEnrichmentPolling();
    cancelActiveInitialRequest();
    cancelActiveFinalizeRequest();
  }, []);

  function resetGuidedState(nextSubmittedQuery, nextSubmittedAmazonDomain = "") {
    stopEnrichmentPolling();
    cancelActiveInitialRequest();
    cancelActiveFinalizeRequest();
    setHasStartedSearch(true);
    setSubmittedQuery(nextSubmittedQuery);
    setSubmittedAmazonDomain(nextSubmittedAmazonDomain);
    setSelectedProductState(null);
    setErrorMessage("");
    setDiscoveryToken("");
    setCandidatePool(null);
    setPreviewResults([]);
    setResults([]);
    setPreviousResults([]);
    setFollowUpNotes("");
    setRetryFeedback("");
    setRetryCount(0);
    setSelectionState(null);
    setRequestTiming({
      discover: null,
      finalize: null,
      refine: null,
      framingFields: null,
    });
    setRevealedBadgeResultsKey("");
    setShowPreviewResults(false);
    setRefinementPrompt(null);
    setQueryFramingFields(null);
    setIsEnrichmentReady(false);
    hasTrackedRefinementViewRef.current = false;
    hasTrackedPreviewImpressionsRef.current = false;
  }

  function resetToNewSearch() {
    activeSearchIdRef.current += 1;
    stopEnrichmentPolling();
    cancelActiveInitialRequest();
    cancelActiveFinalizeRequest();
    finalizeMutation.reset();
    setProductQuery("");
    setSelectedProductState(null);
    setErrorMessage("");
    setHasStartedSearch(false);
    setSubmittedQuery("");
    setSubmittedAmazonDomain("");
    setDiscoveryToken("");
    setCandidatePool(null);
    setPreviewResults([]);
    setResults([]);
    setRefinementPrompt(null);
    setQueryFramingFields(null);
    setFollowUpNotes("");
    setRetryFeedback("");
    setRetryCount(0);
    setSelectionState(null);
    setRequestTiming({
      discover: null,
      finalize: null,
      refine: null,
      framingFields: null,
    });
    setRevealedBadgeResultsKey("");
    setPreviousResults([]);
    setShowPreviewResults(false);
    setIsDiscovering(false);
    setIsGeneratingPrompt(false);
    setIsEnrichmentReady(false);
    analyticsSearchIdRef.current = "";
    analyticsSessionIdRef.current = "";
    hasTrackedRefinementViewRef.current = false;
    hasTrackedPreviewImpressionsRef.current = false;
  }

  function updateProductQuery(nextValue) {
    productQueryRef.current = nextValue;
    setProductQuery(nextValue);
  }

  async function beginGuidedSearch(queryOverride) {
    const nextProductQuery =
      typeof queryOverride === "string" ? queryOverride : productQueryRef.current || productQuery;
    const { error, isValid, normalizedQuery } = validateSearchInput(nextProductQuery, "");

    if (!isValid) {
      setErrorMessage(error);
      return;
    }

    const nextSearchId = activeSearchIdRef.current + 1;
    activeSearchIdRef.current = nextSearchId;
    const analyticsSearchId = createAnalyticsSearchId();
    const analyticsSessionId = await getOrCreateAnalyticsSessionId();

    analyticsSearchIdRef.current = analyticsSearchId;
    analyticsSessionIdRef.current = analyticsSessionId;

    resetGuidedState(normalizedQuery);
    setIsDiscovering(true);
    setIsGeneratingPrompt(true);
    const initialRequestController = new AbortController();

    initialRequestRef.current = {
      controller: initialRequestController,
      searchId: nextSearchId,
    };

    trackAnalytics({
      eventType: "search_run_upsert",
      searchId: analyticsSearchId,
      sessionId: analyticsSessionId,
      productQuery: normalizedQuery,
      details: "",
      enteredAiRefinement: false,
      usedShowProductsNow: false,
      completedFinalize: false,
      retryRound: 0,
    });
    trackAnalytics({
      eventType: "search_event",
      searchId: analyticsSearchId,
      sessionId: analyticsSessionId,
      name: "search_started",
      eventData: {
        query: normalizedQuery,
      },
    });

    fetchDiscoveryResults(normalizedQuery, {
      signal: initialRequestController.signal,
    })
      .then((payload) => {
        if (activeSearchIdRef.current !== nextSearchId) {
          return;
        }

        if (!payload.discoveryToken) {
          setCandidatePool(null);
          setPreviewResults([]);
          setErrorMessage(createExpiredSessionMessage());
          return;
        }

        const nextSubmittedAmazonDomain = resolveSubmittedAmazonDomain(payload);

        setDiscoveryToken(payload.discoveryToken || "");
        setSubmittedAmazonDomain(nextSubmittedAmazonDomain);
        setCandidatePool(sanitizeCandidatePool(payload.candidatePool));
        setPreviewResults(normalizeResultList(payload.previewResults, { limit: null }));
        setRequestTiming((current) => ({
          ...current,
          discover: payload.timing || null,
        }));

        trackAnalytics({
          eventType: "search_event",
          searchId: analyticsSearchId,
          sessionId: analyticsSessionId,
          name: "discovery_loaded",
          eventData: {
            candidateCount: Array.isArray(payload.candidatePool?.candidates)
              ? payload.candidatePool.candidates.length
              : 0,
            previewCount: Array.isArray(payload.previewResults) ? payload.previewResults.length : 0,
            source: payload.source || "live",
          },
        });
      })
      .catch((nextError) => {
        if (nextError?.name === "AbortError") {
          return;
        }

        if (activeSearchIdRef.current !== nextSearchId) {
          return;
        }

        setErrorMessage(nextError instanceof Error ? nextError.message : "Unable to start the search.");
      })
      .finally(() => {
        if (activeSearchIdRef.current === nextSearchId) {
          setIsDiscovering(false);
        }
      });

    fetchRefinementPrompt(normalizedQuery, {
      signal: initialRequestController.signal,
    })
      .then((payload) => {
        if (activeSearchIdRef.current !== nextSearchId) {
          return;
        }

        setRefinementPrompt(payload);
        setRequestTiming((current) => ({
          ...current,
          refine: payload.timing || null,
        }));

        if (!hasTrackedRefinementViewRef.current) {
          hasTrackedRefinementViewRef.current = true;
          trackAnalytics({
            eventType: "search_event",
            searchId: analyticsSearchId,
            sessionId: analyticsSessionId,
            name: "refine_viewed",
            eventData: {
              usedFallback: false,
            },
          });
        }
      })
      .catch(() => {
        if (initialRequestController.signal.aborted) {
          return;
        }

        if (activeSearchIdRef.current === nextSearchId) {
          setRefinementPrompt(createFallbackRefinementPrompt(normalizedQuery));

          if (!hasTrackedRefinementViewRef.current) {
            hasTrackedRefinementViewRef.current = true;
            trackAnalytics({
              eventType: "search_event",
              searchId: analyticsSearchId,
              sessionId: analyticsSessionId,
              name: "refine_viewed",
              eventData: {
                usedFallback: true,
              },
            });
          }
        }
      })
      .finally(() => {
        if (activeSearchIdRef.current === nextSearchId) {
          setIsGeneratingPrompt(false);
        }
      });

    if (!backgroundFramingDisabled) {
      trackSearchEvent("query_framing_fields_started", {
        lane: "framing_fields",
      });

      fetchFramingFields(normalizedQuery, {
        signal: initialRequestController.signal,
      })
        .then((payload) => {
          if (activeSearchIdRef.current !== nextSearchId) {
            return;
          }

          setQueryFramingFields(payload.queryFraming || null);
          setRequestTiming((current) => ({
            ...current,
            framingFields: payload.timing || null,
          }));
          trackSearchEvent("query_framing_fields_ready", {
            lane: "framing_fields",
            openaiMs: payload.timing?.server?.openai ?? null,
            totalMs: payload.timing?.client?.totalMs ?? null,
            totalTokens: payload.usage?.totalTokens ?? null,
            tradeoffAxisCount: Array.isArray(payload.queryFraming?.tradeoffAxes)
              ? payload.queryFraming.tradeoffAxes.length
              : 0,
          });
        })
        .catch((nextError) => {
          if (nextError?.name === "AbortError") {
            return;
          }

          if (activeSearchIdRef.current !== nextSearchId) {
            return;
          }

          trackSearchEvent("query_framing_fields_failed", {
            lane: "framing_fields",
            error: nextError instanceof Error ? nextError.message : "Unknown error",
          });
        });
    }
  }

  function handleFinalizeRefinement() {
    if (!candidatePool || !submittedQuery || isFinalizing) {
      return;
    }

    if (!discoveryToken) {
      expireSearchSession();
      return;
    }

    const normalizedFollowUpNotes = followUpNotes.trim();

    if (analyticsSearchIdRef.current && analyticsSessionIdRef.current) {
      trackAnalytics({
        eventType: "search_run_upsert",
        searchId: analyticsSearchIdRef.current,
        sessionId: analyticsSessionIdRef.current,
        productQuery: submittedQuery,
        details: followUpNotes,
        enteredAiRefinement: Boolean(normalizedFollowUpNotes),
        usedShowProductsNow: showPreviewResults,
        completedFinalize: false,
        retryRound: 0,
      });
      trackSearchEvent("ai_followup_submitted", {
        noteLength: normalizedFollowUpNotes.length,
      });
    }

    const nextFinalizeRequest = {
      query: submittedQuery,
      amazonDomain: submittedAmazonDomain,
      discoveryToken,
      originalCandidatePool: candidatePool,
      followUpNotes: normalizedFollowUpNotes,
      rejectionFeedback: "",
      retryCount: 0,
      excludedCandidateIds: [],
      previousResults: [],
      requestMode: normalizedFollowUpNotes
        ? FINALIZE_REQUEST_MODE_REFINED
        : FINALIZE_REQUEST_MODE_EMPTY_NOTES,
    };

    startFinalizeMutation(nextFinalizeRequest);
  }

  function handleShowProductsNow() {
    if (previewResults.length === 0) {
      return;
    }

    setShowPreviewResults(true);

    if (!analyticsSearchIdRef.current || !analyticsSessionIdRef.current) {
      return;
    }

    trackAnalytics({
      eventType: "search_run_upsert",
      searchId: analyticsSearchIdRef.current,
      sessionId: analyticsSessionIdRef.current,
      productQuery: submittedQuery,
      details: followUpNotes,
      enteredAiRefinement: false,
      usedShowProductsNow: true,
      completedFinalize: false,
      retryRound: 0,
    });
    trackAnalytics({
      eventType: "search_event",
      searchId: analyticsSearchIdRef.current,
      sessionId: analyticsSessionIdRef.current,
      name: "show_products_now_clicked",
      eventData: {
        previewCount: previewResults.length,
      },
    });

    if (!hasTrackedPreviewImpressionsRef.current) {
      hasTrackedPreviewImpressionsRef.current = true;
      const impressionItems = buildResultAnalyticsItems(previewResults);

      if (impressionItems.length > 0) {
        trackAnalytics({
          eventType: "result_impressions",
          searchId: analyticsSearchIdRef.current,
          sessionId: analyticsSessionIdRef.current,
          resultSet: "preview",
          items: impressionItems,
        });
      }
    }
  }

  async function handleProbeFinalizeRequest() {
    if (!candidatePool || !submittedQuery || isFinalizing) {
      return;
    }

    if (!discoveryToken) {
      expireSearchSession();
      return;
    }

    try {
      const normalizedFollowUpNotes = followUpNotes.trim();
      const probeResult = await probeFinalizeRequest({
        query: submittedQuery,
        amazonDomain: submittedAmazonDomain,
        discoveryToken,
        followUpNotes: normalizedFollowUpNotes,
        rejectionFeedback: "",
        retryCount: 0,
        excludedCandidateIds: [],
        requestMode: normalizedFollowUpNotes
          ? FINALIZE_REQUEST_MODE_REFINED
          : FINALIZE_REQUEST_MODE_EMPTY_NOTES,
      });

      setErrorMessage(
        probeResult.ok
          ? `Probe finalize succeeded (${probeResult.status}). Check Metro logs for the response preview.`
          : `Probe finalize failed (${probeResult.status}). Check Metro logs for the response preview.`,
      );
    } catch (error) {
      console.log("[mobile-guided-search] finalize probe threw", {
        message: error instanceof Error ? error.message : String(error),
        name: error?.name || "",
      });
      setErrorMessage(
        error instanceof Error ? `Probe finalize threw: ${error.message}` : "Probe finalize threw an unknown error.",
      );
    }
  }

  async function handleProbeSimpleFinalizeRoute() {
    const nextQuery = submittedQuery || productQueryRef.current || productQuery;

    try {
      const probeResult = await probeSimpleFinalizeRoute({
        query: nextQuery,
        amazonDomain: submittedAmazonDomain,
        discoveryToken,
        requestMode: followUpNotes.trim() ? FINALIZE_REQUEST_MODE_REFINED : FINALIZE_REQUEST_MODE_EMPTY_NOTES,
      });

      setErrorMessage(
        probeResult.ok
          ? `Simple probe succeeded (${probeResult.status}). Check Metro logs for the response preview.`
          : `Simple probe failed (${probeResult.status}). Check Metro logs for the response preview.`,
      );
    } catch (error) {
      console.log("[mobile-guided-search] simple finalize probe threw", {
        message: error instanceof Error ? error.message : String(error),
        name: error?.name || "",
      });
      setErrorMessage(
        error instanceof Error
          ? `Simple probe threw: ${error.message}`
          : "Simple probe threw an unknown error.",
      );
    }
  }

  function handleRetryWithFeedback() {
    if (
      !candidatePool ||
      !submittedQuery ||
      !retryFeedback.trim() ||
      retryCount >= MAX_REFINEMENT_RETRIES ||
      isFinalizing
    ) {
      return;
    }

    if (!discoveryToken) {
      expireSearchSession();
      return;
    }

    if (analyticsSearchIdRef.current && analyticsSessionIdRef.current) {
      trackSearchEvent("retry_started", {
        retryRound: retryCount + 1,
        feedbackLength: retryFeedback.trim().length,
      });
    }

    const nextFinalizeRequest = {
      query: submittedQuery,
      amazonDomain: submittedAmazonDomain,
      discoveryToken,
      originalCandidatePool: candidatePool,
      followUpNotes,
      rejectionFeedback: retryFeedback.trim(),
      retryCount: retryCount + 1,
      excludedCandidateIds: results.map((result) => result.id),
      previousResults: results,
      requestMode: FINALIZE_REQUEST_MODE_RETRY,
    };

    startFinalizeMutation(nextFinalizeRequest);
  }

  function handleSelectProduct(item, { position = 0, resultSet = "final" } = {}) {
    setSelectedProductState({
      id: item.id,
      analyticsMeta: {
        badgeType: item.badgeLabel || "",
        isBestPick: position === 0 || item.badgeLabel === "Best match",
        position,
        provider: item.subtitle || "",
        resultKey: String(item.id),
        resultSet,
      },
    });

    if (!analyticsSearchIdRef.current || !analyticsSessionIdRef.current) {
      return;
    }

    trackAnalytics({
      eventType: "result_click",
      searchId: analyticsSearchIdRef.current,
      sessionId: analyticsSessionIdRef.current,
      resultSet,
      resultKey: String(item.id),
      position,
      provider: item.subtitle || "",
      badgeType: item.badgeLabel || "",
      isBestPick: position === 0 || item.badgeLabel === "Best match",
      clickTarget: "card",
      retailerUrl: item.link || "",
    });
  }

  function handleRetailerClick(item, { position = 0, resultSet = "final" } = {}) {
    if (!analyticsSearchIdRef.current || !analyticsSessionIdRef.current) {
      return;
    }

    trackAnalytics({
      eventType: "result_click",
      searchId: analyticsSearchIdRef.current,
      sessionId: analyticsSessionIdRef.current,
      resultSet,
      resultKey: String(item.id),
      position,
      provider: item.subtitle || "",
      badgeType: item.badgeLabel || "",
      isBestPick: position === 0 || item.badgeLabel === "Best match",
      clickTarget: "retailer",
      retailerUrl: item.link || "",
    });
  }

  return {
    candidatePool,
    discoveryToken,
    displayedResults,
    errorMessage,
    finalResults: results,
    followUpNotes,
    hasDiscoveryResults,
    hasFinalResults,
    hasStartedSearch,
    handleRetailerClick,
    handleSelectProduct,
    isDiscovering,
    isEnrichmentReady,
    isFinalizing,
    isGeneratingPrompt,
    isLoading,
    previewResults,
    previousResults,
    productQuery,
    queryFramingFields,
    requestTiming,
    refinementPrompt,
    selectionState,
    retryCount,
    retryFeedback,
    selectedProduct: selectedProductForDisplay,
    showFinalResultBadges,
    showPreviewResults,
    submittedAmazonDomain,
    submittedQuery,
    beginGuidedSearch,
    handleFinalizeRefinement,
    handleProbeFinalizeRequest,
    handleProbeSimpleFinalizeRoute,
    handleRetryWithFeedback,
    handleShowProductsNow,
    resetToNewSearch,
    setRetryFeedback,
    setFollowUpNotes,
    setProductQuery: updateProductQuery,
    setSelectedProduct: setSelectedProductState,
  };
}
