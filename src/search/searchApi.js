import { Platform } from "react-native";
import { isPositivePrimeFlag } from "./primeEligibility";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";
const FINAL_RESULT_LIMIT = 6;
const MOBILE_PLATFORM = Platform.OS === "ios" ? "mobile-ios" : "mobile-android";
const PREVIEW_RESULT_LIMIT = 3;
const RETRY_ADVICE_SUGGESTED_QUERY_MAX_LENGTH = 80;
const REFINEMENT_SUGGESTION_LIMIT = 3;
const REFINEMENT_SUGGESTION_MAX_LENGTH = 30;
const IMPROVE_PICKS_SUGGESTION_LIMIT = 3;
const IMPROVE_PICKS_SUGGESTION_LABEL_MAX_LENGTH = 30;
const IMPROVE_PICKS_SUGGESTION_FEEDBACK_MAX_LENGTH = 180;
const REQUEST_TIMEOUT_MESSAGE =
  "This is taking longer than expected. Try again, or adjust the search.";
const REQUEST_TIMEOUTS_MS = {
  deepDive: 60000,
  discover: 25000,
  finalize: 35000,
  poll: 8000,
  refine: 15000,
  retryAdvice: 20000,
};

const DEEP_DIVE_TIMEOUT_MESSAGE =
  "The store comparison is taking longer than expected. Please try again.";
const TEXT_FIELD_KEYS = [
  "query",
  "text",
  "value",
  "suggestion",
  "suggestedQuery",
  "originalQuery",
  "message",
  "reason",
  "rationale",
];
const UNEXPECTED_QUERY_SUGGESTION_CHARACTERS = /[\u0000-\u001F\u007F\uFFFD\u3400-\u9FFF]/;

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function logResolvedApiBaseUrl() {
  console.info("[Focamai API] resolved API base URL at startup", {
    apiBaseUrl: API_BASE_URL || "(empty)",
    hasApiBaseUrl: Boolean(API_BASE_URL),
  });
}

function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("Set EXPO_PUBLIC_API_BASE_URL to the backend API URL, then restart Expo.");
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const controller = new AbortController();
  let didTimeout = false;
  const method = options.method || "GET";
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  console.info("[Focamai API] request attempt", {
    attempted: true,
    method,
    url,
  });

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    console.info("[Focamai API] response received", {
      method,
      status: response.status,
      url,
    });
    return response;
  } catch (error) {
    console.error("[Focamai API] fetch/network error", {
      didTimeout,
      error,
      message: error instanceof Error ? error.message : String(error),
      method,
      url,
    });

    if (didTimeout) {
      throw new Error(REQUEST_TIMEOUT_MESSAGE);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchDeepDiveWithTimeout(url, options = {}) {
  try {
    return await fetchWithTimeout(url, options, REQUEST_TIMEOUTS_MS.deepDive);
  } catch (error) {
    if (error instanceof Error && error.message === REQUEST_TIMEOUT_MESSAGE) {
      throw new Error(DEEP_DIVE_TIMEOUT_MESSAGE);
    }
    throw error;
  }
}

async function readJsonResponse(response, requestStartedAt, fallbackErrorMessage) {
  const rawBody = await response.text();
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
          ? "The server returned HTML instead of JSON. Check EXPO_PUBLIC_API_BASE_URL."
          : "The server returned an invalid response.",
      );
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || fallbackErrorMessage);
  }

  return {
    ...payload,
    clientTimingMs: Date.now() - requestStartedAt,
  };
}

export async function discoverProducts({ amazonDomain, cacheMode = "", query }) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const params = new URLSearchParams({ query, platform: MOBILE_PLATFORM });

  if (amazonDomain) {
    params.set("amazonDomain", amazonDomain);
  }

  if (cacheMode === "refresh") {
    params.set("cacheMode", "refresh");
  }

  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/search/rainforest-discover?${params.toString()}`,
    {},
    REQUEST_TIMEOUTS_MS.discover,
  );

  return readJsonResponse(response, requestStartedAt, "Discovery request failed.");
}

export async function getRefinementPrompt({ query }) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/search/refine?query=${encodeURIComponent(query)}`,
    {},
    REQUEST_TIMEOUTS_MS.refine,
  );

  return readJsonResponse(response, requestStartedAt, "Refinement request failed.");
}

export async function finalizeSearch({
  amazonDomain,
  discoveryToken,
  followUpNotes = "",
  query,
  rankingPreference = "balanced",
}) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const normalizedNotes = followUpNotes.trim();
  const requestMode = normalizedNotes ? "guided_refined" : "guided_empty_notes";
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/search/finalize`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amazonDomain,
        discoveryToken,
        followUpNotes: normalizedNotes,
        platform: MOBILE_PLATFORM,
        query,
        rankingPreference,
        requestMode,
      }),
    },
    REQUEST_TIMEOUTS_MS.finalize,
  );

  return readJsonResponse(response, requestStartedAt, "Finalize request failed.");
}

export async function fetchProductDeepDive({
  amazonDomain,
  candidateId,
  crossMarketFallback = false,
  discoveryToken,
  query,
  token,
}) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const response = await fetchDeepDiveWithTimeout(
    `${API_BASE_URL}/api/product/deep-dive`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        amazonDomain,
        candidateId,
        crossMarketFallback,
        discoveryToken,
        includeSynthesis: true,
        query,
      }),
    },
  );

  return readJsonResponse(response, requestStartedAt, "Deep Dive request failed.");
}

export async function pollEnrichment({ amazonDomain, query, token }) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const params = new URLSearchParams({
    amazonDomain,
    query,
    token,
  });
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/search/enrichment?${params.toString()}`,
    {},
    REQUEST_TIMEOUTS_MS.poll,
  );

  return readJsonResponse(response, requestStartedAt, "Enrichment request failed.");
}

export async function pollQueryQuality({ amazonDomain, query, token }) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const params = new URLSearchParams({
    query,
    token,
  });

  if (amazonDomain) {
    params.set("amazonDomain", amazonDomain);
  }

  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/search/query-quality?${params.toString()}`,
    {},
    REQUEST_TIMEOUTS_MS.poll,
  );

  return readJsonResponse(response, requestStartedAt, "Query-quality request failed.");
}

export function coerceDisplayText(value, fallback = "") {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (!value || typeof value !== "object") {
    return fallback;
  }

  for (const key of TEXT_FIELD_KEYS) {
    const nextValue = coerceDisplayText(value[key], "");

    if (nextValue) {
      return nextValue;
    }
  }

  return fallback;
}

export function isSafeQuerySuggestionText(value) {
  const text = coerceDisplayText(value);

  return Boolean(text && !UNEXPECTED_QUERY_SUGGESTION_CHARACTERS.test(text));
}

export function normalizeQueryQualitySuggestion(payload, fallbackQuery = "") {
  const suggestedQuery = coerceDisplayText(payload?.suggestedQuery);

  if (!isSafeQuerySuggestionText(suggestedQuery)) {
    return null;
  }

  const originalQuery = coerceDisplayText(payload?.originalQuery, fallbackQuery);
  const reason = coerceDisplayText(payload?.reason);

  return {
    classification: coerceDisplayText(payload?.classification),
    confidence: coerceDisplayText(payload?.confidence),
    originalQuery: isSafeQuerySuggestionText(originalQuery) ? originalQuery : fallbackQuery,
    reason: isSafeQuerySuggestionText(reason)
      ? reason
      : "This may be a clearer way to phrase the search.",
    suggestedQuery,
  };
}

export function normalizeRefinementSuggestions(payload) {
  const rawSuggestions = Array.isArray(payload?.refinementSuggestions)
    ? payload.refinementSuggestions
    : Array.isArray(payload?.refinement_suggestions)
      ? payload.refinement_suggestions
      : [];

  return rawSuggestions
    .map((item) => {
      if (typeof item === "string") {
        const label = item.trim().replace(/\s+/g, " ");
        return label ? { label } : null;
      }
      if (item && typeof item.label === "string") {
        const label = item.label.trim().replace(/\s+/g, " ");
        if (!label) return null;
        const prompt = typeof item.prompt === "string" ? item.prompt.trim() : undefined;
        return prompt ? { label, prompt } : { label };
      }
      return null;
    })
    .filter((item) => item?.label && item.label.length <= REFINEMENT_SUGGESTION_MAX_LENGTH)
    .slice(0, REFINEMENT_SUGGESTION_LIMIT);
}

export function normalizeImprovePicksSuggestions(payload) {
  const rawSuggestions = Array.isArray(payload?.improvePicksSuggestions)
    ? payload.improvePicksSuggestions
    : Array.isArray(payload?.improve_picks_suggestions)
      ? payload.improve_picks_suggestions
      : [];
  const seenLabels = new Set();

  return rawSuggestions
    .map((item) => {
      const label = String(item?.label || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, IMPROVE_PICKS_SUGGESTION_LABEL_MAX_LENGTH);
      const feedback = String(item?.feedback || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, IMPROVE_PICKS_SUGGESTION_FEEDBACK_MAX_LENGTH);
      const normalizedLabel = label.toLowerCase();

      if (!label || !feedback || seenLabels.has(normalizedLabel)) {
        return null;
      }

      seenLabels.add(normalizedLabel);
      return { feedback, label };
    })
    .filter(Boolean)
    .slice(0, IMPROVE_PICKS_SUGGESTION_LIMIT);
}

export function normalizeRetryAdvice(payload) {
  const suggestedQuery = coerceDisplayText(payload?.suggestedQuery)
    .replace(/\s+/g, " ")
    .slice(0, RETRY_ADVICE_SUGGESTED_QUERY_MAX_LENGTH)
    .trim();

  return {
    ...payload,
    suggestedQuery: isSafeQuerySuggestionText(suggestedQuery) ? suggestedQuery : "",
    rationale: coerceDisplayText(payload?.rationale),
  };
}

export async function getRetryAdvice({
  followUpNotes = "",
  query,
  rejectionFeedback = "",
  shortlist = [],
}) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/search/retry-advice`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        followUpNotes: followUpNotes.trim(),
        query,
        rejectionFeedback: rejectionFeedback.trim(),
        shortlist,
      }),
    },
    REQUEST_TIMEOUTS_MS.retryAdvice,
  );

  const payload = await readJsonResponse(
    response,
    requestStartedAt,
    "Unable to suggest a better search direction.",
  );

  return normalizeRetryAdvice(payload);
}

export function normalizePreviewResults(results) {
  if (!Array.isArray(results)) {
    return [];
  }

  return results.slice(0, PREVIEW_RESULT_LIMIT).map((item, index) => ({
    id: String(item?.id || item?.asin || `preview-${index}`),
    price: item?.price || "Price not shown",
    provider: item?.subtitle || item?.source || item?.provider || "Unknown source",
    rating: item?.rating ?? null,
    title: item?.title || "Untitled product",
  }));
}

function getCandidateId(item, fallbackId = "") {
  return String(item?.id || item?.candidate_id || item?.candidateId || item?.asin || fallbackId);
}

function sanitizeIdPart(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildFinalFallbackId(index, identityScope = "") {
  const scope = sanitizeIdPart(identityScope);

  return scope ? `final-${scope}-${index}` : `final-${index}`;
}

function getFeatureBullets(item) {
  if (Array.isArray(item?.feature_bullets)) {
    return item.feature_bullets;
  }

  if (Array.isArray(item?.featureBullets)) {
    return item.featureBullets;
  }

  return [];
}

function getPositiveNumericPrice(item) {
  const directValue = Number(
    item?.numericPrice ?? item?.numeric_price ?? item?.extracted_price ?? item?.price_value,
  );

  if (Number.isFinite(directValue) && directValue > 0) {
    return directValue;
  }

  const priceMatch = String(item?.price || "").match(/\d[\d,]*(?:\.\d+)?/);
  const parsedValue = priceMatch ? Number(priceMatch[0].replace(/,/g, "")) : null;

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function normalizeDeepDiveEligibility(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return {
    confidence: String(value.confidence || "low"),
    mode: String(value.mode || "hide"),
    reason: String(value.reason || ""),
    recommendation: String(value.recommendation || "hide"),
  };
}

function normalizeModeration(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const outcome = String(value.outcome || "").trim();

  if (!['allow', 'hide_image'].includes(outcome)) {
    return null;
  }

  return {
    matchedField: String(value.matchedField || "").trim(),
    outcome,
    reason: String(value.reason || "").trim(),
  };
}

function mergeFinalResultsWithCandidatePool(results, candidatePool) {
  if (!Array.isArray(results)) {
    return [];
  }

  const candidates = Array.isArray(candidatePool?.candidates) ? candidatePool.candidates : [];
  const candidatesById = new Map(
    candidates.map((candidate, index) => [getCandidateId(candidate, `candidate-${index}`), candidate]),
  );

  return results.map((result, index) => {
    const candidate = candidatesById.get(getCandidateId(result, `final-${index}`));

    if (!candidate) {
      return result;
    }

    return {
      ...candidate,
      ...result,
      image: candidate.moderation?.outcome === "hide_image"
        ? ""
        : candidate.image || result.image,
      link: candidate.link || result.link,
      moderation: candidate.moderation || result.moderation,
    };
  });
}

export function normalizeFinalResults(results, candidatePool, identityScope = "") {
  if (!Array.isArray(results)) {
    return [];
  }

  return mergeFinalResultsWithCandidatePool(results, candidatePool).slice(0, FINAL_RESULT_LIMIT).map((item, index) => ({
    asin: String(item?.asin || item?.product_id || "").trim(),
    caveat: item?.caveat || "",
    deepDiveEligibility: normalizeDeepDiveEligibility(
      item?.deepDiveEligibility || item?.deep_dive_eligibility,
    ),
    delivery: item?.delivery || "",
    feature_bullets: getFeatureBullets(item),
    fit_reason: item?.fit_reason || item?.fitReason || "",
    id: getCandidateId(item, buildFinalFallbackId(index, identityScope)),
    image: item?.image || "",
    isPrime: isPositivePrimeFlag(item?.isPrime) || isPositivePrimeFlag(item?.is_prime),
    link: item?.link || "",
    moderation: normalizeModeration(item?.moderation),
    numericPrice: getPositiveNumericPrice(item),
    price: item?.price || "Price not shown",
    provider: item?.subtitle || item?.source || item?.provider || "Unknown source",
    rating: item?.rating ?? null,
    reviewCount: item?.reviewCount ?? item?.reviews ?? null,
    sourceTitle: item?.source_title || item?.sourceTitle || item?.title || "",
    title: item?.title || "Untitled product",
  }));
}
