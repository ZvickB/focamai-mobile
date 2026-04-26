import Constants from "expo-constants";

const SEARCH_API_PATHS = {
  analyticsTrack: "/api/analytics/track",
  rainforestDiscover: "/api/search/rainforest-discover",
  refine: "/api/search/refine",
  framingFields: "/api/search/framing-fields",
  finalize: "/api/search/finalize",
  enrichment: "/api/search/enrichment",
};

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const configuredBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  const normalizedBaseUrl = normalizeBaseUrl(configuredBaseUrl);

  if (!normalizedBaseUrl) {
    throw new Error("Missing Expo extra.apiBaseUrl configuration for mobile API requests.");
  }

  return normalizedBaseUrl;
}

export function buildApiUrl(path) {
  const normalizedPath = String(path || "").trim();

  if (!normalizedPath.startsWith("/")) {
    throw new Error(`API path must start with "/". Received: ${normalizedPath}`);
  }

  return `${getApiBaseUrl()}${normalizedPath}`;
}

export function getApiEndpoints() {
  return Object.fromEntries(
    Object.entries(SEARCH_API_PATHS).map(([key, path]) => [key, buildApiUrl(path)]),
  );
}

export { SEARCH_API_PATHS };
