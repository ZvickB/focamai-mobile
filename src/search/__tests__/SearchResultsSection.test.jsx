import { fireEvent, render } from "@testing-library/react-native";
import { SearchResultsSection } from "../SearchResultsSection";

const focusedPick = {
  caveat: "Costs a little more than the simplest options.",
  feature_bullets: ["Compact fold"],
  fit_reason: "Matches the travel-focused request.",
  id: "candidate-1",
  image: "",
  link: "",
  price: "$199",
  provider: "Amazon",
  rating: 4.4,
  reviewCount: 128,
  title: "Compact Travel Stroller",
};

describe("SearchResultsSection", () => {
  it("returns no section until preview or focused results exist", () => {
    const { toJSON } = render(
      <SearchResultsSection finalResults={[]} onOpenResult={jest.fn()} previewItems={[]} />,
    );

    expect(toJSON()).toBeNull();
  });

  it("treats malformed result props as empty arrays", () => {
    const { getByText } = render(
      <SearchResultsSection
        finalResults={null}
        onOpenResult={jest.fn()}
        previewItems={{}}
        showEmptyState
      />,
    );

    expect(getByText("No focused picks yet")).toBeTruthy();
  });

  it("shows an intentional empty state on the Results screen", () => {
    const { getByText } = render(
      <SearchResultsSection
        finalResults={[]}
        onOpenResult={jest.fn()}
        previewItems={[]}
        showEmptyState
      />,
    );

    expect(getByText("No focused picks yet")).toBeTruthy();
    expect(
      getByText(
        "If nothing appears after a search finishes, try a more specific product phrase or add a must-have in the follow-up step.",
      ),
    ).toBeTruthy();
  });

  it("renders focused picks and opens a pick by item and index", () => {
    const onOpenResult = jest.fn();
    const { getByTestId, getByText } = render(
      <SearchResultsSection
        finalResults={[focusedPick]}
        onOpenResult={onOpenResult}
        previewItems={[]}
      />,
    );

    fireEvent.press(getByTestId("results.focusedPick.1"));

    expect(getByText("Why these picks?")).toBeTruthy();
    expect(getByText("Compact Travel Stroller")).toBeTruthy();
    expect(onOpenResult).toHaveBeenCalledWith(focusedPick, 0);
  });

  it("uses unavailable copy for missing rating and malformed reviews", () => {
    const { queryByText } = render(
      <SearchResultsSection
        finalResults={[
          {
            ...focusedPick,
            rating: null,
            reviewCount: { total: 128 },
          },
        ]}
        onOpenResult={jest.fn()}
        previewItems={[]}
      />,
    );

    expect(queryByText("0.0 rating")).toBeNull();
    expect(queryByText("Reviews not shown")).toBeNull();
    expect(queryByText(/\[object Object\]/)).toBeNull();
    expect(queryByText(/0\.0 rating/)).toBeNull();
  });

  it("calls out when fewer than six credible options come back", () => {
    const { getByText } = render(
      <SearchResultsSection
        finalResults={[focusedPick]}
        onOpenResult={jest.fn()}
        previewItems={[]}
      />,
    );

    expect(
      getByText(
        "1 credible option came back for this search. That can happen when fewer results look credible for your needs.",
      ),
    ).toBeTruthy();
  });
});
