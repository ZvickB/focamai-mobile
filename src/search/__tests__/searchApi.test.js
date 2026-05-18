import {
  coerceDisplayText,
  isSafeQuerySuggestionText,
  normalizeQueryQualitySuggestion,
} from "../searchApi";

describe("coerceDisplayText", () => {
  it("extracts useful strings from nested query-quality objects", () => {
    expect(coerceDisplayText({ query: "white chocolate chips" })).toBe("white chocolate chips");
    expect(coerceDisplayText({ suggestion: { text: "kosher white chocolate chips" } })).toBe(
      "kosher white chocolate chips",
    );
  });

  it("uses the fallback instead of rendering raw objects", () => {
    expect(coerceDisplayText({ unknown: "ignored" }, "your search")).toBe("your search");
  });
});

describe("normalizeQueryQualitySuggestion", () => {
  it("normalizes object-shaped query fields into prompt-safe strings", () => {
    expect(
      normalizeQueryQualitySuggestion(
        {
          confidence: { value: "high" },
          originalQuery: { query: "white chocolate chips" },
          reason: { message: "This spelling is more specific." },
          suggestedQuery: { query: "kosher white chocolate chips" },
        },
        "fallback query",
      ),
    ).toEqual({
      classification: "",
      confidence: "high",
      originalQuery: "white chocolate chips",
      reason: "This spelling is more specific.",
      suggestedQuery: "kosher white chocolate chips",
    });
  });

  it("returns null when there is no usable suggested query", () => {
    expect(normalizeQueryQualitySuggestion({ suggestedQuery: { unknown: "ignored" } })).toBeNull();
  });

  it("hides malformed suggested queries and replaces malformed reasons", () => {
    expect(
      normalizeQueryQualitySuggestion({
        suggestedQuery: "white chocolate chips 漢",
      }),
    ).toBeNull();

    expect(
      normalizeQueryQualitySuggestion(
        {
          originalQuery: "white chocolate chips",
          reason: "strange 漢 message",
          suggestedQuery: "kosher white chocolate chips",
        },
        "white chocolate chips",
      ),
    ).toEqual({
      classification: "",
      confidence: "",
      originalQuery: "white chocolate chips",
      reason: "This may be a clearer way to phrase the search.",
      suggestedQuery: "kosher white chocolate chips",
    });
  });
});

describe("isSafeQuerySuggestionText", () => {
  it("rejects unexpected characters from user-facing suggestion copy", () => {
    expect(isSafeQuerySuggestionText("simple white chocolate chips")).toBe(true);
    expect(isSafeQuerySuggestionText("simple white chocolate chips 漢")).toBe(false);
  });
});
