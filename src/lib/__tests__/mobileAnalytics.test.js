describe("mobile analytics identity", () => {
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const originalAnalyticsEnabled = process.env.EXPO_PUBLIC_MOBILE_ANALYTICS_ENABLED;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.example.com";
    process.env.EXPO_PUBLIC_MOBILE_ANALYTICS_ENABLED = "true";
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    process.env.EXPO_PUBLIC_MOBILE_ANALYTICS_ENABLED = originalAnalyticsEnabled;
    global.fetch = originalFetch;
    jest.resetModules();
  });

  it("includes the current Supabase bearer token without putting identity in the event body", async () => {
    jest.doMock("../supabase", () => ({
      getSupabaseClient: () => ({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: { access_token: "signed-in-token" } },
          }),
        },
      }),
    }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { createMobileAnalyticsRun, trackMobileAnalytics } = require("../mobileAnalytics");
    const run = createMobileAnalyticsRun({ amazonDomain: "amazon.com", query: "travel stroller" });

    await trackMobileAnalytics(run, "search_started", { query: "travel stroller" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/analytics/mobile",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer signed-in-token" }),
      }),
    );
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).not.toHaveProperty("accountId");
  });
});
