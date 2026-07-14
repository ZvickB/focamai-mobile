import * as Sentry from "@sentry/react-native";
import {
  scrubSentryEvent,
  sendSentryVerificationError,
  sendSentryVerificationTransaction,
} from "../sentry";

describe("Sentry event scrubbing", () => {
  it("removes private event context and error messages while preserving crash type", () => {
    const event = scrubSentryEvent({
      breadcrumbs: [{ message: "search text" }],
      contexts: { device: { model: "test-device" } },
      exception: { values: [{ type: "Error", value: "render failed" }] },
      extra: { query: "private query" },
      request: { url: "https://example.test/private" },
      user: { email: "person@example.test" },
    });

    expect(event).toEqual(
      expect.objectContaining({
        contexts: { device: { model: "test-device" } },
        exception: { values: [{ type: "Error", value: "Error message redacted" }] },
      }),
    );
    expect(event.breadcrumbs).toBeUndefined();
    expect(event.extra).toBeUndefined();
    expect(event.request).toBeUndefined();
    expect(event.user).toBeUndefined();
    expect(event.message).toBeUndefined();
  });

  it("keeps verification signals explicit and transaction-only", () => {
    expect(sendSentryVerificationError()).toBe(false);
    expect(sendSentryVerificationTransaction()).toBe(false);
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.startSpan).not.toHaveBeenCalled();
  });
});
