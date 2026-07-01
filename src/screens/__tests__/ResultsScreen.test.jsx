import { fireEvent, render } from "@testing-library/react-native";
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
    applyRetrySuggestion: jest.fn(),
    canRequestRetryAdvice: true,
    discoverySummary: null,
    errorMessage: "",
    finalResults: [firstPick, secondPick],
    followUpNotes: "",
    isFinalizing: false,
    isGeneratingPrompt: false,
    isGeneratingRetryAdvice: false,
    phaseEvents: [],
    previewItems: [],
    productQuery: "travel stroller",
    refinementPrompt: null,
    requestRetryAdvice: jest.fn(),
    retryAdvice: null,
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

  it("starts a retry suggestion as a fresh refine flow", () => {
    const applyRetrySuggestion = jest.fn().mockReturnValue(true);
    const { getByText, navigation } = renderResults({
      applyRetrySuggestion,
      retryAdvice: {
        rationale: "This keeps the travel constraint but narrows the product phrase.",
        suggestedQuery: "compact travel stroller",
      },
    });

    fireEvent.press(getByText("Search this suggestion"));

    expect(applyRetrySuggestion).toHaveBeenCalledWith("compact travel stroller");
    expect(navigation.navigate).toHaveBeenCalledWith("FollowUp");
  });
});
