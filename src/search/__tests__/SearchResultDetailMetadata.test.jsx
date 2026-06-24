import { render } from "@testing-library/react-native";
import {
  detailValue,
  formatRating,
  formatReviews,
  SearchResultDetailHero,
  SearchResultDetailMetadata,
  SearchResultFeatureHighlights,
} from "../SearchResultDetailMetadata";

const baseItem = {
  caveat: "",
  feature_bullets: [],
  fit_reason: "",
  id: "candidate-1",
  price: "$199",
  provider: "Amazon",
  rating: 4.4,
  reviewCount: 128,
  title: "Compact Travel Stroller",
};

describe("detailValue", () => {
  it("returns the value for valid primitives", () => {
    expect(detailValue("hello", "fallback")).toBe("hello");
    expect(detailValue(42, "fallback")).toBe("42");
    expect(detailValue(0, "fallback")).toBe("0");
    expect(detailValue(false, "fallback")).toBe("false");
  });

  it("returns the fallback for null, undefined, empty string, objects, and functions", () => {
    expect(detailValue(null, "fallback")).toBe("fallback");
    expect(detailValue(undefined, "fallback")).toBe("fallback");
    expect(detailValue("", "fallback")).toBe("fallback");
    expect(detailValue({ text: "x" }, "fallback")).toBe("fallback");
    expect(detailValue(() => {}, "fallback")).toBe("fallback");
  });
});

describe("formatRating", () => {
  it("formats numeric ratings to one decimal place", () => {
    expect(formatRating(4.4)).toBe("4.4");
    expect(formatRating(5)).toBe("5.0");
    expect(formatRating(3.75)).toBe("3.8");
  });

  it("returns 'Rating not shown' for missing or invalid values", () => {
    expect(formatRating(null)).toBe("Rating not shown");
    expect(formatRating(undefined)).toBe("Rating not shown");
    expect(formatRating("")).toBe("Rating not shown");
    expect(formatRating(true)).toBe("Rating not shown");
    expect(formatRating("not a number")).toBe("Rating not shown");
  });

  it("handles string numbers", () => {
    expect(formatRating("4.5")).toBe("4.5");
  });
});

describe("formatReviews", () => {
  it("formats numeric review counts", () => {
    expect(formatReviews(128)).toBe("128 reviews");
    expect(formatReviews(0)).toBe("0 reviews");
  });

  it("passes through string review counts", () => {
    expect(formatReviews("1,234")).toBe("1,234 reviews");
    expect(formatReviews("128")).toBe("128 reviews");
  });

  it("returns 'Reviews not shown' for missing or invalid values", () => {
    expect(formatReviews(null)).toBe("Reviews not shown");
    expect(formatReviews(undefined)).toBe("Reviews not shown");
    expect(formatReviews("")).toBe("Reviews not shown");
    expect(formatReviews("   ")).toBe("Reviews not shown");
  });
});

describe("SearchResultDetailMetadata", () => {
  it("shows in-progress enrichment copy when detail notes are still running", () => {
    const { getByText } = render(
      <SearchResultDetailMetadata enrichmentStatus="running" item={baseItem} />,
    );

    expect(getByText("Why this pick")).toBeTruthy();
    expect(
      getByText(
        "Focamai is still checking for a clearer fit reason. For now, use the product facts and retailer listing to judge whether it matches your needs.",
      ),
    ).toBeTruthy();
    expect(
      getByText(
        "Extra analysis is still running. These notes can fill in without changing the shortlist order.",
      ),
    ).toBeTruthy();
  });

  it("does not imply pending enrichment after enrichment has settled without detail notes", () => {
    const { getByText, queryByText } = render(
      <SearchResultDetailMetadata enrichmentStatus="complete" item={baseItem} />,
    );

    expect(
      getByText(
        "Extra analysis did not return a specific fit reason for this pick. Use the product facts and retailer listing to decide whether it matches your needs.",
      ),
    ).toBeTruthy();
    expect(
      getByText(
        "Extra analysis finished, but some notes are limited for this pick. The shortlist order has not changed.",
      ),
    ).toBeTruthy();
    expect(queryByText(/may still be adding/i)).toBeNull();
  });
});

describe("SearchResultDetailHero", () => {
  it("treats missing rating and reviews as unavailable instead of zero", () => {
    const { getByText, queryByText } = render(
      <SearchResultDetailHero
        item={{
          ...baseItem,
          rating: null,
          reviewCount: null,
        }}
        rank={1}
      />,
    );

    expect(getByText("Rating not shown - Reviews not shown")).toBeTruthy();
    expect(queryByText(/0\.0/)).toBeNull();
  });

  it("does not render object-shaped review counts", () => {
    const { getAllByText, queryByText } = render(
      <SearchResultDetailHero
        item={{
          ...baseItem,
          reviewCount: { total: 128 },
        }}
        rank={1}
      />,
    );

    expect(getAllByText("Reviews not shown").length).toBeGreaterThan(0);
    expect(queryByText(/\[object Object\]/)).toBeNull();
  });
});

describe("SearchResultFeatureHighlights", () => {
  it("uses settled fallback copy when feature notes are unavailable after enrichment", () => {
    const { getByText } = render(
      <SearchResultFeatureHighlights enrichmentStatus="complete" item={baseItem} />,
    );

    expect(
      getByText(
        "Extra analysis did not return feature notes for this pick. Confirm the latest specs, sizing, and included parts on the retailer page before buying.",
      ),
    ).toBeTruthy();
  });
});
