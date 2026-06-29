import { renderHook, act, waitFor } from "@testing-library/react-native";

import { useWatches } from "../useWatches";
import { watchStore } from "../../../lib/watch/watchStore";

jest.mock("../../../lib/watch/watchStore", () => ({
  watchStore: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

describe("useWatches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    watchStore.list.mockResolvedValue([]);
  });

  it("loads watches on mount", async () => {
    const watches = [{ id: "w1", asin: "B001" }, { id: "w2", asin: "B002" }];
    watchStore.list.mockResolvedValue(watches);

    const { result } = renderHook(() => useWatches());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.watches).toEqual(watches);
    expect(result.current.error).toBe("");
  });

  it("sets error message on load failure", async () => {
    watchStore.list.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useWatches());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.watches).toEqual([]);
    expect(result.current.error).toBe("Network error");
  });

  it("sets generic error for non-Error throws", async () => {
    watchStore.list.mockRejectedValue("some string error");

    const { result } = renderHook(() => useWatches());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Unable to load price watches.");
  });

  it("skips loading when disabled", async () => {
    const { result } = renderHook(() => useWatches({ enabled: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(watchStore.list).not.toHaveBeenCalled();
    expect(result.current.watches).toEqual([]);
  });

  it("creates a watch and refreshes the list", async () => {
    const newWatch = { id: "w1", asin: "B001" };
    watchStore.create.mockResolvedValue(newWatch);
    watchStore.list.mockResolvedValue([newWatch]);

    const { result } = renderHook(() => useWatches());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let savedWatch;
    await act(async () => {
      savedWatch = await result.current.create({ asin: "B001", baselinePrice: 100 });
    });

    expect(savedWatch).toEqual(newWatch);
    expect(watchStore.create).toHaveBeenCalledWith({ asin: "B001", baselinePrice: 100 });
    expect(result.current.watches).toEqual([newWatch]);
  });

  it("updates a watch and refreshes", async () => {
    const updatedWatch = { id: "w1", paused: true };
    watchStore.update.mockResolvedValue(updatedWatch);
    watchStore.list.mockResolvedValue([updatedWatch]);

    const { result } = renderHook(() => useWatches());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.update("w1", { paused: true });
    });

    expect(watchStore.update).toHaveBeenCalledWith("w1", { paused: true });
  });

  it("removes a watch and refreshes", async () => {
    watchStore.remove.mockResolvedValue();
    watchStore.list
      .mockResolvedValueOnce([{ id: "w1" }]) // initial load
      .mockResolvedValueOnce([]); // after remove

    const { result } = renderHook(() => useWatches());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.remove("w1");
    });

    expect(watchStore.remove).toHaveBeenCalledWith("w1");
    expect(result.current.watches).toEqual([]);
  });

  it("refresh returns the loaded watches", async () => {
    const watches = [{ id: "w1" }];
    watchStore.list.mockResolvedValue(watches);

    const { result } = renderHook(() => useWatches());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let refreshed;
    await act(async () => {
      refreshed = await result.current.refresh();
    });

    expect(refreshed).toEqual(watches);
  });
});
