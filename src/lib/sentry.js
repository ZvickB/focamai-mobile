import * as Sentry from "@sentry/react-native";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN || "";
const allowDevelopmentReporting =
  String(process.env.EXPO_PUBLIC_SENTRY_DEBUG_ENABLED || "").trim().toLowerCase() === "true";
const sentryEnabled = Boolean(sentryDsn) && (!__DEV__ || allowDevelopmentReporting);

export function scrubSentryEvent(event) {
  if (!event || typeof event !== "object") {
    return event;
  }

  return {
    ...event,
    breadcrumbs: undefined,
    extra: undefined,
    request: undefined,
    user: undefined,
  };
}

export function initializeSentry() {
  if (!sentryDsn) {
    return false;
  }

  Sentry.init({
    beforeSend: scrubSentryEvent,
    dsn: sentryDsn,
    enableAppHangTracking: false,
    enableAutoPerformanceTracing: false,
    enableAutoSessionTracking: false,
    enabled: sentryEnabled,
    environment: __DEV__ ? "development" : "production",
    maxBreadcrumbs: 0,
    profilesSampleRate: 0,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });

  return sentryEnabled;
}

export function captureReactError(error, errorInfo) {
  if (!sentryEnabled || !error) {
    return;
  }

  const componentStack = String(errorInfo?.componentStack || "").slice(0, 12000);

  Sentry.captureException(error, {
    contexts: componentStack
      ? {
          react: {
            componentStack,
          },
        }
      : undefined,
  });
}

export function wrapWithSentry(Component) {
  return sentryEnabled ? Sentry.wrap(Component) : Component;
}
