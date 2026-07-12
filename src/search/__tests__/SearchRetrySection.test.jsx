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
      canRequestRetryAdvice
      finalResults={finalResults}
      isGeneratingRetryAdvice={false}
      onUpdatePicks={jest.fn()}
      retryAdviceError=""
      retryFeedback=""
      setRetryFeedback={jest.fn()}
      {...props}
    />,
  );
}

describe("SearchRetrySection", () => {
  it("asks AI for a better search direction from the user's correction note", () => {
    const onUpdatePicks = jest.fn();
    const { getByLabelText, getByText, queryByText } = renderRetrySection({
      onUpdatePicks,
      retryFeedback: "avoid bulky options",
    });

    expect(getByText("Improve these picks")).toBeTruthy();
    expect(queryByText("Recovery")).toBeNull();
    expect(queryByText("Too expensive")).toBeNull();

    fireEvent.press(getByLabelText("Show correction options"));
    fireEvent.press(getByText("Update my picks"));

    expect(onUpdatePicks).toHaveBeenCalledWith("avoid bulky options");
  });

  it("shows automatic-update progress without a second confirmation", () => {
    const { getByLabelText, getByText, queryByLabelText, queryByText } = renderRetrySection({
      isGeneratingRetryAdvice: true,
      retryFeedback: "avoid bulky options",
    });

    fireEvent.press(getByLabelText("Show correction options"));
    expect(getByText("Updating your picks...")).toBeTruthy();
    expect(getByText(/preparing a better search/i)).toBeTruthy();
    expect(queryByLabelText("Suggested search query")).toBeNull();
    expect(queryByText("Search this suggestion")).toBeNull();
  });
});
