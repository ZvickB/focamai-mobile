import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useMobileSearchController } from "../useMobileSearchController";
import {
  discoverProducts,
  finalizeSearch,
  getRefinementPrompt,
  getRetryAdvice,
} from "../searchApi";
import { historyStore } from "../../lib/history/historyStore";

jest.mock("../amazonMarketplaces", () => ({
  DEFAULT_AMAZON_DOMAIN: "amazon.com",
  getAmazonMarketplaceLabel: jest.fn((domain) => domain),
  hasSeenAmazonMarketplacePrompt: jest.fn().mockResolvedValue(true),
  loadAmazonMarketplacePreference: jest.fn().mockResolvedValue({
    domain: "amazon.com",
    hasSavedPreference: true,
  }),
  normalizeAmazonDomain: jest.fn((domain) => domain || "amazon.com"),
  saveAmazonMarketplaceSelection: jest.fn().mockResolvedValue({ domain: "amazon.com" }),
}));

jest.mock("../searchApi", () => ({
  discoverProducts: jest.fn(),
  finalizeSearch: jest.fn(),
  getRetryAdvice: jest.fn(),
  getRefinementPrompt: jest.fn(),
  normalizeFinalResults: jest.fn((results) => (Array.isArray(results) ? results : [])),
  normalizePreviewResults: jest.fn((results) => (Array.isArray(results) ? results : [])),
  normalizeQueryQualitySuggestion: jest.fn(),
  normalizeRefinementSuggestions: jest.fn(() => []),
  pollEnrichment: jest.fn(),
  pollQueryQuality: jest.fn(),
}));

jest.mock("../../lib/history/historyStore", () => ({
  historyStore: {
    save: jest.fn().mockResolvedValue({}),
  },
}));

function createDeferred() {
  let reject;
  let resolve;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

const finalPick = {
  caveat: "A little larger than the smallest travel models.",
  feature_bullets: ["Compact fold"],
  fit_reason: "Matches the travel-focused request.",
  id: "candidate-1",
  image: "",
  link: "",
  price: "$199",
  provider: "Amazon",
  rating: 4.4,
  reviewCount: 128,
  title: "Compact Travel Stroller",
};

describe("useMobileSearchController", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    discoverProducts.mockResolvedValue({
      amazonDomain: "amazon.com",
      candidatePool: {
        candidates: [{ id: "candidate-1", title: "Compact Travel Stroller" }],
      },
      clientTimingMs: 12,
      discoveryToken: "token-1",
      previewResults: [],
      source: "test",
    });
    getRefinementPrompt.mockResolvedValue({
      followUpPlaceholder: "Add details",
      helperText: "",
      prompt: "What matters most?",
    });
    finalizeSearch.mockResolvedValue({
      clientTimingMs: 21,
      results: [finalPick],
    });
    historyStore.save.mockResolvedValue({});
  });

  it("saves completed finalized searches to history", async () => {
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => {
      result.current.startDiscoverySearch({ queryOverride: "travel stroller" });
    });

    await waitFor(() => {
      expect(result.current.canFinalize).toBe(true);
    });

    act(() => {
      result.current.setFollowUpNotes("under $250");
    });

    await act(async () => {
      await result.current.finalizeFocusedPicks();
    });

    expect(historyStore.save).toHaveBeenCalledWith({
      amazonDomain: "amazon.com",
      followUp: "under $250",
      query: "travel stroller",
      results: [finalPick],
    });

    unmount();
  });

  it("does not save empty finalize payloads", async () => {
    finalizeSearch.mockResolvedValue({
      clientTimingMs: 21,
      results: [],
    });
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => {
      result.current.startDiscoverySearch({ queryOverride: "travel stroller" });
    });

    await waitFor(() => {
      expect(result.current.canFinalize).toBe(true);
    });

    await act(async () => {
      await result.current.finalizeFocusedPicks();
    });

    expect(historyStore.save).not.toHaveBeenCalled();

    unmount();
  });

  it("ignores retry-advice responses after feedback changes", async () => {
    const retryAdviceRequest = createDeferred();
    getRetryAdvice.mockReturnValue(retryAdviceRequest.promise);
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => {
      result.current.startDiscoverySearch({ queryOverride: "travel stroller" });
    });

    await waitFor(() => {
      expect(result.current.canFinalize).toBe(true);
    });

    await act(async () => {
      await result.current.finalizeFocusedPicks();
    });

    await waitFor(() => {
      expect(result.current.finalResults).toHaveLength(1);
    });

    act(() => {
      result.current.setRetryFeedback("too bulky");
    });

    await waitFor(() => {
      expect(result.current.retryFeedback).toBe("too bulky");
    });

    act(() => {
      result.current.requestRetryAdvice({ rejectionFeedback: "too bulky" });
    });

    await waitFor(() => {
      expect(result.current.isGeneratingRetryAdvice).toBe(true);
    });

    act(() => {
      result.current.setRetryFeedback("avoid heavy options");
    });

    await waitFor(() => {
      expect(result.current.retryFeedback).toBe("avoid heavy options");
    });

    await act(async () => {
      retryAdviceRequest.resolve({
        rationale: "Try a narrower travel-stroller phrase.",
        suggestedQuery: "compact travel stroller",
      });
      await retryAdviceRequest.promise;
    });

    expect(result.current.retryAdvice).toBeNull();
    expect(result.current.retryAdviceError).toBe("");
    expect(result.current.isGeneratingRetryAdvice).toBe(false);

    unmount();
  });
});
