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
      followUpNotes=""
      isGeneratingPrompt={false}
      refinementPrompt={refinementPrompt}
      setFollowUpNotes={jest.fn()}
      {...props}
    />,
  );
}

describe("SearchRefineSection", () => {
  it("renders the form heading, chips, and text input", () => {
    const setFollowUpNotes = jest.fn();
    const { getByPlaceholderText, getByText } = renderRefineSection({
      setFollowUpNotes,
      productQuery: "ice cream machine",
    });

    fireEvent.changeText(
      getByPlaceholderText("Tell Focamai anything that's important..."),
      "under $200",
    );

    expect(getByText("What should Focamai keep in\u00A0mind?")).toBeTruthy();
    expect(getByText("A few starting points")).toBeTruthy();
    expect(getByText("Good value")).toBeTruthy();
    expect(getByText("Easy to use")).toBeTruthy();
    expect(getByText("Fits my space")).toBeTruthy();
    expect(setFollowUpNotes).toHaveBeenCalledWith("under $200");
  });

  it("adds static refinement chips to the notes without replacing the user's answer", () => {
    const setFollowUpNotes = jest.fn();
    const { getByTestId } = renderRefineSection({
      followUpNotes: "under $200",
      setFollowUpNotes,
    });

    fireEvent.press(getByTestId("followup.refinementChip.Good value"));

    expect(setFollowUpNotes).toHaveBeenCalledWith("under $200, Good value");
  });

  it("renders fallback chips when AI suggestions are missing", () => {
    const { getByText } = renderRefineSection({
      suggestedRefinements: [],
    });

    expect(getByText("Good value")).toBeTruthy();
    expect(getByText("Easy to use")).toBeTruthy();
    expect(getByText("Fits my space")).toBeTruthy();
  });

  it("renders AI refinement chips when suggestions exist", () => {
    const { getByText, queryByText } = renderRefineSection({
      suggestedRefinements: [
        { label: "Easy cleaning" },
        { label: "Quiet operation" },
        { label: "Small batches" },
      ],
    });

    expect(getByText("Easy cleaning")).toBeTruthy();
    expect(getByText("Quiet operation")).toBeTruthy();
    expect(getByText("Small batches")).toBeTruthy();
    expect(queryByText("Good value")).toBeNull();
  });

  it("adds AI refinement chips to the notes", () => {
    const setFollowUpNotes = jest.fn();
    const { getByTestId } = renderRefineSection({
      followUpNotes: "under $200",
      setFollowUpNotes,
      suggestedRefinements: [
        { label: "Easy cleaning" },
        { label: "Quiet operation" },
        { label: "Small batches" },
      ],
    });

    fireEvent.press(getByTestId("followup.refinementChip.Easy cleaning"));

    expect(setFollowUpNotes).toHaveBeenCalledWith("under $200, Easy cleaning");
  });

  it("shows a loading message while prompt details are still generating", () => {
    const { getByText } = renderRefineSection({
      isGeneratingPrompt: true,
      refinementPrompt: null,
    });

    expect(
      getByText("Getting a few ideas ready. You can still refine in your own words."),
    ).toBeTruthy();
  });
});
