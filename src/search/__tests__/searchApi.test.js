import {
  coerceDisplayText,
  isSafeQuerySuggestionText,
  normalizeFinalResults,
  normalizeQueryQualitySuggestion,
  normalizeRefinementSuggestions,
  normalizeRetryAdvice,
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

describe("normalizeRefinementSuggestions", () => {
  it("normalizes short string suggestions into label objects and caps at 3", () => {
    expect(
      normalizeRefinementSuggestions({
        refinementSuggestions: [
          "  Easy   cleaning ",
          "Quiet operation",
          "Small batches",
          "Extra valid",
        ],
      }),
    ).toEqual([
      { label: "Easy cleaning" },
      { label: "Quiet operation" },
      { label: "Small batches" },
    ]);
  });

  it("passes through object chips with prompt and drops malformed or overlong entries", () => {
    expect(
      normalizeRefinementSuggestions({
        refinement_suggestions: [
          "Easy cleaning",
          "",
          "This label is much too long for a chip",
          { label: "Quiet operation", prompt: "I need something that runs quietly" },
          123,
          "Small space",
        ],
      }),
    ).toEqual([
      { label: "Easy cleaning" },
      { label: "Quiet operation", prompt: "I need something that runs quietly" },
      { label: "Small space" },
    ]);
  });

  it("returns an empty array when suggestions are missing", () => {
    expect(normalizeRefinementSuggestions({ prompt: "What matters most?" })).toEqual([]);
  });
});

describe("normalizeRetryAdvice", () => {
  it("clamps suggested retry queries to the discovery query limit", () => {
    const advice = normalizeRetryAdvice({
      rationale: { message: "This is more specific." },
      suggestedQuery: `compact city stroller ${"with lightweight fold and under $200 ".repeat(4)}`,
    });

    expect(advice.suggestedQuery.length).toBeLessThanOrEqual(80);
    expect(advice.suggestedQuery).toMatch(/^compact city stroller/);
    expect(advice.rationale).toBe("This is more specific.");
  });

  it("drops malformed retry query suggestions", () => {
    expect(
      normalizeRetryAdvice({
        rationale: "This is more specific.",
        suggestedQuery: "kosher white chocolate chips 漢",
      }),
    ).toMatchObject({
      rationale: "This is more specific.",
      suggestedQuery: "",
    });
  });
});

describe("isSafeQuerySuggestionText", () => {
  it("rejects unexpected characters from user-facing suggestion copy", () => {
    expect(isSafeQuerySuggestionText("simple white chocolate chips")).toBe(true);
    expect(isSafeQuerySuggestionText("simple white chocolate chips 漢")).toBe(false);
  });
});

describe("normalizeFinalResults", () => {
  it("keeps stable backend candidate IDs when present", () => {
    expect(
      normalizeFinalResults(
        [
          {
            candidate_id: "candidate-123",
            title: "Known Product",
          },
        ],
        null,
        "search-1-token",
      )[0].id,
    ).toBe("candidate-123");
  });

  it("scopes fallback IDs to the active search identity", () => {
    const malformedResults = [
      {
        title: "Untitled fallback pick",
      },
    ];

    expect(normalizeFinalResults(malformedResults, null, "search 1/token")[0].id).toBe(
      "final-search-1-token-0",
    );
    expect(normalizeFinalResults(malformedResults, null, "search 2/token")[0].id).toBe(
      "final-search-2-token-0",
    );
  });
});
