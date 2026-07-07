import { scrubSentryEvent } from "../sentry";

describe("Sentry event scrubbing", () => {
  it("removes user and request context while preserving crash details", () => {
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
        exception: { values: [{ type: "Error", value: "render failed" }] },
      }),
    );
    expect(event.breadcrumbs).toBeUndefined();
    expect(event.extra).toBeUndefined();
    expect(event.request).toBeUndefined();
    expect(event.user).toBeUndefined();
  });
});
