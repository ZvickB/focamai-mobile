const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";
const FINAL_RESULT_LIMIT = 6;
const PREVIEW_RESULT_LIMIT = 3;
const RETRY_ADVICE_SUGGESTED_QUERY_MAX_LENGTH = 80;
const REFINEMENT_SUGGESTION_LIMIT = 3;
const REFINEMENT_SUGGESTION_MAX_LENGTH = 22;
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

function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("Set EXPO_PUBLIC_API_BASE_URL to the backend API URL, then restart Expo.");
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
  const params = new URLSearchParams({ query });

  if (amazonDomain) {
    params.set("amazonDomain", amazonDomain);
  }

  if (cacheMode === "refresh") {
    params.set("cacheMode", "refresh");
  }

  const response = await fetch(`${API_BASE_URL}/api/search/rainforest-discover?${params.toString()}`);

  return readJsonResponse(response, requestStartedAt, "Discovery request failed.");
}

export async function getRefinementPrompt({ query }) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const response = await fetch(`${API_BASE_URL}/api/search/refine?query=${encodeURIComponent(query)}`);

  return readJsonResponse(response, requestStartedAt, "Refinement request failed.");
}

export async function finalizeSearch({
  amazonDomain,
  discoveryToken,
  followUpNotes = "",
  query,
}) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const normalizedNotes = followUpNotes.trim();
  const requestMode = normalizedNotes ? "guided_refined" : "guided_empty_notes";
  const response = await fetch(`${API_BASE_URL}/api/search/finalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amazonDomain,
      discoveryToken,
      followUpNotes: normalizedNotes,
      query,
      requestMode,
    }),
  });

  return readJsonResponse(response, requestStartedAt, "Finalize request failed.");
}

export async function pollEnrichment({ amazonDomain, query, token }) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const params = new URLSearchParams({
    amazonDomain,
    query,
    token,
  });
  const response = await fetch(`${API_BASE_URL}/api/search/enrichment?${params.toString()}`);

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

  const response = await fetch(`${API_BASE_URL}/api/search/query-quality?${params.toString()}`);

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
  const response = await fetch(`${API_BASE_URL}/api/search/retry-advice`, {
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
  });

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
      ...result,
      image: candidate.image || result.image,
      link: candidate.link || result.link,
    };
  });
}

export function normalizeFinalResults(results, candidatePool, identityScope = "") {
  if (!Array.isArray(results)) {
    return [];
  }

  return mergeFinalResultsWithCandidatePool(results, candidatePool).slice(0, FINAL_RESULT_LIMIT).map((item, index) => ({
    caveat: item?.caveat || "",
    feature_bullets: getFeatureBullets(item),
    fit_reason: item?.fit_reason || item?.fitReason || "",
    id: getCandidateId(item, buildFinalFallbackId(index, identityScope)),
    image: item?.image || "",
    link: item?.link || "",
    price: item?.price || "Price not shown",
    provider: item?.subtitle || item?.source || item?.provider || "Unknown source",
    rating: item?.rating ?? null,
    reviewCount: item?.reviewCount ?? item?.reviews ?? null,
    title: item?.title || "Untitled product",
  }));
}
