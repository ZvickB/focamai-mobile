import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  mergeDeepDiveEligibilityIntoResults,
  useMobileSearchController,
} from "../useMobileSearchController";
import {
  discoverProducts,
  finalizeSearch,
  getRefinementPrompt,
  getRetryAdvice,
  pollEnrichment,
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
  normalizeImprovePicksSuggestions: jest.fn((payload) => payload?.improvePicksSuggestions || []),
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

jest.mock("../searchFlowSnapshot", () => ({
  clearFlowSnapshot: jest.fn().mockResolvedValue(undefined),
  readFlowSnapshot: jest.fn().mockResolvedValue(null),
  saveFlowSnapshot: jest.fn().mockResolvedValue(undefined),
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

  it("preserves follow-up notes when accepting a suggested recovery search", async () => {
    finalizeSearch.mockResolvedValue({
      clientTimingMs: 21,
      results: [finalPick],
      selection: {
        candidateRecovery: {
          goodCandidateCount: 1,
          suggestedQuery: "compact travel stroller under $250",
        },
      },
    });
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => result.current.startDiscoverySearch({ queryOverride: "travel stroller" }));
    await waitFor(() => expect(result.current.canFinalize).toBe(true));
    act(() => result.current.setFollowUpNotes("fits overhead bins"));
    await act(async () => { await result.current.finalizeFocusedPicks(); });

    expect(result.current.candidateRecovery).toEqual({
      goodCandidateCount: 1,
      suggestedQuery: "compact travel stroller under $250",
    });

    act(() => result.current.findBetterMatches());

    await waitFor(() => {
      expect(discoverProducts).toHaveBeenLastCalledWith({
        amazonDomain: "amazon.com",
        cacheMode: "refresh",
        query: "compact travel stroller under $250",
      });
    });
    expect(result.current.followUpNotes).toBe("fits overhead bins");

    unmount();
  });

  it("keeps polling after explanations until Deep Dive eligibility arrives", async () => {
    pollEnrichment
      .mockResolvedValueOnce({ ready: true, entries: [finalPick] })
      .mockResolvedValueOnce({
        ready: true,
        entries: [finalPick],
        deepDiveEligibility: {
          decisions: [{
            candidate_id: "candidate-1",
            recommendation: "show",
            mode: "offers_and_reviews",
          }],
        },
      });
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => result.current.startDiscoverySearch({ queryOverride: "travel stroller" }));
    await waitFor(() => expect(result.current.canFinalize).toBe(true));
    jest.useFakeTimers();
    await act(async () => { await result.current.finalizeFocusedPicks(); });

    await act(async () => {
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    expect(pollEnrichment).toHaveBeenCalledTimes(1);
    expect(result.current.finalResults[0].deepDiveEligibility).toBeUndefined();

    await act(async () => {
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    expect(pollEnrichment).toHaveBeenCalledTimes(2);
    expect(result.current.finalResults[0].deepDiveEligibility).toMatchObject({
      recommendation: "show",
      mode: "offers_and_reviews",
    });

    unmount();
    jest.useRealTimers();
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

    expect(result.current.retryAdviceError).toBe("");
    expect(result.current.isGeneratingRetryAdvice).toBe(false);

    unmount();
  });

  it("automatically starts refreshed discovery from safe retry advice", async () => {
    getRetryAdvice.mockResolvedValue({
      rationale: "Keep portability and lower the weight.",
      suggestedQuery: "lightweight travel stroller",
    });
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => {
      result.current.startDiscoverySearch({ queryOverride: "travel stroller" });
    });
    await waitFor(() => expect(result.current.canFinalize).toBe(true));

    await act(async () => {
      await result.current.finalizeFocusedPicks();
    });
    act(() => {
      result.current.setRetryFeedback("avoid heavy options");
    });

    let didStart;
    await act(async () => {
      didStart = await result.current.requestRetryAdvice({
        rejectionFeedback: "avoid heavy options",
      });
    });

    expect(didStart).toBe(true);
    expect(discoverProducts).toHaveBeenLastCalledWith({
      amazonDomain: "amazon.com",
      cacheMode: "refresh",
      query: "lightweight travel stroller",
    });
    expect(result.current.productQuery).toBe("lightweight travel stroller");
    expect(result.current.retrySearchQuery).toBe("lightweight travel stroller");

    act(() => {
      result.current.startDiscoverySearch({ queryOverride: "car seat" });
    });

    expect(result.current.retrySearchQuery).toBe("");

    unmount();
  });
});

describe("mergeDeepDiveEligibilityIntoResults", () => {
  it("merges eligibility by stable candidate id without changing unmatched results", () => {
    const results = [{ id: "candidate-1" }, { id: "candidate-2" }];
    const merged = mergeDeepDiveEligibilityIntoResults(results, {
      decisions: [{
        candidate_id: "candidate-1",
        recommendation: "maybe",
        mode: "reviews_only",
        confidence: "medium",
        reason: "review evidence available",
      }],
    });

    expect(merged[0].deepDiveEligibility).toEqual({
      recommendation: "maybe",
      mode: "reviews_only",
      confidence: "medium",
      reason: "review evidence available",
    });
    expect(merged[1]).toBe(results[1]);
  });
});
