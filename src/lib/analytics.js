import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import { buildApiUrl } from "./api";

const SESSION_STORAGE_KEY = "focamai_analytics_session_id";

let cachedSessionId = "";
let sessionIdPromise = null;

function isAnalyticsEnabled() {
  if (process.env.NODE_ENV === "test") {
    return false;
  }

  return globalThis.__FOCAMAI_DISABLE_ANALYTICS__ !== true;
}

async function createSessionId() {
  return Crypto.randomUUID();
}

export async function getOrCreateAnalyticsSessionId() {
  if (!isAnalyticsEnabled()) {
    return "analytics-disabled";
  }

  if (cachedSessionId) {
    return cachedSessionId;
  }

  if (!sessionIdPromise) {
    sessionIdPromise = (async () => {
      try {
        const existingSessionId = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

        if (existingSessionId) {
          cachedSessionId = existingSessionId;
          return existingSessionId;
        }

        const nextSessionId = await createSessionId();
        cachedSessionId = nextSessionId;
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
        return nextSessionId;
      } catch {
        const fallbackSessionId = await createSessionId();
        cachedSessionId = fallbackSessionId;
        return fallbackSessionId;
      }
    })().finally(() => {
      sessionIdPromise = null;
    });
  }

  return sessionIdPromise;
}

export function createAnalyticsSearchId() {
  if (!isAnalyticsEnabled()) {
    return "analytics-disabled";
  }

  return Crypto.randomUUID();
}

export function trackAnalytics(event) {
  if (!isAnalyticsEnabled()) {
    return;
  }

  const request = fetch(buildApiUrl("/api/analytics/track"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (request && typeof request.catch === "function") {
    request.catch(() => {});
  }
}
