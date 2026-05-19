import { fireEvent, render } from "@testing-library/react-native";
import { QuerySuggestionPrompt } from "../QuerySuggestionPrompt";

describe("QuerySuggestionPrompt", () => {
  it("renders object-shaped suggestion fields as readable text", () => {
    const onKeepResults = jest.fn();
    const onTrySuggestedSearch = jest.fn();
    const { getByText, queryByText } = render(
      <QuerySuggestionPrompt
        onKeepResults={onKeepResults}
        onTrySuggestedSearch={onTrySuggestedSearch}
        suggestion={{
          originalQuery: { query: "white chocolate chips" },
          reason: { message: "This version is more specific." },
          suggestedQuery: { query: "kosher white chocolate chips" },
        }}
      />,
    );

    expect(getByText('We searched for "white chocolate chips".')).toBeTruthy();
    expect(getByText('Try "kosher white chocolate chips" instead?')).toBeTruthy();
    expect(getByText("This version is more specific.")).toBeTruthy();
    expect(queryByText(/object Object/)).toBeNull();

    fireEvent.press(getByText("Try suggested search"));
    fireEvent.press(getByText("Keep these results"));

    expect(onTrySuggestedSearch).toHaveBeenCalledTimes(1);
    expect(onKeepResults).toHaveBeenCalledTimes(1);
  });

  it("uses calm fallback copy when the reason contains unexpected characters", () => {
    const { getByText, queryByText } = render(
      <QuerySuggestionPrompt
        isApplying={false}
        onKeepResults={jest.fn()}
        onTrySuggestedSearch={jest.fn()}
        suggestion={{
          originalQuery: "white chocolate chips",
          reason: "strange 漢 message",
          suggestedQuery: "kosher white chocolate chips",
        }}
      />,
    );

    expect(getByText("This may be a clearer way to phrase the search.")).toBeTruthy();
    expect(queryByText(/strange/)).toBeNull();
  });

  it("hides the prompt when the suggested query contains unexpected characters", () => {
    const { queryByText } = render(
      <QuerySuggestionPrompt
        isApplying={false}
        onKeepResults={jest.fn()}
        onTrySuggestedSearch={jest.fn()}
        suggestion={{
          originalQuery: "white chocolate chips",
          reason: "Try this.",
          suggestedQuery: "kosher white chocolate chips 漢",
        }}
      />,
    );

    expect(queryByText("Suggested search tweak")).toBeNull();
  });
});
