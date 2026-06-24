import {
  coerceDisplayText,
  isSafeQuerySuggestionText,
  normalizeFinalResults,
  normalizeQueryQualitySuggestion,
  normalizeRefinementSuggestions,
  normalizeRetryAdvice,
} from "../searchApi";

describe("request timeouts", () => {
  const originalFetch = global.fetch;
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    jest.useFakeTimers();
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.example.test";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    jest.resetModules();
    jest.useRealTimers();
  });

  it("fails discovery with calm recovery copy when the request takes too long", async () => {
    jest.resetModules();
    const { discoverProducts } = require("../searchApi");

    global.fetch = jest.fn(
      (_url, options = {}) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );

    const request = discoverProducts({
      amazonDomain: "amazon.com",
      query: "travel stroller",
    });

    jest.advanceTimersByTime(25000);

    await expect(request).rejects.toThrow(
      "This is taking longer than expected. Try again, or adjust the search.",
    );
  });
});

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
          "Good for small kitchens maybe",
          "This label is definitely too long for a chip",
          { label: "Quiet operation", prompt: "I need something that runs quietly" },
          123,
          "Small space",
        ],
      }),
    ).toEqual([
      { label: "Easy cleaning" },
      { label: "Good for small kitchens maybe" },
      { label: "Quiet operation", prompt: "I need something that runs quietly" },
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

  it("preserves delivery and isPrime fields for Prime eligibility", () => {
    const result = normalizeFinalResults(
      [
        {
          candidate_id: "prime-product",
          title: "Prime Widget",
          isPrime: true,
          delivery: "FREE delivery Wed, Jul 2",
        },
      ],
      null,
    )[0];

    expect(result.isPrime).toBe(true);
    expect(result.delivery).toBe("FREE delivery Wed, Jul 2");
  });

  it("normalizes is_prime to isPrime", () => {
    const result = normalizeFinalResults(
      [{ candidate_id: "p1", title: "Widget", is_prime: true }],
      null,
    )[0];

    expect(result.isPrime).toBe(true);
  });

  it("normalizes positive string Prime flags without treating string false as Prime", () => {
    expect(
      normalizeFinalResults(
        [{ candidate_id: "p1", title: "Widget", is_prime: "true" }],
        null,
      )[0].isPrime,
    ).toBe(true);
    expect(
      normalizeFinalResults(
        [{ candidate_id: "p1", title: "Widget", is_prime: "false" }],
        null,
      )[0].isPrime,
    ).toBe(false);
  });

  it("defaults delivery and isPrime when missing", () => {
    const result = normalizeFinalResults(
      [{ candidate_id: "p1", title: "Widget" }],
      null,
    )[0];

    expect(result.isPrime).toBe(false);
    expect(result.delivery).toBe("");
  });

  it("caps results at 6", () => {
    const results = Array.from({ length: 10 }, (_, i) => ({
      candidate_id: `p-${i}`,
      title: `Product ${i}`,
    }));

    expect(normalizeFinalResults(results, null)).toHaveLength(6);
  });

  it("returns empty array for non-array inputs", () => {
    expect(normalizeFinalResults(null, null)).toEqual([]);
    expect(normalizeFinalResults(undefined, null)).toEqual([]);
    expect(normalizeFinalResults("not an array", null)).toEqual([]);
  });

  it("fills default values for missing fields", () => {
    const result = normalizeFinalResults([{}], null)[0];

    expect(result.title).toBe("Untitled product");
    expect(result.price).toBe("Price not shown");
    expect(result.provider).toBe("Unknown source");
    expect(result.caveat).toBe("");
    expect(result.fit_reason).toBe("");
    expect(result.feature_bullets).toEqual([]);
    expect(result.image).toBe("");
    expect(result.link).toBe("");
    expect(result.rating).toBeNull();
    expect(result.reviewCount).toBeNull();
  });

  it("merges candidate pool images and links into results", () => {
    const results = [
      { candidate_id: "c1", title: "Widget", image: "", link: "" },
    ];
    const candidatePool = {
      candidates: [
        { candidate_id: "c1", image: "pool-image.jpg", link: "pool-link" },
      ],
    };

    const merged = normalizeFinalResults(results, candidatePool)[0];

    expect(merged.image).toBe("pool-image.jpg");
    expect(merged.link).toBe("pool-link");
  });
});
