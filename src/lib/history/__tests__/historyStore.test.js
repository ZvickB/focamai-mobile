import {
  getHistoryStore,
  historyStore,
  onHistoryStoreChanged,
  setHistoryStore,
} from "../historyStore";
import { localHistoryStore } from "../localHistoryStore";

jest.mock("../localHistoryStore", () => ({
  localHistoryStore: {
    clear: jest.fn(),
    list: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  },
}));

describe("historyStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHistoryStore(); // reset to default (localHistoryStore)
  });

  it("defaults to localHistoryStore", () => {
    expect(getHistoryStore()).toBe(localHistoryStore);
  });

  it("delegates list/save/remove/clear to the active store", async () => {
    localHistoryStore.list.mockResolvedValue([{ id: "1" }]);
    localHistoryStore.save.mockResolvedValue({ id: "2" });
    localHistoryStore.remove.mockResolvedValue();
    localHistoryStore.clear.mockResolvedValue();

    await expect(historyStore.list()).resolves.toEqual([{ id: "1" }]);
    await historyStore.save({ query: "test" });
    expect(localHistoryStore.save).toHaveBeenCalledWith({ query: "test" });
    await historyStore.remove("1");
    expect(localHistoryStore.remove).toHaveBeenCalledWith("1");
    await historyStore.clear();
    expect(localHistoryStore.clear).toHaveBeenCalled();
  });

  it("switches to a custom store via setHistoryStore", async () => {
    const customStore = {
      clear: jest.fn(),
      list: jest.fn().mockResolvedValue([{ id: "remote-1" }]),
      remove: jest.fn(),
      save: jest.fn(),
    };

    setHistoryStore(customStore);
    expect(getHistoryStore()).toBe(customStore);
    await expect(historyStore.list()).resolves.toEqual([{ id: "remote-1" }]);
  });

  it("resets to localHistoryStore when called with no argument", () => {
    const customStore = { clear: jest.fn(), list: jest.fn(), remove: jest.fn(), save: jest.fn() };
    setHistoryStore(customStore);
    setHistoryStore();
    expect(getHistoryStore()).toBe(localHistoryStore);
  });

  it("notifies listeners when the store changes", () => {
    const listener = jest.fn();
    const unsubscribe = onHistoryStoreChanged(listener);

    setHistoryStore({ clear: jest.fn(), list: jest.fn(), remove: jest.fn(), save: jest.fn() });
    expect(listener).toHaveBeenCalledTimes(1);

    setHistoryStore();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    setHistoryStore();
    expect(listener).toHaveBeenCalledTimes(2); // no more calls after unsubscribe
  });
});
