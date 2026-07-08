import AsyncStorage from "@react-native-async-storage/async-storage";

export const DEFAULT_AMAZON_DOMAIN = "amazon.com";
export const AMAZON_MARKETPLACE_STORAGE_KEY = "focamai_marketplace";
export const AMAZON_MARKETPLACE_PROMPT_SEEN_KEY = "focamai_marketplace_asked";

export const AMAZON_MARKETPLACES = [
  { countryCode: "US", domain: "amazon.com", label: "United States", pricePrefix: "$" },
  { countryCode: "CA", domain: "amazon.ca", label: "Canada", pricePrefix: "CA$" },
  { countryCode: "IN", domain: "amazon.in", label: "India", pricePrefix: "₹" },
];

const SUPPORTED_AMAZON_DOMAINS = new Set(AMAZON_MARKETPLACES.map(({ domain }) => domain));

export function normalizeAmazonDomain(value = "") {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toLowerCase();
  return SUPPORTED_AMAZON_DOMAINS.has(normalized) ? normalized : "";
}

export function getAmazonMarketplaceLabel(domain = DEFAULT_AMAZON_DOMAIN) {
  const normalizedDomain = normalizeAmazonDomain(domain) || DEFAULT_AMAZON_DOMAIN;
  const marketplace = AMAZON_MARKETPLACES.find((item) => item.domain === normalizedDomain);

  return marketplace ? marketplace.label : "United States";
}

export async function loadSavedAmazonDomain() {
  try {
    const savedDomain = await AsyncStorage.getItem(AMAZON_MARKETPLACE_STORAGE_KEY);

    return normalizeAmazonDomain(savedDomain) || DEFAULT_AMAZON_DOMAIN;
  } catch {
    return DEFAULT_AMAZON_DOMAIN;
  }
}

export async function saveAmazonDomainPreference(domain) {
  const normalizedDomain = normalizeAmazonDomain(domain) || DEFAULT_AMAZON_DOMAIN;

  try {
    await AsyncStorage.setItem(AMAZON_MARKETPLACE_STORAGE_KEY, normalizedDomain);
    return {
      domain: normalizedDomain,
      saved: true,
    };
  } catch {
    // Search should keep working even if device storage is unavailable.
  }

  return {
    domain: normalizedDomain,
    saved: false,
  };
}

export async function loadAmazonMarketplacePreference() {
  try {
    const savedDomain = await AsyncStorage.getItem(AMAZON_MARKETPLACE_STORAGE_KEY);
    const normalizedDomain = normalizeAmazonDomain(savedDomain);

    return {
      domain: normalizedDomain || DEFAULT_AMAZON_DOMAIN,
      hasSavedPreference: Boolean(normalizedDomain),
    };
  } catch {
    return {
      domain: DEFAULT_AMAZON_DOMAIN,
      hasSavedPreference: false,
    };
  }
}

export async function hasSeenAmazonMarketplacePrompt() {
  try {
    return (await AsyncStorage.getItem(AMAZON_MARKETPLACE_PROMPT_SEEN_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function saveAmazonMarketplacePromptSeen() {
  try {
    await AsyncStorage.setItem(AMAZON_MARKETPLACE_PROMPT_SEEN_KEY, "true");
    return true;
  } catch {
    // The prompt can safely reappear if storage is unavailable.
  }

  return false;
}

export async function saveAmazonMarketplaceSelection(domain) {
  const preference = await saveAmazonDomainPreference(domain);
  let promptSeenSaved = false;

  if (preference.saved) {
    promptSeenSaved = await saveAmazonMarketplacePromptSeen();
  }

  return {
    domain: preference.domain,
    promptSeenSaved,
    saved: preference.saved,
  };
}
