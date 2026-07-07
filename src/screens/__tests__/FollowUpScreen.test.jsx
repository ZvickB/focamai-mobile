import { fireEvent, render, waitFor } from "@testing-library/react-native";
import FollowUpScreen from "../FollowUpScreen";
import { useSearchFlow } from "../../search/SearchFlowContext";

jest.mock("../../search/SearchFlowContext", () => ({
  useSearchFlow: jest.fn(),
}));

function buildSearchFlow(overrides = {}) {
  return {
    canFinalize: true,
    errorMessage: "",
    finalResults: [],
    finalizeFocusedPicks: jest.fn().mockResolvedValue(true),
    followUpNotes: "",
    hasStartedSearch: true,
    isFinalizing: false,
    isGeneratingPrompt: false,
    productQuery: "travel stroller",
    refinementPrompt: {
      suggestedRefinements: [],
    },
    setFollowUpNotes: jest.fn(),
    ...overrides,
  };
}

function renderFollowUp(searchFlowOverrides = {}) {
  const navigation = {
    navigate: jest.fn(),
  };
  const searchFlow = buildSearchFlow(searchFlowOverrides);

  useSearchFlow.mockReturnValue(searchFlow);

  return {
    navigation,
    searchFlow,
    ...render(<FollowUpScreen navigation={navigation} />),
  };
}

describe("FollowUpScreen", () => {
  beforeEach(() => {
    useSearchFlow.mockReset();
  });

  it("stays on refine and shows recovery copy when finalize fails", async () => {
    const finalizeFocusedPicks = jest.fn().mockResolvedValue(false);
    const { getByTestId, getByText, navigation } = renderFollowUp({
      errorMessage: "Finalize request failed.",
      finalizeFocusedPicks,
    });

    expect(getByTestId("followup.recoveryPanel")).toBeTruthy();
    expect(getByText("Focamai could not finish the shortlist")).toBeTruthy();

    fireEvent.press(getByTestId("followup.showFocusedPicksButton"));

    await waitFor(() => {
      expect(finalizeFocusedPicks).toHaveBeenCalled();
    });
    expect(navigation.navigate).not.toHaveBeenCalledWith("Results");
  });

  it("opens results only after finalize reports success", async () => {
    const finalizeFocusedPicks = jest.fn().mockResolvedValue(true);
    const { getByTestId, navigation } = renderFollowUp({
      finalizeFocusedPicks,
    });

    fireEvent.press(getByTestId("followup.showFocusedPicksButton"));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith("Results");
    });
  });

  it("replaces skip with a return to existing picks", () => {
    const finalizeFocusedPicks = jest.fn();
    const { getByTestId, getByText, navigation } = renderFollowUp({
      finalResults: [{ id: "pick-1" }, { id: "pick-2" }],
      finalizeFocusedPicks,
    });

    expect(getByText("Return to picks")).toBeTruthy();
    fireEvent.press(getByTestId("followup.skipButton"));

    expect(navigation.navigate).toHaveBeenCalledWith("Results");
    expect(finalizeFocusedPicks).not.toHaveBeenCalled();
  });

  it("can return to loaded picks even when finalize is unavailable", () => {
    const { getByTestId, navigation } = renderFollowUp({
      canFinalize: false,
      finalResults: [{ id: "pick-1" }],
    });

    fireEvent.press(getByTestId("followup.skipButton"));

    expect(navigation.navigate).toHaveBeenCalledWith("Results");
  });

  it("keeps the refine layout keyboard-aware", () => {
    const { getByTestId } = renderFollowUp();

    expect(getByTestId("followup.keyboardAvoidingView")).toBeTruthy();
    expect(getByTestId("followup.showFocusedPicksButton")).toBeTruthy();
  });

  it("shows the finalize loading state while waiting for focused picks", () => {
    const { getByTestId, getByText, queryByTestId } = renderFollowUp({
      isFinalizing: true,
    });

    expect(getByTestId("finalizeLoading.state")).toBeTruthy();
    expect(getByText("We're on it. Your results will be here soon.")).toBeTruthy();
    expect(queryByTestId("followup.showFocusedPicksButton")).toBeNull();
  });

  it("allows refine notes above the search query limit to finalize", async () => {
    const finalizeFocusedPicks = jest.fn().mockResolvedValue(true);
    const { getByTestId, navigation, queryByTestId } = renderFollowUp({
      finalizeFocusedPicks,
      followUpNotes: "x".repeat(500),
    });

    expect(queryByTestId("followup.notesInlineMessage")).toBeNull();

    fireEvent.press(getByTestId("followup.showFocusedPicksButton"));

    await waitFor(() => {
      expect(finalizeFocusedPicks).toHaveBeenCalled();
    });
    expect(navigation.navigate).toHaveBeenCalledWith("Results");
  });

  it("sends the user back to search when recovery cannot finalize yet", () => {
    const finalizeFocusedPicks = jest.fn();
    const { getByText, navigation } = renderFollowUp({
      canFinalize: false,
      errorMessage: "Discovery request failed.",
      finalizeFocusedPicks,
    });

    expect(getByText("Focamai could not start this search")).toBeTruthy();

    fireEvent.press(getByText("Back to search"));

    expect(finalizeFocusedPicks).not.toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith("Search");
  });
});
