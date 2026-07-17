import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { ScrollView } from "react-native";
import ResultsScreen from "../ResultsScreen";
import { useSearchFlow } from "../../search/SearchFlowContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("../../search/SearchFlowContext", () => ({
  useSearchFlow: jest.fn(),
}));

const firstPick = {
  caveat: "",
  feature_bullets: ["Compact fold"],
  fit_reason: "Matches the travel-focused request.",
  id: "candidate-1",
  image: "",
  link: "",
  price: "$199",
  provider: "Amazon",
  rating: 4.4,
  reviewCount: 128,
  title: "First travel stroller",
};

const secondPick = {
  ...firstPick,
  fit_reason: "Better if storage space matters most.",
  id: "candidate-2",
  price: "$229",
  title: "Second compact stroller",
};

function buildSearchFlow(overrides = {}) {
  return {
    candidateRecovery: null,
    canRequestRetryAdvice: true,
    discoverySummary: null,
    errorMessage: "",
    finalResults: [firstPick, secondPick],
    findBetterMatches: jest.fn(),
    followUpNotes: "",
    isFinalizing: false,
    isGeneratingPrompt: false,
    isGeneratingRetryAdvice: false,
    keepCandidateRecovery: jest.fn(),
    phaseEvents: [],
    previewItems: [],
    productQuery: "travel stroller",
    refinementPrompt: null,
    requestRetryAdvice: jest.fn(),
    retryAdviceError: "",
    retryFeedback: "",
    setRetryFeedback: jest.fn(),
    ...overrides,
  };
}

function renderResults(searchFlowOverrides = {}) {
  const navigation = {
    navigate: jest.fn(),
  };
  const searchFlow = buildSearchFlow(searchFlowOverrides);

  useSearchFlow.mockReturnValue(searchFlow);

  return {
    navigation,
    searchFlow,
    ...render(<ResultsScreen navigation={navigation} />),
  };
}

describe("ResultsScreen", () => {
  beforeEach(() => {
    useSearchFlow.mockReset();
  });

  it("updates the selected result as the focused rows scroll", () => {
    const { getByLabelText, getByTestId, UNSAFE_getByType } = renderResults();

    expect(getByLabelText("Selected result. Open result: First travel stroller")).toBeTruthy();

    fireEvent(getByTestId("results.section"), "layout", {
      nativeEvent: { layout: { height: 200, y: 100 } },
    });
    fireEvent(getByTestId("results.focusedPicks"), "layout", {
      nativeEvent: { layout: { height: 180, y: 20 } },
    });
    fireEvent(getByTestId("results.focusedPickRow.1"), "layout", {
      nativeEvent: { layout: { height: 90, y: 0 } },
    });
    fireEvent(getByTestId("results.focusedPickRow.2"), "layout", {
      nativeEvent: { layout: { height: 90, y: 100 } },
    });

    fireEvent.scroll(UNSAFE_getByType(ScrollView), {
      nativeEvent: {
        contentOffset: { y: 225 },
      },
    });

    expect(getByLabelText("Selected result. Open result: Second compact stroller")).toBeTruthy();

    fireEvent.scroll(UNSAFE_getByType(ScrollView), {
      nativeEvent: {
        contentOffset: { y: 199 },
      },
    });

    expect(getByLabelText("Selected result. Open result: First travel stroller")).toBeTruthy();
  });

  it("keeps retry controls inside a keyboard-aware layout", () => {
    const { getByTestId, getByText } = renderResults();

    expect(getByTestId("results.keyboardAvoidingView")).toBeTruthy();
    expect(getByText("Improve these picks")).toBeTruthy();
  });

  it("starts an updated search as a fresh refine flow", async () => {
    const requestRetryAdvice = jest.fn().mockResolvedValue(true);
    const { getByLabelText, getByText, navigation } = renderResults({
      requestRetryAdvice,
      retryFeedback: "avoid bulky options",
    });

    fireEvent.press(getByLabelText("Show correction options"));
    await act(async () => {
      fireEvent.press(getByText("Update my picks"));
    });

    expect(requestRetryAdvice).toHaveBeenCalledWith({
      rejectionFeedback: "avoid bulky options",
    });
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith("RetryUpdating"));
  });

  it("offers the suggested recovery search directly below a partial shortlist", () => {
    const findBetterMatches = jest.fn(() => true);
    const { getByTestId, getByText, navigation } = renderResults({
      candidateRecovery: {
        goodCandidateCount: 2,
        suggestedQuery: "lightweight travel stroller under $250",
      },
      findBetterMatches,
    });

    expect(getByTestId("candidateRecovery.section")).toBeTruthy();
    expect(getByText("These are the strongest matches we found.")).toBeTruthy();
    expect(getByText("lightweight travel stroller under $250")).toBeTruthy();

    fireEvent.press(getByTestId("candidateRecovery.findBetterMatches"));

    expect(findBetterMatches).toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith("RetryUpdating");
  });
});
