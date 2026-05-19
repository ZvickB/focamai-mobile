# Audit: Navigation Params & Detail Screen Correctness

Status: addressed for the recommended detail fallback path. Results navigation now passes a tapped item snapshot alongside `candidateId` and rank, `SearchResultDetailScreen` array-guards live `finalResults`, prefers the live matched rank when available, normalizes route snapshots before rendering, shows a stale-snapshot note when the live shortlist no longer contains the item, and renders a clear unavailable state when neither a live match nor a usable route snapshot exists.

## Summary
This audit reviews the focused-pick detail path:

- `src/screens/ResultsScreen.jsx`
- `src/screens/SearchResultDetailScreen.jsx`
- `src/search/SearchResultDetailMetadata.jsx`
- `src/search/searchApi.js`

Overall verdict: the current detail lookup works in the happy path, but the fallback path is weaker than it looks. `SearchResultDetailScreen` has legacy `routeItem` fallback logic, yet the current navigation call only passes `candidateId` and `rank`. If the shared `finalResults` lookup fails, the screen silently renders an empty fallback item instead of telling the user the pick is unavailable.

This is not an urgent crash in normal use, but it is worth fixing before detail behavior gets richer.

## Current Flow

`ResultsScreen.jsx` opens detail like this:

```js
navigation.navigate("SearchResultDetail", {
  candidateId: item.id,
  rank: index + 1,
});
```

`SearchResultDetailScreen.jsx` resolves the item like this:

```js
const candidateId = route.params?.candidateId;
const routeItem = route.params?.item;
const routeRank = route.params?.rank;
const matchedIndex = candidateId
  ? finalResults.findIndex((result) => String(result.id) === String(candidateId))
  : -1;
const item = matchedIndex >= 0 ? finalResults[matchedIndex] : routeItem || {};
const rank = routeRank || (matchedIndex >= 0 ? matchedIndex + 1 : undefined);
```

The current happy path is:

1. Results list renders normalized `finalResults`.
2. User taps a result.
3. Navigation passes `candidateId`.
4. Detail screen finds the matching item in shared `finalResults`.
5. Detail screen renders the current normalized item.

That path is fine.

## What Happens If `candidateId` Is Undefined?

If `candidateId` is missing or empty, `matchedIndex` becomes `-1` and no lookup happens. Because current navigation does not pass `routeItem`, the item becomes `{}`.

The screen does not crash because most detail helpers have fallbacks:

- title becomes `Untitled product`
- provider becomes `Unknown source`
- price becomes `Price not shown`
- rating becomes fallback text, once rating null-safety is fixed
- retailer CTA becomes `Retailer link unavailable`
- decision notes use generic enrichment fallback copy

Risk: the user sees a generic detail page instead of a clear unavailable-pick state.

Severity: Medium as UX correctness, low as crash risk.

Recommended change: after resolution, distinguish three states:

- matched current shortlist item
- route snapshot fallback item
- unavailable/missing item

If neither a current match nor a usable route snapshot exists, render a clear "This pick is no longer available. Go back and select a current pick." state.

## What Happens If Retry Replaces The Shortlist?

The original audit stated that tapping details, going back, retrying, and replacing the shortlist would blank the still-mounted detail screen.

Current assessment: soften that claim. In normal stack navigation, going back from detail to Results usually pops/unmounts the detail screen. So the exact "mounted detail goes blank after retry" flow is less likely than originally stated.

The underlying risk is still real:

- The detail screen subscribes to shared `finalResults`.
- If `finalResults` changes while detail remains mounted for any future navigation/state pattern, the old `candidateId` may no longer match.
- Since current navigation does not pass `routeItem`, lookup failure falls to `{}`.

Recommended change: pass a normalized item snapshot in the navigation params as a real fallback:

```js
navigation.navigate("SearchResultDetail", {
  candidateId: item.id,
  item,
  rank: index + 1,
});
```

Then detail can keep showing the tapped item even if the live shortlist changes, while optionally displaying a small stale-context notice if the candidate is no longer in the current shortlist.

## Route Rank Can Become Stale

Current rank logic prefers the navigation-time rank:

```js
const rank = routeRank || (matchedIndex >= 0 ? matchedIndex + 1 : undefined);
```

If a current match exists, the current `matchedIndex` should be more trustworthy than the route-time rank. Route rank is useful for fallback snapshots, not for a live current-list match.

Recommended change:

```js
const rank = matchedIndex >= 0 ? matchedIndex + 1 : routeRank;
```

Severity: Low to Medium. This is not a crash, but wrong rank labels can undermine trust.

## Legacy `routeItem` Fallback Is Currently Dead Code

The fallback exists:

```js
const item = matchedIndex >= 0 ? finalResults[matchedIndex] : routeItem || {};
```

But normal app navigation does not pass `item`, so this fallback does not protect the current path.

Recommended change: either wire it up by passing `item` from `ResultsScreen`, or remove it and replace it with an explicit unavailable state. The better choice is to wire it up because it gives the detail screen a useful snapshot fallback.

## Does A Fallback Item Have The Fields Detail Expects?

The normalized current-list item usually has:

- `id`
- `title`
- `provider`
- `price`
- `rating`
- `reviewCount`
- `image`
- `link`
- `fit_reason`
- `caveat`
- `feature_bullets`

A raw or preview-shaped route item may miss:

- `reviewCount`
- `image`
- `link`
- `fit_reason`
- `caveat`
- `feature_bullets`

The current detail helpers mostly avoid crashes, but a raw fallback item can produce weak or misleading content: no image, unavailable retailer link, generic decision notes, and generic feature notes.

Recommended change: add a small detail fallback normalizer near the screen, for example `normalizeDetailRouteItem(routeItem)`, that returns the same safe field shape expected by `SearchResultDetailMetadata`.

## Enrichment Status Can Be Misleading On Lookup Miss

Current code reads enrichment status from the live session:

```js
const enrichmentStatus = activeSearchSession?.phases?.enrich || "idle";
```

If no item is matched and no route snapshot exists, this status can make the empty fallback screen say extra analysis is still running or has completed. That message is about the session, not the missing item.

Recommended change: only pass live `enrichmentStatus` when rendering a matched current item or a valid snapshot item. For the unavailable state, do not render enrichment copy.

## Recommended Fix Shape

Implement detail resolution as explicit state:

```js
const safeFinalResults = Array.isArray(finalResults) ? finalResults : [];
const candidateId = route.params?.candidateId;
const routeItem = normalizeDetailRouteItem(route.params?.item);
const matchedIndex = candidateId
  ? safeFinalResults.findIndex((result) => String(result.id) === String(candidateId))
  : -1;
const matchedItem = matchedIndex >= 0 ? safeFinalResults[matchedIndex] : null;
const item = matchedItem || routeItem;
const isStaleSnapshot = Boolean(routeItem && !matchedItem);
const isUnavailable = !item;
const rank = matchedIndex >= 0 ? matchedIndex + 1 : route.params?.rank;
```

Then render:

- unavailable state if `isUnavailable`
- optional stale snapshot note if `isStaleSnapshot`
- normal detail UI otherwise

## Recommended Fix Order

1. Pass `item` from `ResultsScreen` when navigating to `SearchResultDetail`.
2. Guard `finalResults` with `Array.isArray`.
3. Prefer computed rank when `matchedIndex >= 0`.
4. Add an explicit unavailable state instead of rendering `{}`.
5. Normalize fallback `routeItem` into the expected detail shape.
6. Avoid live enrichment-status copy when the detail item is unavailable.
