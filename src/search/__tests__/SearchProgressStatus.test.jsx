import { fireEvent, render } from "@testing-library/react-native";
import { SearchProgressStatus } from "../SearchProgressStatus";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("SearchProgressStatus", () => {
  it("uses calm user-facing copy while finding options", () => {
    const { getByText } = render(
      <SearchProgressStatus
        hasStartedSearch
        isFinalizing={false}
        isGeneratingPrompt={false}
        productQuery="travel stroller"
      />,
    );

    expect(getByText("Finding options")).toBeTruthy();
    expect(getByText("Focamai is looking for useful candidates to narrow down.")).toBeTruthy();
  });

  it("shows shortlist-ready copy while enrichment is still running", () => {
    const { getByText } = render(
      <SearchProgressStatus
        finalResults={[{ id: "candidate-1" }]}
        hasStartedSearch
        isFinalizing={false}
        isGeneratingPrompt={false}
        phaseEvents={[{ id: "1-enrich", phase: "enrich", status: "running" }]}
        productQuery="travel stroller"
      />,
    );

    expect(getByText("Checking details")).toBeTruthy();
    expect(getByText("You can open a pick now; fit notes may continue to fill in.")).toBeTruthy();
  });

  it("rewrites API-base errors while keeping the raw message secondary", () => {
    const rawMessage = "The server returned HTML instead of JSON. Check EXPO_PUBLIC_API_BASE_URL.";
    const { getByLabelText, getByText, queryByText } = render(
      <SearchProgressStatus
        errorMessage={rawMessage}
        hasStartedSearch
        isFinalizing={false}
        isGeneratingPrompt={false}
        productQuery="travel stroller"
      />,
    );

    expect(getByText("Search needs attention")).toBeTruthy();
    expect(
      getByText("The app is not reaching the backend API yet. Check the API base URL, then restart Expo."),
    ).toBeTruthy();
    expect(queryByText(`Raw message: ${rawMessage}`)).toBeNull();

    fireEvent.press(getByLabelText("Show search diagnostics"));

    expect(getByText(`Raw message: ${rawMessage}`)).toBeTruthy();
  });
});
