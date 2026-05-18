const HARD_CONSTRAINT_PATTERNS = [
  {
    category: "jewish_kosher",
    terms: [
      "kosher",
      "kosher certified",
      "hechsher",
      "hechser",
      "pareve",
      "parve",
      "cholov yisroel",
      "chalav yisrael",
      "cholov israel",
      "pas yisroel",
      "pat yisrael",
      "bishul yisroel",
      "bishul yisrael",
      "shabbos",
      "shabbat",
      "passover",
      "pesach",
      "kitniyot",
      "kitniyos",
      "gebrochts",
      "non gebrochts",
      "mevushal",
      "havdalah",
      "havdala",
      "blech",
      "plata",
      "shabbos lamp",
      "shabbat lamp",
      "hot plate",
    ],
  },
  {
    category: "dietary_allergy",
    terms: [
      "vegan",
      "vegetarian",
      "dairy free",
      "non dairy",
      "no dairy",
      "gluten free",
      "nut free",
      "peanut free",
      "tree nut free",
      "soy free",
      "egg free",
      "sesame free",
      "sugar free",
      "low sugar",
      "caffeine free",
      "allergy",
      "allergen",
      "safe for allergy",
    ],
  },
  {
    category: "safety_material",
    terms: [
      "hypoallergenic",
      "fragrance free",
      "latex free",
      "bpa free",
      "phthalate free",
      "paraben free",
      "non toxic",
      "lead free",
      "pfas free",
      "food safe",
      "baby safe",
      "toddler safe",
      "sensitive skin",
    ],
  },
  {
    category: "compatibility_exclusion",
    terms: [
      "compatible with",
      "fits",
      "replacement for",
      "works with",
      "without",
      "free of",
      "voltage",
      "wattage",
    ],
  },
];

const HARD_CONSTRAINT_COMPACT_TERMS = new Set(
  HARD_CONSTRAINT_PATTERNS.flatMap(({ terms }) =>
    terms
      .filter((term) => /\s/.test(term))
      .map((term) => term.replace(/\s+/g, "")),
  ),
);

function normalizeConstraintText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[-/_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectHardConstraint(text) {
  const normalizedText = normalizeConstraintText(text);

  if (!normalizedText) {
    return {
      category: "",
      matchedTerm: "",
      shouldRefresh: false,
    };
  }

  const paddedText = ` ${normalizedText} `;
  const compactText = normalizedText.replace(/\s+/g, "");

  for (const { category, terms } of HARD_CONSTRAINT_PATTERNS) {
    for (const term of terms) {
      const normalizedTerm = normalizeConstraintText(term);
      const compactTerm = normalizedTerm.replace(/\s+/g, "");

      if (
        paddedText.includes(` ${normalizedTerm} `) ||
        (HARD_CONSTRAINT_COMPACT_TERMS.has(compactTerm) && compactText.includes(compactTerm))
      ) {
        return {
          category,
          matchedTerm: normalizedTerm,
          shouldRefresh: true,
        };
      }
    }
  }

  if (/\bno\s+\w{2,40}\b/.test(normalizedText)) {
    return {
      category: "compatibility_exclusion",
      matchedTerm: "no",
      shouldRefresh: true,
    };
  }

  return {
    category: "",
    matchedTerm: "",
    shouldRefresh: false,
  };
}

export function buildConstraintRefreshQuery(query, followUpNotes) {
  return `${query || ""} ${followUpNotes || ""}`.replace(/\s+/g, " ").trim();
}
