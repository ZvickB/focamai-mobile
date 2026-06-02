import { fireEvent, render } from "@testing-library/react-native";
import {
  MAX_FOLLOW_UP_NOTES_LENGTH,
  SearchRefineSection,
  arrangeRefinementChipsForLayout,
} from "../SearchRefineSection";

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
        { label: "Good for small kitchens maybe" },
        { label: "Small batches" },
      ],
    });

    expect(getByText("Easy cleaning")).toBeTruthy();
    expect(getByText("Good for small kitchens maybe")).toBeTruthy();
    expect(getByText("Small batches")).toBeTruthy();
    expect(queryByText("Good value")).toBeNull();
  });

  it("moves the longest long chip after the shorter chips on narrow screens", () => {
    expect(
      arrangeRefinementChipsForLayout([
        { label: "Good for small kitchens maybe" },
        { label: "Easy cleaning" },
        { label: "Small batches" },
      ]),
    ).toEqual([
      { label: "Easy cleaning" },
      { label: "Small batches" },
      { label: "Good for small kitchens maybe", isWide: true },
    ]);
  });

  it("keeps long chips in their original order on screens wide enough for 3 columns", () => {
    expect(
      arrangeRefinementChipsForLayout(
        [
          { label: "Good for small kitchens maybe" },
          { label: "Easy cleaning" },
          { label: "Small batches" },
        ],
        { canFitLongThreeColumn: true },
      ),
    ).toEqual([
      { label: "Good for small kitchens maybe" },
      { label: "Easy cleaning" },
      { label: "Small batches" },
    ]);
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

  it("allows long AI chip prompts up to the refine note limit", () => {
    const setFollowUpNotes = jest.fn();
    const longPrompt = `I need this to be kosher certified and clearly labeled for a dairy-free kitchen. ${"x".repeat(120)}`;
    const { getByTestId } = renderRefineSection({
      setFollowUpNotes,
      suggestedRefinements: [{ label: "Dietary fit", prompt: longPrompt }],
    });

    fireEvent.press(getByTestId("followup.refinementChip.Dietary fit"));

    expect(setFollowUpNotes).toHaveBeenCalledWith(longPrompt);
  });

  it("clamps chip prompts above 500 characters", () => {
    const setFollowUpNotes = jest.fn();
    const oversizedPrompt = `I need a very specific fit. ${"x".repeat(600)}`;
    const { getByTestId } = renderRefineSection({
      setFollowUpNotes,
      suggestedRefinements: [{ label: "Specific fit", prompt: oversizedPrompt }],
    });

    fireEvent.press(getByTestId("followup.refinementChip.Specific fit"));

    expect(setFollowUpNotes).toHaveBeenCalledWith(
      oversizedPrompt.slice(0, MAX_FOLLOW_UP_NOTES_LENGTH),
    );
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

  it("does not apply the search query limit to refine notes", () => {
    const { queryByTestId } = renderRefineSection({
      followUpNotes: "x".repeat(MAX_FOLLOW_UP_NOTES_LENGTH),
    });

    expect(queryByTestId("followup.notesInlineMessage")).toBeNull();
  });
});
