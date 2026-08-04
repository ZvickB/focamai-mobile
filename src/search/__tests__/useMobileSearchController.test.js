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
import { readFlowSnapshot } from "../searchFlowSnapshot";

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
  normalizeRefinementAnswerOptions: jest.fn((payload, { alternate = false } = {}) =>
    alternate ? payload?.alternateAnswerOptions || [] : payload?.answerOptions || [],
  ),
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
      alternateAnswerOptions: [
        { label: "Under $200", prompt: "I want to stay under $200." },
        { label: "$200–$400", prompt: "My budget is between $200 and $400." },
        { label: "Above $400", prompt: "I can spend more than $400." },
        { label: "No preference", prompt: "I do not have a budget preference." },
      ],
      alternatePrompt: "What is your target budget?",
      answerOptions: [
        { label: "Daily", prompt: "I will use it every day." },
        { label: "Weekly", prompt: "I will use it weekly." },
        { label: "Occasionally", prompt: "I will use it occasionally." },
        { label: "Not sure", prompt: "I am not sure how often I will use it." },
      ],
      followUpPlaceholder: "Add details",
      helperText: "",
      prompt: "How often will you use it?",
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

  it("combines the selected complete answer with optional notes only for downstream context", async () => {
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => {
      result.current.startDiscoverySearch({ queryOverride: "travel stroller" });
    });
    await waitFor(() => expect(result.current.refinementPrompt).toBeTruthy());

    act(() => {
      result.current.selectRefinementAnswer({
        questionKey: "primary",
        value: "I will use it every day.",
      });
      result.current.setFollowUpNotes("under $250");
    });

    await act(async () => {
      await result.current.finalizeFocusedPicks();
    });

    expect(finalizeSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        followUpNotes: "I will use it every day. under $250",
      }),
    );
    expect(historyStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        followUp: "I will use it every day. under $250",
      }),
    );
    expect(result.current.followUpNotes).toBe("under $250");

    unmount();
  });

  it("switches to the alternate question and clears an answer from the primary question", async () => {
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => {
      result.current.startDiscoverySearch({ queryOverride: "travel stroller" });
    });
    await waitFor(() => expect(result.current.refinementPrompt).toBeTruthy());

    act(() => {
      result.current.selectRefinementAnswer({
        questionKey: "primary",
        value: "I will use it every day.",
      });
      result.current.setFollowUpNotes("under $250");
      result.current.showAlternateRefinementQuestion();
    });

    expect(result.current.activeRefinementQuestionKey).toBe("alternate");
    expect(result.current.selectedRefinementAnswer).toEqual({ questionKey: "", value: "" });
    expect(result.current.followUpNotes).toBe("under $250");

    unmount();
  });

  it("restores the active question and selected answer from the flow snapshot", async () => {
    readFlowSnapshot.mockResolvedValueOnce({
      activeRefinementQuestionKey: "alternate",
      amazonDomain: "amazon.com",
      candidatePool: { candidates: [{ id: "candidate-1" }] },
      discoveryToken: "restored-token",
      followUpNotes: "breathable fabric",
      phase: "refine",
      productQuery: "office chair",
      refinementPrompt: {
        alternateAnswerOptions: [
          { label: "$200–$400", prompt: "My budget is between $200 and $400." },
        ],
        alternatePrompt: "What is your target budget?",
        answerOptions: [],
        prompt: "How often will you use it?",
      },
      selectedRefinementAnswer: {
        questionKey: "alternate",
        value: "My budget is between $200 and $400.",
      },
      submittedQuery: "office chair",
    });
    const { result, unmount } = renderHook(() => useMobileSearchController());

    await waitFor(() => {
      expect(result.current.restoredFlowPhase).toBe("refine");
    });

    expect(result.current.activeRefinementQuestionKey).toBe("alternate");
    expect(result.current.selectedRefinementAnswer).toEqual({
      questionKey: "alternate",
      value: "My budget is between $200 and $400.",
    });
    expect(result.current.followUpNotes).toBe("breathable fabric");

    unmount();
  });

  it("uses matched fallback pairs instead of unrelated legacy refinement chips", async () => {
    getRefinementPrompt.mockResolvedValueOnce({
      alternatePrompt: "Where will you use it?",
      prompt: "Do you need lumbar support?",
      refinementSuggestions: [
        { label: "Lower price", prompt: "I want a lower price." },
        { label: "More mobility", prompt: "I want more mobility." },
        { label: "Deep adjustability", prompt: "I want deep adjustability." },
      ],
    });
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => {
      result.current.startDiscoverySearch({ queryOverride: "office chair" });
    });
    await waitFor(() => expect(result.current.refinementPrompt).toBeTruthy());

    expect(result.current.refinementPrompt.prompt).toBe("What matters most for this purchase?");
    expect(result.current.refinementPrompt.answerOptions.map((answer) => answer.label)).toEqual([
      "Best value",
      "Easiest to use",
      "Best fit",
      "No preference",
    ]);
    expect(result.current.refinementPrompt.alternatePrompt).toBe(
      "What would make an option a poor fit?",
    );

    unmount();
  });

  it("uses a hard constraint from a selected answer for the pre-finalize discovery refresh", async () => {
    getRefinementPrompt.mockResolvedValueOnce({
      alternateAnswerOptions: [
        { label: "Too expensive", prompt: "I want to avoid options that cost too much." },
        { label: "Too sweet", prompt: "I want to avoid options that are too sweet." },
        { label: "Wrong size", prompt: "I want to avoid the wrong package size." },
        { label: "Not sure", prompt: "I am not sure what I want to avoid." },
      ],
      alternatePrompt: "What would make an option a poor fit?",
      answerOptions: [
        { label: "Kosher certified", prompt: "I need kosher-certified chocolate chips." },
        { label: "Dairy free", prompt: "I need dairy-free chocolate chips." },
        { label: "No allergens", prompt: "I need chocolate chips without common allergens." },
        { label: "No preference", prompt: "I do not have a dietary preference." },
      ],
      prompt: "Do you have a dietary requirement?",
    });
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => {
      result.current.startDiscoverySearch({ queryOverride: "chocolate chips" });
    });
    await waitFor(() => expect(result.current.refinementPrompt).toBeTruthy());

    act(() => {
      result.current.selectRefinementAnswer({
        questionKey: "primary",
        value: "I need kosher-certified chocolate chips.",
      });
    });

    await act(async () => {
      await result.current.finalizeFocusedPicks();
    });

    expect(discoverProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cacheMode: "refresh",
        query: expect.stringContaining("kosher-certified"),
      }),
    );
    expect(finalizeSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        followUpNotes: "I need kosher-certified chocolate chips.",
      }),
    );

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
    await waitFor(() => expect(result.current.refinementPrompt).toBeTruthy());
    act(() => {
      result.current.selectRefinementAnswer({
        questionKey: "primary",
        value: "I will use it every day.",
      });
      result.current.setFollowUpNotes("fits overhead bins");
    });
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
    expect(result.current.followUpNotes).toBe(
      "I will use it every day. fits overhead bins",
    );

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

  it("keeps retry feedback and follow-up notes for the refreshed finalize", async () => {
    getRetryAdvice.mockResolvedValue({
      rationale: "This focuses the next search on more premium options.",
      suggestedQuery: "premium headphones",
    });
    const { result, unmount } = renderHook(() => useMobileSearchController());

    act(() => {
      result.current.startDiscoverySearch({
        initialFollowUpNotes: "Comfort matters most",
        queryOverride: "headphones",
      });
    });
    await waitFor(() => expect(result.current.canFinalize).toBe(true));
    await act(async () => { await result.current.finalizeFocusedPicks(); });

    await act(async () => {
      await result.current.requestRetryAdvice({
        rejectionFeedback: "I want more premium picks",
      });
    });
    await waitFor(() => expect(result.current.canFinalize).toBe(true));

    await act(async () => { await result.current.finalizeFocusedPicks(); });

    expect(finalizeSearch).toHaveBeenLastCalledWith(expect.objectContaining({
      followUpNotes: "Comfort matters most",
      rejectionFeedback: "I want more premium picks",
      retryCount: 1,
    }));

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
