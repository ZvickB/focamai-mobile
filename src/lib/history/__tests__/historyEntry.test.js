import {
  createHistoryEntry,
  makeQueryKey,
  normalizeHistoryText,
} from "../historyEntry";

describe("historyEntry", () => {
  it("normalizes query text for dedupe keys", () => {
    expect(normalizeHistoryText("  Travel   Stroller  ")).toBe("travel stroller");
    expect(makeQueryKey("Travel Stroller", " Under $200 ")).toBe(
      makeQueryKey(" travel   stroller ", "under   $200"),
    );
  });

  it("creates the shared history entry shape", () => {
    const entry = createHistoryEntry({
      amazonDomain: "amazon.com",
      followUp: "under $200",
      query: "travel stroller",
      results: [{ id: "pick-1" }],
    });

    expect(entry).toMatchObject({
      amazonDomain: "amazon.com",
      followUp: "under $200",
      query: "travel stroller",
      queryKey: makeQueryKey("travel stroller", "under $200"),
      results: [{ id: "pick-1" }],
    });
    expect(entry.id).toBeTruthy();
    expect(entry.createdAt).toBeTruthy();
    expect(entry.updatedAt).toBeTruthy();
  });

  it("drops malformed result payloads to an empty list", () => {
    expect(createHistoryEntry({ query: "chair", results: null }).results).toEqual([]);
  });
});
