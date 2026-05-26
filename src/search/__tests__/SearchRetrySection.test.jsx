import { fireEvent, render } from "@testing-library/react-native";
import { SearchRetrySection } from "../SearchRetrySection";

const finalResults = [
  {
    id: "candidate-1",
    title: "Compact Travel Stroller",
  },
];

function renderRetrySection(props = {}) {
  return render(
    <SearchRetrySection
      applyRetrySuggestion={jest.fn()}
      canRequestRetryAdvice
      finalResults={finalResults}
      followUpNotes="easy to fold"
      isGeneratingRetryAdvice={false}
      productQuery="travel stroller"
      requestRetryAdvice={jest.fn()}
      retryAdvice={null}
      retryAdviceError=""
      retryFeedback=""
      setRetryFeedback={jest.fn()}
      {...props}
    />,
  );
}

describe("SearchRetrySection", () => {
  it("asks AI for a better search direction from the user's correction note", () => {
    const requestRetryAdvice = jest.fn();
    const { getByLabelText, getByText, queryByText } = renderRetrySection({
      requestRetryAdvice,
      retryFeedback: "avoid bulky options",
    });

    expect(getByText("Want to correct the direction?")).toBeTruthy();
    expect(queryByText("Recovery")).toBeNull();
    expect(queryByText("Too expensive")).toBeNull();

    fireEvent.press(getByLabelText("Show correction options"));
    fireEvent.press(getByText("Get new search suggestion"));

    expect(requestRetryAdvice).toHaveBeenCalledWith({
      rejectionFeedback: "avoid bulky options",
    });
  });

  it("shows advice as an editable suggested search", () => {
    const applyRetrySuggestion = jest.fn(() => true);
    const { getByLabelText, getByText } = renderRetrySection({
      applyRetrySuggestion,
      retryAdvice: {
        rationale: "The current picks skew too bulky.",
        suggestedQuery: "lightweight travel stroller under $200",
      },
      retryFeedback: "avoid bulky options",
    });

    expect(getByText("Suggested next search")).toBeTruthy();
    expect(getByLabelText("Suggested search query").props.value).toBe(
      "lightweight travel stroller under $200",
    );

    fireEvent.changeText(getByLabelText("Suggested search query"), "compact stroller under $150");
    fireEvent.press(getByText("Search this suggestion"));

    expect(applyRetrySuggestion).toHaveBeenCalledWith("compact stroller under $150");
  });
});
