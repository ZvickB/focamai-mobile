const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";
const FINAL_RESULT_LIMIT = 6;
const PREVIEW_RESULT_LIMIT = 3;

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

export async function discoverProducts({ amazonDomain, query }) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const params = new URLSearchParams({ query });

  if (amazonDomain) {
    params.set("amazonDomain", amazonDomain);
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
  excludedCandidateIds = [],
  followUpNotes = "",
  query,
  rejectionFeedback = "",
  retryCount = 0,
}) {
  assertApiBaseUrl();

  const requestStartedAt = Date.now();
  const normalizedNotes = followUpNotes.trim();
  const normalizedFeedback = rejectionFeedback.trim();
  const requestMode = retryCount > 0
    ? "guided_retry"
    : normalizedNotes
      ? "guided_refined"
      : "guided_empty_notes";
  const response = await fetch(`${API_BASE_URL}/api/search/finalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amazonDomain,
      discoveryToken,
      excludedCandidateIds,
      followUpNotes: normalizedNotes,
      query,
      rejectionFeedback: normalizedFeedback,
      requestMode,
      retryCount,
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
  const response = await fetch(`${API_BASE_URL}/api/search/enrich?${params.toString()}`);

  return readJsonResponse(response, requestStartedAt, "Enrichment request failed.");
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

export function normalizeFinalResults(results) {
  if (!Array.isArray(results)) {
    return [];
  }

  return results.slice(0, FINAL_RESULT_LIMIT).map((item, index) => ({
    caveat: item?.caveat || "",
    feature_bullets: Array.isArray(item?.feature_bullets) ? item.feature_bullets : [],
    fit_reason: item?.fit_reason || "",
    id: String(item?.id || item?.candidate_id || item?.candidateId || item?.asin || `final-${index}`),
    price: item?.price || "Price not shown",
    provider: item?.subtitle || item?.source || item?.provider || "Unknown source",
    rating: item?.rating ?? null,
    reviewCount: item?.reviewCount ?? item?.reviews ?? null,
    title: item?.title || "Untitled product",
  }));
}
