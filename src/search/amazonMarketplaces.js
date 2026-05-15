import AsyncStorage from "@react-native-async-storage/async-storage";

export const DEFAULT_AMAZON_DOMAIN = "amazon.com";
export const AMAZON_MARKETPLACE_STORAGE_KEY = "focamai_marketplace";
export const AMAZON_MARKETPLACE_PROMPT_SEEN_KEY = "focamai_marketplace_asked";

export const AMAZON_MARKETPLACES = [
  { countryCode: "US", domain: "amazon.com", label: "United States" },
  { countryCode: "CA", domain: "amazon.ca", label: "Canada" },
  { countryCode: "GB", domain: "amazon.co.uk", label: "United Kingdom" },
  { countryCode: "DE", domain: "amazon.de", label: "Germany" },
  { countryCode: "FR", domain: "amazon.fr", label: "France" },
  { countryCode: "IT", domain: "amazon.it", label: "Italy" },
  { countryCode: "ES", domain: "amazon.es", label: "Spain" },
  { countryCode: "NL", domain: "amazon.nl", label: "Netherlands" },
  { countryCode: "SE", domain: "amazon.se", label: "Sweden" },
  { countryCode: "PL", domain: "amazon.pl", label: "Poland" },
  { countryCode: "BE", domain: "amazon.com.be", label: "Belgium" },
  { countryCode: "AT", domain: "amazon.de", label: "Austria" },
  { countryCode: "AU", domain: "amazon.com.au", label: "Australia" },
  { countryCode: "SG", domain: "amazon.sg", label: "Singapore" },
  { countryCode: "JP", domain: "amazon.co.jp", label: "Japan" },
  { countryCode: "IN", domain: "amazon.in", label: "India" },
  { countryCode: "MX", domain: "amazon.com.mx", label: "Mexico" },
  { countryCode: "BR", domain: "amazon.com.br", label: "Brazil" },
  { countryCode: "AE", domain: "amazon.ae", label: "United Arab Emirates" },
  { countryCode: "SA", domain: "amazon.sa", label: "Saudi Arabia" },
  { countryCode: "EG", domain: "amazon.eg", label: "Egypt" },
  { countryCode: "TR", domain: "amazon.com.tr", label: "Turkey" },
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
  } catch {
    // Search should keep working even if device storage is unavailable.
  }

  return normalizedDomain;
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
  } catch {
    // The prompt can safely reappear if storage is unavailable.
  }
}
