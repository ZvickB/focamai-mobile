import { render, waitFor } from "@testing-library/react-native";
import RetryUpdatingScreen from "../RetryUpdatingScreen";
import { useSearchFlow } from "../../search/SearchFlowContext";

jest.mock("../../search/SearchFlowContext", () => ({
  useSearchFlow: jest.fn(),
}));

function buildSearchFlow(overrides = {}) {
  return {
    canFinalize: true,
    errorMessage: "",
    finalizeFocusedPicks: jest.fn().mockResolvedValue(true),
    isFinalizing: false,
    retrySearchQuery: "lightweight travel stroller",
    ...overrides,
  };
}

function renderRetryUpdating(searchFlowOverrides = {}) {
  const navigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };
  const searchFlow = buildSearchFlow(searchFlowOverrides);

  useSearchFlow.mockReturnValue(searchFlow);

  return {
    navigation,
    searchFlow,
    ...render(<RetryUpdatingScreen navigation={navigation} />),
  };
}

describe("RetryUpdatingScreen", () => {
  beforeEach(() => {
    useSearchFlow.mockReset();
  });

  it("shows the improved query and automatically finalizes updated picks", async () => {
    const finalizeFocusedPicks = jest.fn().mockResolvedValue(true);
    const { getByTestId, getByText, navigation } = renderRetryUpdating({
      finalizeFocusedPicks,
    });

    expect(getByTestId("retryUpdating.screen")).toBeTruthy();
    expect(getByText("lightweight travel stroller")).toBeTruthy();
    expect(getByText("Based on your Improve picks feedback.")).toBeTruthy();
    expect(getByText("Narrowing to 6 updated picks...")).toBeTruthy();

    await waitFor(() => {
      expect(finalizeFocusedPicks).toHaveBeenCalledWith({ followUpNotesOverride: "" });
    });
    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith("Results");
    });
  });

  it("waits for refreshed discovery before finalizing", () => {
    const finalizeFocusedPicks = jest.fn();
    const { getByText } = renderRetryUpdating({
      canFinalize: false,
      finalizeFocusedPicks,
    });

    expect(getByText("lightweight travel stroller")).toBeTruthy();
    expect(getByText("Finding better matches...")).toBeTruthy();
    expect(finalizeFocusedPicks).not.toHaveBeenCalled();
  });
});
