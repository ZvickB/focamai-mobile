export const RANKING_PREFERENCES = Object.freeze({
  BALANCED: "balanced",
  PRICE: "price",
  LOWEST_PRICE: "lowest_price",
  BRAND: "brand",
  RANGE: "range",
});

export const RANKING_PREFERENCE_VALUES = Object.freeze(Object.values(RANKING_PREFERENCES));

export const RANKING_PREFERENCE_LABELS = Object.freeze({
  [RANKING_PREFERENCES.BALANCED]: "Balanced",
  [RANKING_PREFERENCES.PRICE]: "Prefer lower prices",
  [RANKING_PREFERENCES.LOWEST_PRICE]: "Lowest prices",
  [RANKING_PREFERENCES.BRAND]: "Known brands",
  [RANKING_PREFERENCES.RANGE]: "Range of options",
});

export function normalizeRankingPreference(value) {
  const normalized = String(value || "").trim().toLowerCase();

  return RANKING_PREFERENCE_VALUES.includes(normalized)
    ? normalized
    : RANKING_PREFERENCES.BALANCED;
}
