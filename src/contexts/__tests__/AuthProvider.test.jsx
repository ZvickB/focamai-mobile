jest.mock("expo-secure-store", () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock("../../lib/history/localHistoryStore", () => ({
  localHistoryStore: {
    clear: jest.fn(),
    list: jest.fn(),
    remove: jest.fn(),
  },
}));

import { localHistoryStore } from "../../lib/history/localHistoryStore";
import { migrateLocalHistoryToAccount } from "../AuthProvider";

describe("migrateLocalHistoryToAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localHistoryStore.list.mockResolvedValue([
      { id: "local-1", query: "stroller" },
      { id: "local-2", query: "car seat" },
    ]);
    localHistoryStore.remove.mockResolvedValue();
  });

  it("removes only entries that were migrated instead of clearing all local history", async () => {
    const remoteStore = {
      save: jest.fn().mockResolvedValue({}),
    };

    await migrateLocalHistoryToAccount(remoteStore);

    expect(remoteStore.save).toHaveBeenCalledTimes(2);
    expect(localHistoryStore.remove).toHaveBeenCalledWith("local-1");
    expect(localHistoryStore.remove).toHaveBeenCalledWith("local-2");
    expect(localHistoryStore.clear).not.toHaveBeenCalled();
  });

  it("stops before local cleanup when migration is cancelled mid-flight", async () => {
    let shouldContinue = true;
    const remoteStore = {
      save: jest.fn().mockImplementation(async () => {
        shouldContinue = false;
      }),
    };

    await migrateLocalHistoryToAccount(remoteStore, () => shouldContinue);

    expect(remoteStore.save).toHaveBeenCalledTimes(1);
    expect(localHistoryStore.remove).not.toHaveBeenCalled();
    expect(localHistoryStore.clear).not.toHaveBeenCalled();
  });
});
