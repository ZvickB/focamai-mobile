const QUERY_KEY_SEPARATOR = "\u0001";

function randomId() {
  return `history-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function normalizeHistoryText(value) {
  return String(value ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function makeQueryKey(query, followUp = "") {
  return [
    normalizeHistoryText(query),
    normalizeHistoryText(followUp),
  ].join(QUERY_KEY_SEPARATOR);
}

export function createHistoryEntry({
  amazonDomain = "",
  createdAt,
  followUp = "",
  id,
  query,
  results = [],
  updatedAt,
} = {}) {
  const displayQuery = String(query ?? "").trim();
  const displayFollowUp = String(followUp ?? "").trim();
  const now = new Date().toISOString();

  return {
    amazonDomain: String(amazonDomain ?? "").trim(),
    createdAt: createdAt || now,
    followUp: displayFollowUp,
    id: id || randomId(),
    query: displayQuery,
    queryKey: makeQueryKey(displayQuery, displayFollowUp),
    results: Array.isArray(results) ? results : [],
    updatedAt: updatedAt || now,
  };
}
