import { fireEvent, render } from "@testing-library/react-native";
import {
  MAX_FOLLOW_UP_NOTES_LENGTH,
  SearchRefineSection,
} from "../SearchRefineSection";

const refinementPrompt = {
  alternateAnswerOptions: [
    { label: "Under $150", prompt: "I want to stay under $150." },
    { label: "$150–$350", prompt: "My budget is between $150 and $350." },
    { label: "Above $350", prompt: "I can spend more than $350." },
    { label: "No preference", prompt: "I do not have a budget preference." },
  ],
  alternatePrompt: "What is your target budget?",
  answerOptions: [
    { label: "Every workday", prompt: "I will use it every workday." },
    { label: "A few times weekly", prompt: "I will use it a few times each week." },
    { label: "Occasionally", prompt: "I will use it occasionally." },
    { label: "Not sure", prompt: "I am not sure how often I will use it." },
  ],
  followUpPlaceholder: "Budget, must-haves, or dealbreakers",
  helperText: "",
  prompt: "How often will you use it?",
};

function createProps(overrides = {}) {
  return {
    activeQuestionKey: "primary",
    followUpNotes: "",
    isGeneratingPrompt: false,
    onSelectAnswer: jest.fn(),
    onShowAlternateQuestion: jest.fn(),
    refinementPrompt,
    selectedAnswer: { questionKey: "", value: "" },
    setFollowUpNotes: jest.fn(),
    ...overrides,
  };
}

describe("SearchRefineSection", () => {
  it("renders one question, four complete answers, and a separate optional notes input", () => {
    const props = createProps();
    const { getByPlaceholderText, getByText } = render(<SearchRefineSection {...props} />);

    expect(getByText("One quick question")).toBeTruthy();
    expect(getByText("How often will you use it?")).toBeTruthy();
    expect(getByText("Every workday")).toBeTruthy();
    expect(getByText("A few times weekly")).toBeTruthy();
    expect(getByText("Occasionally")).toBeTruthy();
    expect(getByText("Not sure")).toBeTruthy();
    expect(getByText("Anything else?")).toBeTruthy();
    expect(getByText("Optional")).toBeTruthy();

    fireEvent.changeText(
      getByPlaceholderText("Budget, must-haves, or dealbreakers"),
      "under $200",
    );

    expect(props.setFollowUpNotes).toHaveBeenCalledWith("under $200");
  });

  it("selects one prepared answer without writing it into the notes field", () => {
    const props = createProps({ followUpNotes: "breathable fabric" });
    const { getByTestId } = render(<SearchRefineSection {...props} />);

    fireEvent.press(getByTestId("followup.refinementAnswer.Every workday"));

    expect(props.onSelectAnswer).toHaveBeenCalledWith({
      questionKey: "primary",
      value: "I will use it every workday.",
    });
    expect(props.setFollowUpNotes).not.toHaveBeenCalled();
    expect(getByTestId("followup.notesInput").props.value).toBe("breathable fabric");
  });

  it("exposes radio checked state and lets the selected answer be cleared", () => {
    const props = createProps({
      selectedAnswer: {
        questionKey: "primary",
        value: "I will use it every workday.",
      },
    });
    const { getByTestId } = render(<SearchRefineSection {...props} />);
    const selectedAnswer = getByTestId("followup.refinementAnswer.Every workday");

    expect(selectedAnswer.props.accessibilityState).toEqual({ checked: true });
    fireEvent.press(selectedAnswer);
    expect(props.onSelectAnswer).toHaveBeenCalledWith({ questionKey: "", value: "" });
  });

  it("switches to the alternate question's answers while preserving notes", () => {
    const props = createProps({ followUpNotes: "breathable fabric" });
    const view = render(<SearchRefineSection {...props} />);

    fireEvent.press(view.getByTestId("followup.differentQuestionButton"));
    expect(props.onShowAlternateQuestion).toHaveBeenCalledTimes(1);

    view.rerender(
      <SearchRefineSection
        {...props}
        activeQuestionKey="alternate"
        selectedAnswer={{ questionKey: "", value: "" }}
      />,
    );

    expect(view.getByText("What is your target budget?")).toBeTruthy();
    expect(view.getByText("Under $150")).toBeTruthy();
    expect(view.getByText("$150–$350")).toBeTruthy();
    expect(view.queryByText("Every workday")).toBeNull();
    expect(view.getByTestId("followup.notesInput").props.value).toBe("breathable fabric");
    expect(view.queryByTestId("followup.differentQuestionButton")).toBeNull();
  });

  it("notifies the screen when the notes input is focused", () => {
    const onNotesFocus = jest.fn();
    const { getByTestId } = render(
      <SearchRefineSection {...createProps({ onNotesFocus })} />,
    );

    fireEvent(getByTestId("followup.notesInput"), "focus");
    expect(onNotesFocus).toHaveBeenCalledTimes(1);
  });

  it("shows four answer placeholders while the prompt is loading", () => {
    const { getByTestId, getByText } = render(
      <SearchRefineSection
        {...createProps({ isGeneratingPrompt: true, refinementPrompt: null })}
      />,
    );

    expect(getByText("Finding the most useful thing to ask…")).toBeTruthy();
    expect(getByTestId("followup.answerPlaceholders").children).toHaveLength(4);
  });

  it("clamps optional notes to the 500-character refinement limit", () => {
    const props = createProps();
    const { getByTestId } = render(<SearchRefineSection {...props} />);

    fireEvent.changeText(getByTestId("followup.notesInput"), "x".repeat(600));

    expect(props.setFollowUpNotes).toHaveBeenCalledWith(
      "x".repeat(MAX_FOLLOW_UP_NOTES_LENGTH),
    );
  });
});
