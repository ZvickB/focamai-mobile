import {
  createPriceWatchStore,
  mapRowToWatch,
  mapWatchInputToRow,
  mapWatchPatchToRow,
} from "../watchStore";

function createFluentResult(result, terminal = "maybeSingle") {
  const builder = {};
  ["select", "eq", "order", "insert", "update", "delete"].forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  builder[terminal] = jest.fn().mockResolvedValue(result);
  if (terminal === "then") {
    builder.then = (resolve) => Promise.resolve(result).then(resolve);
  }
  return builder;
}

describe("price watch mapping", () => {
  it("maps Supabase rows to the mobile watch contract", () => {
    expect(mapRowToWatch({
      id: "watch-1",
      asin: "B012345678",
      amazon_domain: "amazon.ca",
      baseline_price: "120.50",
      threshold_pct: "7.5",
      target_price: "99.99",
      paused: true,
    })).toMatchObject({
      id: "watch-1",
      asin: "B012345678",
      amazonDomain: "amazon.ca",
      baselinePrice: 120.5,
      thresholdPct: 7.5,
      targetPrice: 99.99,
      paused: true,
    });
  });

  it("validates new watches and applies the five-percent default", () => {
    expect(mapWatchInputToRow({
      asin: "B012345678",
      amazonDomain: "amazon.com",
      baselinePrice: 120,
    }, "user-1")).toMatchObject({
      asin: "B012345678",
      baseline_price: 120,
      threshold_pct: 5,
      target_price: null,
      user_id: "user-1",
    });

    expect(() => mapWatchInputToRow({ asin: "", baselinePrice: 120 }, "user-1"))
      .toThrow("missing an ASIN");
    expect(() => mapWatchInputToRow({ asin: "B012345678", baselinePrice: 0 }, "user-1"))
      .toThrow("current price");
  });

  it("clears optional targets and validates threshold updates", () => {
    expect(mapWatchPatchToRow({ targetPrice: null })).toMatchObject({ target_price: null });
    expect(mapWatchPatchToRow({ paused: true })).toMatchObject({ paused: true });
    expect(() => mapWatchPatchToRow({ thresholdPct: 101 })).toThrow("between 1 and 100");
  });

  it("returns an existing watch instead of inserting a duplicate", async () => {
    const existing = createFluentResult({
      data: { id: "watch-1", asin: "B012345678", baseline_price: 120, threshold_pct: 5 },
      error: null,
    });
    const client = { from: jest.fn(() => existing) };
    const store = createPriceWatchStore({ client, userId: "user-1" });

    const saved = await store.create({ asin: "B012345678", baselinePrice: 120 });

    expect(saved.id).toBe("watch-1");
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("blocks a sixth watch while counting paused watches", async () => {
    const existing = createFluentResult({ data: null, error: null });
    const count = createFluentResult({ count: 5, error: null }, "then");
    const client = { from: jest.fn().mockReturnValueOnce(existing).mockReturnValueOnce(count) };
    const store = createPriceWatchStore({ client, userId: "user-1" });

    await expect(store.create({ asin: "B012345678", baselinePrice: 120 }))
      .rejects.toThrow("up to 5 products");
    expect(client.from).toHaveBeenCalledTimes(2);
  });
});
