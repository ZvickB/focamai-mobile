import * as Sentry from "@sentry/react-native";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN || "";
const allowDevelopmentReporting =
  String(process.env.EXPO_PUBLIC_SENTRY_DEBUG_ENABLED || "").trim().toLowerCase() === "true";
const sentryEnabled = Boolean(sentryDsn) && (!__DEV__ || allowDevelopmentReporting);
const tracesSampleRate = allowDevelopmentReporting ? 1 : 0.1;
const sentryEnvironment = __DEV__ ? "development" : allowDevelopmentReporting ? "internal" : "production";
const navigationIntegration = Sentry.reactNavigationIntegration();
const tracingIntegration = Sentry.reactNativeTracingIntegration({
  traceFetch: false,
  traceXHR: false,
});

export function scrubSentryEvent(event) {
  if (!event || typeof event !== "object") {
    return event;
  }

  return {
    ...event,
    breadcrumbs: undefined,
    extra: undefined,
    exception: event.exception
      ? {
          ...event.exception,
          values: event.exception.values?.map((exception) => ({
            ...exception,
            value: "Error message redacted",
          })),
        }
      : undefined,
    message: undefined,
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
    beforeSendTransaction: scrubSentryEvent,
    dsn: sentryDsn,
    enableAppHangTracking: false,
    enableAppStartTracking: true,
    enableAutoPerformanceTracing: true,
    enableAutoSessionTracking: false,
    enabled: sentryEnabled,
    environment: sentryEnvironment,
    integrations: [navigationIntegration, tracingIntegration],
    maxBreadcrumbs: 0,
    profilesSampleRate: 0,
    sendDefaultPii: false,
    tracesSampleRate,
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
  return sentryEnabled
    ? Sentry.wrap(Component, {
        touchEventBoundaryProps: {
          enableRageTapDetection: false,
          extractTextFromChildren: false,
        },
      })
    : Component;
}

export function markSentryAppLoaded() {
  if (sentryEnabled) {
    Sentry.appLoaded();
  }
}

export function isSentryVerificationEnabled() {
  return allowDevelopmentReporting;
}

export function sendSentryVerificationError() {
  if (!sentryEnabled) {
    return false;
  }

  Sentry.captureException(new Error("Sentry verification error"), {
    tags: { sentry_verification: "true" },
  });
  return true;
}

export function sendSentryVerificationTransaction() {
  if (!sentryEnabled) {
    return false;
  }

  Sentry.startSpan(
    {
      forceTransaction: true,
      name: "Sentry verification performance transaction",
      op: "ui.action",
      parentSpan: null,
    },
    () => undefined,
  );
  return true;
}
