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
  it("asks for a better search direction from quiet correction chips", () => {
    const requestRetryAdvice = jest.fn();
    const { getByText } = renderRetrySection({ requestRetryAdvice });

    fireEvent.press(getByText("Too expensive"));
    fireEvent.press(getByText("Suggest a better search"));

    expect(getByText("Want to correct the direction?")).toBeTruthy();
    expect(requestRetryAdvice).toHaveBeenCalledWith({
      rejectionFeedback: "Correction type: Too expensive",
    });
  });

  it("shows advice first and lets the user edit the suggested search", () => {
    const applyRetrySuggestion = jest.fn(() => true);
    const { getByPlaceholderText, getByText } = renderRetrySection({
      applyRetrySuggestion,
      retryAdvice: {
        rationale: "The current picks skew too bulky.",
        suggestedQuery: "lightweight travel stroller under $200",
      },
      retryFeedback: "avoid bulky options",
    });

    expect(getByText("Suggested next search")).toBeTruthy();
    expect(getByText("lightweight travel stroller under $200")).toBeTruthy();

    fireEvent.press(getByText("Edit first"));
    fireEvent.changeText(getByPlaceholderText("Edit the suggested search"), "compact stroller under $150");
    fireEvent.press(getByText("Search this suggestion"));

    expect(applyRetrySuggestion).toHaveBeenCalledWith("compact stroller under $150");
  });
});
