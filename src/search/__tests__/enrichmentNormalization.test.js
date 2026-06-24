jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import {
  normalizeEnrichmentText,
  normalizeEnrichmentBullets,
  mergeEnrichmentIntoResults,
} from "../useMobileSearchController";

describe("normalizeEnrichmentText", () => {
  it("trims plain strings", () => {
    expect(normalizeEnrichmentText("  good value  ")).toBe("good value");
    expect(normalizeEnrichmentText("clean")).toBe("clean");
  });

  it("converts numbers and booleans to strings", () => {
    expect(normalizeEnrichmentText(42)).toBe("42");
    expect(normalizeEnrichmentText(true)).toBe("true");
    expect(normalizeEnrichmentText(0)).toBe("0");
  });

  it("extracts text from nested objects with known keys", () => {
    expect(normalizeEnrichmentText({ text: "nested caveat" })).toBe("nested caveat");
    expect(normalizeEnrichmentText({ value: "nested value" })).toBe("nested value");
    expect(normalizeEnrichmentText({ message: "nested message" })).toBe("nested message");
    expect(normalizeEnrichmentText({ suggestion: "nested suggestion" })).toBe("nested suggestion");
    expect(normalizeEnrichmentText({ query: "nested query" })).toBe("nested query");
  });

  it("uses the first non-empty known key from objects", () => {
    expect(normalizeEnrichmentText({ text: "", value: "fallback value" })).toBe("fallback value");
    expect(normalizeEnrichmentText({ text: "  ", value: "fallback" })).toBe("fallback");
  });

  it("returns empty string for objects with no known keys", () => {
    expect(normalizeEnrichmentText({ unknown: "ignored" })).toBe("");
    expect(normalizeEnrichmentText({ id: 123 })).toBe("");
  });

  it("returns empty string for null, undefined, and arrays", () => {
    expect(normalizeEnrichmentText(null)).toBe("");
    expect(normalizeEnrichmentText(undefined)).toBe("");
    expect(normalizeEnrichmentText(["array"])).toBe("");
    expect(normalizeEnrichmentText("")).toBe("");
  });
});

describe("normalizeEnrichmentBullets", () => {
  it("normalizes string arrays into trimmed non-empty entries", () => {
    expect(normalizeEnrichmentBullets(["  bullet one  ", "bullet two", ""])).toEqual([
      "bullet one",
      "bullet two",
    ]);
  });

  it("extracts text from object-shaped bullet entries", () => {
    expect(
      normalizeEnrichmentBullets([
        { text: "Feature A" },
        { value: "Feature B" },
        "Feature C",
      ]),
    ).toEqual(["Feature A", "Feature B", "Feature C"]);
  });

  it("filters out non-string, non-object entries", () => {
    expect(normalizeEnrichmentBullets([123, null, true, "valid bullet"])).toEqual([
      "123",
      "true",
      "valid bullet",
    ]);
  });

  it("returns empty array for non-array inputs", () => {
    expect(normalizeEnrichmentBullets(null)).toEqual([]);
    expect(normalizeEnrichmentBullets(undefined)).toEqual([]);
    expect(normalizeEnrichmentBullets("not an array")).toEqual([]);
    expect(normalizeEnrichmentBullets({})).toEqual([]);
  });

  it("drops entries that resolve to empty strings", () => {
    expect(normalizeEnrichmentBullets(["", "  ", { text: "" }, { unknown: "x" }])).toEqual([]);
  });
});

describe("mergeEnrichmentIntoResults", () => {
  const baseResults = [
    {
      id: "product-1",
      title: "Widget A",
      caveat: "",
      fit_reason: "",
      feature_bullets: [],
      image: "old-image.jpg",
      link: "old-link",
    },
    {
      id: "product-2",
      title: "Widget B",
      caveat: "existing caveat",
      fit_reason: "existing reason",
      feature_bullets: ["existing bullet"],
      image: "image-b.jpg",
      link: "link-b",
    },
  ];

  it("merges enrichment fields into matching results by candidate_id", () => {
    const entries = [
      {
        candidate_id: "product-1",
        caveat: "Budget-friendly but noisy",
        delivery: "Prime delivery tomorrow",
        fit_reason: "Good for small spaces",
        feature_bullets: ["Compact", "Lightweight"],
        image: "new-image.jpg",
        isPrime: true,
        link: "new-link",
      },
    ];

    const merged = mergeEnrichmentIntoResults(baseResults, entries);

    expect(merged[0]).toMatchObject({
      id: "product-1",
      caveat: "Budget-friendly but noisy",
      delivery: "Prime delivery tomorrow",
      fit_reason: "Good for small spaces",
      feature_bullets: ["Compact", "Lightweight"],
      image: "new-image.jpg",
      isPrime: true,
      link: "new-link",
    });
    // Unmatched result stays unchanged.
    expect(merged[1]).toEqual(baseResults[1]);
  });

  it("preserves existing values when enrichment fields are empty", () => {
    const entries = [
      {
        candidate_id: "product-2",
        caveat: "",
        fit_reason: "",
        feature_bullets: [],
      },
    ];

    const merged = mergeEnrichmentIntoResults(baseResults, entries);

    expect(merged[1].caveat).toBe("existing caveat");
    expect(merged[1].fit_reason).toBe("existing reason");
    expect(merged[1].feature_bullets).toEqual(["existing bullet"]);
  });

  it("does not treat string false enrichment Prime flags as eligible", () => {
    const entries = [
      {
        candidate_id: "product-1",
        is_prime: "false",
      },
    ];

    const merged = mergeEnrichmentIntoResults(baseResults, entries);

    expect(merged[0].isPrime).toBe(false);
  });

  it("handles object-shaped enrichment fields via normalizeEnrichmentText", () => {
    const entries = [
      {
        candidate_id: "product-1",
        caveat: { text: "Object-shaped caveat" },
        fit_reason: { message: "Object-shaped reason" },
        feature_bullets: [{ text: "Object bullet" }],
      },
    ];

    const merged = mergeEnrichmentIntoResults(baseResults, entries);

    expect(merged[0].caveat).toBe("Object-shaped caveat");
    expect(merged[0].fit_reason).toBe("Object-shaped reason");
    expect(merged[0].feature_bullets).toEqual(["Object bullet"]);
  });

  it("returns original results when entries is empty or invalid", () => {
    expect(mergeEnrichmentIntoResults(baseResults, [])).toBe(baseResults);
    expect(mergeEnrichmentIntoResults(baseResults, null)).toBe(baseResults);
    expect(mergeEnrichmentIntoResults(baseResults, undefined)).toBe(baseResults);
  });

  it("returns original results when no entries match any result ID", () => {
    const entries = [
      { candidate_id: "unknown-id", caveat: "should not appear" },
    ];

    const merged = mergeEnrichmentIntoResults(baseResults, entries);

    expect(merged).toEqual(baseResults);
  });

  it("matches on candidateId alias as well as candidate_id", () => {
    const entries = [
      {
        candidateId: "product-1",
        caveat: "Matched via candidateId",
      },
    ];

    const merged = mergeEnrichmentIntoResults(baseResults, entries);

    expect(merged[0].caveat).toBe("Matched via candidateId");
  });
});
