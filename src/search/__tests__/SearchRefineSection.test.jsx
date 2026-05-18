import { fireEvent, render } from "@testing-library/react-native";
import { SearchRefineSection } from "../SearchRefineSection";

const refinementPrompt = {
  followUpPlaceholder: "Budget, must-haves, or dealbreakers",
  helperText: "A short answer is enough.",
  prompt: "What matters most for this purchase?",
};

function renderRefineSection(props = {}) {
  return render(
    <SearchRefineSection
      canFinalize
      finalizeFocusedPicks={jest.fn()}
      followUpNotes=""
      isFinalizing={false}
      isGeneratingPrompt={false}
      refinementPrompt={refinementPrompt}
      setFollowUpNotes={jest.fn()}
      skipFocusedPicks={jest.fn()}
      {...props}
    />,
  );
}

describe("SearchRefineSection", () => {
  it("renders one optional question with primary and skip actions", () => {
    const finalizeFocusedPicks = jest.fn();
    const setFollowUpNotes = jest.fn();
    const skipFocusedPicks = jest.fn();
    const { getByPlaceholderText, getByTestId, getByText } = renderRefineSection({
      finalizeFocusedPicks,
      setFollowUpNotes,
      skipFocusedPicks,
    });

    fireEvent.changeText(getByPlaceholderText("Budget, must-haves, or dealbreakers"), "under $200");
    fireEvent.press(getByTestId("followup.showFocusedPicksButton"));
    fireEvent.press(getByTestId("followup.skipButton"));

    expect(getByText("Focamai asks")).toBeTruthy();
    expect(getByText("What matters most for this purchase?")).toBeTruthy();
    expect(getByText("Get focused picks")).toBeTruthy();
    expect(getByText("Skip and show results")).toBeTruthy();
    expect(setFollowUpNotes).toHaveBeenCalledWith("under $200");
    expect(finalizeFocusedPicks).toHaveBeenCalledTimes(1);
    expect(skipFocusedPicks).toHaveBeenCalledTimes(1);
  });

  it("keeps the follow-up step readable while the prompt is loading", () => {
    const { getByText } = renderRefineSection({
      isGeneratingPrompt: true,
      refinementPrompt: null,
    });

    expect(getByText("Getting the question ready")).toBeTruthy();
    expect(getByText("Skip and show results")).toBeTruthy();
  });
});
