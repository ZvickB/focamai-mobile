function isEnabled(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

export function isMobileDeepDiveUiEnabled() {
  return isEnabled(process.env.EXPO_PUBLIC_DEEP_DIVE_UI_ENABLED);
}

export function isMobileAccountUiEnabled() {
  return isEnabled(process.env.EXPO_PUBLIC_ACCOUNT_UI_ENABLED);
}

export function isMobilePriceWatchUiEnabled() {
  return isEnabled(process.env.EXPO_PUBLIC_PRICE_WATCH_UI_ENABLED);
}

export function isSentryVerificationUiEnabled() {
  return isEnabled(process.env.EXPO_PUBLIC_SENTRY_DEBUG_ENABLED);
}
