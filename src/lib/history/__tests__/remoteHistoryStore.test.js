import { createRemoteHistoryStore } from "../remoteHistoryStore";

function createFluentBuilder(result) {
  const builder = {};
  ["select", "eq", "order", "upsert", "delete", "single"].forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  builder.select.mockReturnValue(builder);
  builder.single.mockResolvedValue(result);
  builder.order.mockResolvedValue(result);
  builder.delete.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

describe("createRemoteHistoryStore", () => {
  const userId = "user-abc";

  function makeClient(builder) {
    return { from: jest.fn(() => builder) };
  }

  describe("list", () => {
    it("returns mapped history entries sorted by updated_at descending", async () => {
      const rows = [
        { id: "r1", query: "stroller", follow_up: "under $200", amazon_domain: "amazon.com", results: [{ id: "p1" }], created_at: "2025-01-01", updated_at: "2025-01-02" },
        { id: "r2", query: "car seat", follow_up: "", amazon_domain: "", results: [], created_at: "2025-01-01", updated_at: "2025-01-01" },
      ];
      const builder = createFluentBuilder({ data: rows, error: null });
      builder.order.mockResolvedValue({ data: rows, error: null });
      const client = makeClient(builder);
      const store = createRemoteHistoryStore({ client, userId });

      const entries = await store.list();

      expect(client.from).toHaveBeenCalledWith("saved_searches");
      expect(entries).toHaveLength(2);
      expect(entries[0]).toMatchObject({ id: "r1", query: "stroller", followUp: "under $200" });
      expect(entries[1]).toMatchObject({ id: "r2", query: "car seat", followUp: "" });
    });

    it("returns empty array when data is null", async () => {
      const builder = createFluentBuilder({ data: null, error: null });
      builder.order.mockResolvedValue({ data: null, error: null });
      const store = createRemoteHistoryStore({ client: makeClient(builder), userId });

      expect(await store.list()).toEqual([]);
    });

    it("throws on Supabase error", async () => {
      const builder = createFluentBuilder({ data: null, error: { message: "network error" } });
      builder.order.mockResolvedValue({ data: null, error: { message: "network error" } });
      const store = createRemoteHistoryStore({ client: makeClient(builder), userId });

      await expect(store.list()).rejects.toEqual({ message: "network error" });
    });
  });

  describe("save", () => {
    it("upserts an entry and returns the mapped result", async () => {
      const savedRow = {
        id: "r1", query: "stroller", follow_up: "under $200",
        amazon_domain: "amazon.com", results: [{ id: "p1" }],
        created_at: "2025-01-01", updated_at: "2025-01-02",
      };
      const builder = createFluentBuilder({ data: savedRow, error: null });
      const client = makeClient(builder);
      const store = createRemoteHistoryStore({ client, userId });

      const result = await store.save({ query: "stroller", followUp: "under $200", results: [{ id: "p1" }] });

      expect(result).toMatchObject({ id: "r1", query: "stroller", followUp: "under $200" });
      expect(builder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: userId, query: "stroller" }),
        { onConflict: "user_id,query_key" },
      );
    });

    it("throws on Supabase error", async () => {
      const builder = createFluentBuilder({ data: null, error: { message: "constraint" } });
      const store = createRemoteHistoryStore({ client: makeClient(builder), userId });

      await expect(store.save({ query: "stroller" })).rejects.toEqual({ message: "constraint" });
    });
  });

  describe("remove", () => {
    it("deletes a single entry by id and user_id", async () => {
      const builder = createFluentBuilder({ error: null });
      builder.eq.mockReturnValue(builder);
      builder.delete.mockReturnValue(builder);
      // The final eq call resolves the promise
      let eqCount = 0;
      builder.eq.mockImplementation(() => {
        eqCount += 1;
        if (eqCount >= 2) {
          return Promise.resolve({ error: null });
        }
        return builder;
      });
      const client = makeClient(builder);
      const store = createRemoteHistoryStore({ client, userId });

      await store.remove("r1");

      expect(client.from).toHaveBeenCalledWith("saved_searches");
      expect(builder.delete).toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("deletes all entries for the user", async () => {
      const builder = createFluentBuilder({ error: null });
      builder.delete.mockReturnValue(builder);
      builder.eq.mockResolvedValue({ error: null });
      const client = makeClient(builder);
      const store = createRemoteHistoryStore({ client, userId });

      await store.clear();

      expect(builder.delete).toHaveBeenCalled();
    });
  });
});
