import { Platform } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";
const ENABLED = String(process.env.EXPO_PUBLIC_MOBILE_ANALYTICS_ENABLED || "").toLowerCase() === "true";
let postChain = Promise.resolve();

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  // Expo Go does not always expose crypto.randomUUID. These IDs are only
  // per-search correlation values, but they must still match Supabase's UUID
  // columns rather than using a timestamp-shaped fallback.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    const digit = character === "x" ? value : (value & 0x3) | 0x8;
    return digit.toString(16);
  });
}

export function isMobileAnalyticsEnabled() {
  return ENABLED && Boolean(API_BASE_URL);
}

export function createMobileAnalyticsRun({ amazonDomain, query }) {
  if (!isMobileAnalyticsEnabled()) return null;

  return {
    amazonDomain: String(amazonDomain || "").trim(),
    query: String(query || "").trim(),
    searchId: createId(),
    sessionId: createId(),
  };
}

export function trackMobileAnalytics(run, event, payload = {}) {
  if (!run || !isMobileAnalyticsEnabled()) {
    if (__DEV__) {
      console.info("[Focamai mobile analytics] skipped", {
        enabled: isMobileAnalyticsEnabled(),
        event,
        hasRun: Boolean(run),
      });
    }
    return;
  }

  if (__DEV__) {
    console.info("[Focamai mobile analytics] sending", { event });
  }

  postChain = postChain
    .then(() => fetch(`${API_BASE_URL}/api/analytics/mobile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        payload,
        platform: Platform.OS === "ios" ? "ios" : "android",
        searchId: run.searchId,
        sessionId: run.sessionId,
      }),
    }))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Analytics endpoint returned ${response.status}.`);
      }

      if (__DEV__) {
        console.info("[Focamai mobile analytics] delivered", { event });
      }
    })
    .catch((error) => {
      if (__DEV__) {
        console.warn("[Focamai mobile analytics] delivery failed", {
          event,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      // Tracking must never affect the shopping flow.
    });
}

export function trackMobileSearchStarted(run) {
  trackMobileAnalytics(run, "search_started", {
    amazonDomain: run?.amazonDomain || "",
    query: run?.query || "",
  });
}
