# React Native/Expo Mobile App Audit: Null/Undefined Safety On Result Data

Status: addressed for the high-priority result/detail rendering paths. `SearchResultRows.jsx` and `SearchResultDetailMetadata.jsx` now treat `null`, `undefined`, and empty ratings as missing before numeric conversion, avoid empty-star display for missing detail ratings, and fall back from object/array review-count values instead of rendering `[object Object]`. `SearchResultsSection.jsx` now coerces malformed result props to arrays, and `SearchResultDetailScreen.jsx` guards malformed `finalResults` while using an explicit unavailable-detail state when no live item or route snapshot exists.

## Summary
This audit reviews result-data rendering safety in the mobile shortlist and detail surfaces.

Overall verdict: this audit is mostly valid. The most important bugs are misleading rating display for missing ratings and weak defensive defaults around reusable result/detail components. The image concern is already handled by `ProductImageFrame` and should be treated as low/no priority.

## Section 1: Real Bugs To Fix

### 1. Missing Ratings Display As `0.0`
File: `src/search/SearchResultDetailMetadata.jsx`

Issue: `formatRating(value)` calls `Number(value)` before checking explicit missing values. In JavaScript, `Number(null) === 0`, so a normalized `rating: null` displays as `0.0`.

What can go wrong: Products without a rating look like they have a zero rating in the detail hero and at-a-glance panel.

Severity: Medium

Recommended fix: Treat `null`, `undefined`, and `""` as missing before numeric conversion.

### 2. Missing Ratings Render As Empty Stars
Files:
- `src/search/SearchResultDetailMetadata.jsx`
- `src/search/SearchResultRows.jsx`

Issue: Both detail and row helpers use `Number(value)` in rating conversion. `null` becomes `0`, so a missing rating can render as five empty stars or as a low/zero-looking rating state instead of a missing-rating state.

What can go wrong: Users may interpret "not rated/not shown" as "rated badly."

Severity: Low to Medium

Recommended fix: Use a shared helper or matching local helpers that return `null` for explicit missing values before numeric conversion.

### 3. Review Counts Can Render Object Values
Files:
- `src/search/SearchResultDetailMetadata.jsx`
- `src/search/SearchResultRows.jsx`

Issue: Review labels use template literals for any non-empty value. Object-shaped backend values render as `[object Object] reviews`.

What can go wrong: Malformed backend data leaks directly into user-facing UI.

Severity: Low

Recommended fix: Accept only strings/numbers/booleans that produce useful labels. For objects/arrays, fall back to `Reviews not shown`.

### 4. `SearchResultsSection` Should Default Result Props To Arrays
File: `src/search/SearchResultsSection.jsx`

Issue: `previewItems.length` and `finalResults.length` assume both props are arrays.

Current risk: Normal app flow passes arrays from the controller, so this is not an urgent crash in the current screens. Still, this component is reusable and already has optional-looking props, so it should be defensive.

Severity: Medium as hardening, low in current flow

Recommended fix: Default destructured props to arrays:

```js
export function SearchResultsSection({
  finalResults = [],
  previewItems = [],
  ...
}) {
```

### 5. `SearchResultDetailScreen` Should Guard `finalResults`
File: `src/screens/SearchResultDetailScreen.jsx`

Issue: `finalResults.findIndex(...)` assumes context always provides an array.

Current risk: `useMobileSearchController()` initializes `finalResults` as `[]`, so normal flow is safe. Direct navigation, tests, future refactors, or malformed context values could still crash.

Severity: Medium as hardening, low in current flow

Recommended fix: Coerce before lookup:

```js
const safeFinalResults = Array.isArray(finalResults) ? finalResults : [];
```

Then use `safeFinalResults` for `findIndex` and item lookup.

## Section 2: CandidateId And Legacy Route Fallback

### 6. Undefined `candidateId`
File: `src/screens/SearchResultDetailScreen.jsx`

Current behavior: If `candidateId` is undefined, `matchedIndex` becomes `-1`, and the screen uses `route.params?.item || {}`.

Assessment: This is acceptable for the legacy route-item path, but empty `{}` fallback means the detail screen shows generic fallback copy. That is better than crashing, but it can look like a blank/stale detail screen.

Recommended fix: Keep the fallback, but normalize `routeItem` into a detail-safe shape or show an explicit "Pick details unavailable" state when neither a matched current result nor a usable route item exists.

### 7. Retry Replaces Shortlist After Detail Navigation
File: `src/screens/SearchResultDetailScreen.jsx`

Current behavior: The detail screen resolves the current item from shared `finalResults` by `candidateId`. If a retry replaces the shortlist while the detail screen is open or before navigation settles, the old `candidateId` may no longer match. The screen then falls back to `routeItem || {}`.

Assessment: The current card navigation likely passes the item through the legacy route fallback, so users probably still see the tapped item. If only `candidateId` is passed in a future path, lookup failure would produce empty fallback content.

Recommended fix: When navigating to detail, keep passing a normalized item snapshot as the fallback, not only `candidateId`. Also consider showing a small stale-details notice if `candidateId` no longer appears in the current shortlist.

### 8. Legacy Route Item May Not Match Normalized Detail Shape
File: `src/screens/SearchResultDetailScreen.jsx`

Issue: The current normalized detail path expects fields like `id`, `title`, `provider`, `price`, `rating`, `reviewCount`, `image`, `link`, `fit_reason`, `caveat`, and `feature_bullets`. A legacy raw `routeItem` may omit some or use alternate names.

Current risk: Detail helpers use many fallbacks, so this is unlikely to crash. But raw route items can lose image/link/reasoning fields or display weaker copy than normalized results.

Severity: Low to Medium

Recommended fix: Add a small `normalizeDetailItem(routeItem)` helper or reuse result normalization shape before rendering fallback route items.

## Section 3: Low Or Non-Issues

### `item.image` Without A Local Guard
Original concern: `item.image` is passed to `ProductImageFrame` without `|| ""`.

Current assessment: Low/no issue. `ProductImageFrame` already checks `if (!image || hasImageError)` and renders the "Image pending" fallback before building an RN Image source. No immediate fix needed, though passing `image={item.image || ""}` would be harmless.

### Feature Bullet React Keys
Original concern: duplicate bullet text could collide.

Current assessment: No issue. The key includes both bullet content and index, so duplicate bullet text remains unique.

### `fit_reason`, `caveat`, And Feature Bullet Empty States
Current assessment: Mostly safe in the detail screen. `detailValue()` handles empty values, and feature bullets are array-checked and string-trimmed. The remaining risk is upstream enrichment merge accepting object-shaped string fields, which belongs in the controller/data audit.

## Recommended Fix Order
1. Fix rating conversion in detail metadata and result rows.
2. Harden review-count formatting against object/array values.
3. Default `SearchResultsSection` result props to arrays.
4. Guard `finalResults` in `SearchResultDetailScreen`.
5. Normalize or explicitly handle legacy `routeItem` fallback in detail navigation.
