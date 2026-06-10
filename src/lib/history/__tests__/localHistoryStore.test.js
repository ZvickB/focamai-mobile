import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  MAX_HISTORY_ENTRIES,
  SEARCH_HISTORY_STORAGE_KEY,
  localHistoryStore,
  readLocalHistoryEntries,
} from "../localHistoryStore";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("localHistoryStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("saves newest entries first and dedupes by query key", async () => {
    const firstEntry = await localHistoryStore.save({
      followUp: "under $200",
      query: "Travel Stroller",
      results: [{ id: "old" }],
    });
    const secondEntry = await localHistoryStore.save({
      followUp: "quiet",
      query: "air purifier",
      results: [{ id: "air" }],
    });
    const updatedEntry = await localHistoryStore.save({
      followUp: " under   $200 ",
      query: " travel stroller ",
      results: [{ id: "new" }],
    });

    const entries = await localHistoryStore.list();

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: firstEntry.id,
      query: "travel stroller",
      results: [{ id: "new" }],
    });
    expect(entries[0].createdAt).toBe(firstEntry.createdAt);
    expect(entries[0].updatedAt).not.toBe(firstEntry.updatedAt);
    expect(entries[1].id).toBe(secondEntry.id);
    expect(updatedEntry.id).toBe(firstEntry.id);
  });

  it("removes and clears entries", async () => {
    const entry = await localHistoryStore.save({ query: "desk lamp" });

    await localHistoryStore.remove(entry.id);
    expect(await localHistoryStore.list()).toEqual([]);

    await localHistoryStore.save({ query: "desk lamp" });
    await localHistoryStore.clear();
    expect(await localHistoryStore.list()).toEqual([]);
  });

  it("handles corrupt storage without crashing", async () => {
    await AsyncStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, "{bad-json");

    await expect(readLocalHistoryEntries()).resolves.toEqual([]);
  });

  it("caps stored entries", async () => {
    for (let index = 0; index < MAX_HISTORY_ENTRIES + 5; index += 1) {
      await localHistoryStore.save({ query: `query ${index}` });
    }

    expect(await localHistoryStore.list()).toHaveLength(MAX_HISTORY_ENTRIES);
  });
});
