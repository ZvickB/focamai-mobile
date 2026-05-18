# Mobile App Audit: Quality Gaps Relative To The Web App

## Summary

This audit records areas where the mobile app's data handling and result presentation are materially weaker than the equivalent web code. The web app has mature, tested utility logic that mobile does not have or has partially reimplemented ad hoc. These are gaps in capability or correctness, not platform differences.

---

## Gap 1: No Result Badge / Contextual Label System

Web file: `web/src/components/home/resultPresentation.js`

The web app scores each result against the user's submitted query using keyword pattern matching to assign a contextual label — for example "Best lightweight option", "Best for beginners", "Best for durability", "Best match". Up to three results get a badge per search. The scoring uses weighted strong and soft keyword patterns against the result's title, description, and reasons text.

Mobile has no equivalent. Results are shown with a numeric rank only. A user who searched for "lightweight travel stroller" sees ranked cards with no signal about which card matched their framing.

Severity: Medium — the product's promise is focused, trust-building picks. Contextual labels are part of how the web earns that trust.

---

## Gap 2: No Shared Price Parsing Or Display Price Formatting

Web files: `web/src/lib/formatDisplayPrice.js`, `web/src/components/home/resultPresentation.js`

The web app has a standalone tested utility for parsing and formatting display prices. It handles strings with commas, currency symbols, ranges, and edge cases. It has its own unit tests (`formatDisplayPrice.test.js`).

Mobile formats prices inline, ad hoc, across multiple components. There is no shared price helper and no test coverage for price display logic. Malformed or unusual price values from the backend are not normalized before rendering.

Severity: Low to Medium — price display is user-visible and affects trust. Inconsistent formatting across result cards, detail screen, and the footer CTA is a real quality difference from the web.

---

## Gap 3: Thin Unit Test Coverage On Data Normalization

Web files: `resultPresentation.test.js`, `formatDisplayPrice.test.js`, `useGuidedSearch.test.js`, `HomePage.*.test.jsx` (multiple)

The web app has unit tests on its price formatting, result presentation logic, and core search hook behavior. These tests have caught real regressions and prevented data formatting bugs from shipping.

Mobile's Jest/RNTL test coverage is limited to component smoke tests: `SearchEntrySection`, `SearchResultsSection`, `SearchRefineSection`, `SearchRetrySection`, `SearchProgressStatus`, `QuerySuggestionPrompt`, `searchApi`, `searchConstraints`. The data normalization paths inside `normalizeFinalResults`, `normalizeDiscoveryItems`, `mergeEnrichmentIntoResults`, and the rating/price formatting helpers in `SearchResultRows` and `SearchResultDetailMetadata` have no unit tests. Several bugs found in the controller/null-safety audits were only discovered by reading the code, not by a failing test.

Severity: Medium — every audit finding so far has been in code that has no test coverage. The pattern will repeat.

---

## Gap 4: No Presentation Text Scoring For Result Ordering

Web file: `web/src/components/home/resultPresentation.js`

The web app builds a combined presentation text string from a result's title, description, and reasons before scoring keyword badges. This means badge assignment and result labeling are based on the actual content of each pick, not just its API rank.

Mobile has no equivalent. It renders finalize-ranked results in the order returned, with no on-device re-scoring or label assignment based on the user's query context. If the backend ranking changes shape or the user's query doesn't match the backend's weighting, mobile has no presentation layer to compensate.

Severity: Low — finalize ranking is the backend's job, so this is partly by design. But the presentation scoring logic also affects label quality, which is Gap 1 above.

---

## Gap 5: Enrichment Field Normalization Is Incomplete Upstream

Web: enrichment fields go through the `useGuidedSearch` hook, which has extensive test coverage and has been through several normalization iterations.

Mobile file: `src/search/useMobileSearchController.js`

The controller audit addressed the most obvious cases (trimming strings, dropping object-shaped fit reason and caveat values), but the current enrichment merge does not normalize all possible backend field shapes. `feature_bullets` can contain non-string array entries that are only coerced by the render helpers downstream. `fit_reason` and `caveat` normalization relies on type checks that do not cover all unexpected payload shapes (e.g. numbers, booleans, nested objects with a `text` field).

Render-time coercion works as a fallback but is a symptom of the merge not being strict enough at the data boundary.

Severity: Low — the worst cases are addressed. This is a data cleanliness issue rather than a crash risk in current flows.
