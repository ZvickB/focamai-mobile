# React Native/Expo Mobile App Audit: Controller & Data Safety

Status: partially addressed. The highest-priority query-quality/hard-constraint refresh race is fixed in `src/search/useMobileSearchController.js` by stopping query-quality polling and clearing any existing suggestion before the hard-constraint discovery refresh starts. Rating/review label null-safety, array-safe result/detail rendering, detail snapshot fallback, and enrichment copy normalization are now addressed. Remaining lower-priority items are fallback candidate-id identity and the `isApplyingQuerySuggestion` lifecycle.

## Summary
This audit reviews controller race conditions, polling behavior, and result-data identity safety in the current mobile search flow.

Overall verdict: the controller/data layer is the right place to inspect next, but not every original finding is equally risky. Prioritize stale polling around hard-constraint refresh, honest loading flags, result normalization, and fallback identity safety.

## Section 1: Controller Findings

### 1. Query Quality Polling Can Survive Too Long During Hard Constraint Refresh
File: `src/search/useMobileSearchController.js`

Issue: Query-quality polling is stopped only after hard-constraint discovery refresh succeeds. Because the refresh happens under the same active request id, an older query-quality poll can still complete during the refresh and set a suggestion for the pre-refresh query/token.

What can go wrong: User answers a hard constraint, mobile refreshes discovery with the constraint, but the Follow-up screen may still show or briefly set a suggestion from the original query.

Severity: Medium

Recommended fix: Stop query-quality polling and clear any existing suggestion before starting `refreshDiscoveryForHardConstraints`, not only after it returns.

### 2. `applyQuerySuggestion()` Clears Its Loading Flag Immediately
File: `src/search/useMobileSearchController.js`

Issue: `setIsApplyingQuerySuggestion(false)` runs immediately after `startDiscoverySearch({ queryOverride })`. Since `startDiscoverySearch` starts async work and returns synchronously, the applying state does not represent the actual new-search transition.

What can go wrong: UI flicker or a misleading ready state while the suggested search is still starting.

Severity: Low

Recommended fix: Either remove this flag if it is not buying much, or reset it from the new search lifecycle after the handoff is complete.

Status: still open.

### 3. Enrichment/Data Merge Should Normalize More Aggressively
File: `src/search/useMobileSearchController.js`

Issue: `mergeEnrichmentIntoResults()` accepts enrichment fields such as `fit_reason`, `caveat`, and `feature_bullets` with limited type coercion. Arrays are checked for feature bullets, but string fields can still receive non-string values.

What can go wrong: Malformed enrichment payloads can display object-shaped values as `[object Object]` or otherwise leak backend shape into UI copy.

Severity: Low

Recommended fix: Normalize enrichment copy before merging: accept strings/numbers, trim strings, drop object-shaped values, and normalize bullet arrays with `String(bullet).trim()` filtering.

Status: addressed. `mergeEnrichmentIntoResults()` now trims primitive enrichment strings, drops object-shaped `fit_reason`/`caveat` values, and normalizes feature bullet arrays before merging.

### 4. Fallback Candidate IDs Can Collide Across Result Sets
File: `src/search/searchApi.js`

Issue: `normalizeFinalResults()` falls back to IDs like `final-0`, `final-1` when backend/candidate data lacks a stable id. The detail screen uses `candidateId` to look up the current item from shared controller state.

What can go wrong: If two different shortlists have malformed results at the same index, the fallback id can refer to the wrong item after retry or replacement scenarios.

Severity: Medium

Recommended fix: Prefer stable backend ids whenever possible. If fallback ids are unavoidable, include a session/request component or avoid using fallback ids as durable navigation identity.

Status: still open. The detail fallback is safer now because route navigation carries a tapped item snapshot, but fallback id generation itself has not been changed.

### 5. Review/Rating Label Helpers Need Defensive Coercion
Files:
- `src/search/SearchResultRows.jsx`
- `src/search/SearchResultDetailMetadata.jsx`

Issue: Label helpers format non-null values with template literals or `Number()` coercion. Object-shaped values can become `[object Object]`, and `Number(null)` becomes `0`.

What can go wrong: UI can show misleading values such as `0.0` rating or `[object Object] reviews`.

Severity: Medium

Recommended fix: Treat `null`, `undefined`, and `""` as missing before numeric conversion. For labels, accept only useful primitive values and fall back for objects/arrays.

Status: addressed. Row and detail helpers now treat explicit missing values as unavailable before numeric conversion and avoid object/array review labels.

## Section 2: Findings To Downgrade Or Reject

### Navigation Back During Active Poll
Original claim: Navigating back mid-polling leaves old timers that overwrite the next search.

Current assessment: Downgrade. `SearchFlowProvider` wraps the navigator, so normal back navigation does not unmount the controller. New searches call `stopEnrichmentPolling()` and `stopQueryQualityPolling()`, and stale responses are guarded by `requestId`. There may still be background work while the user backs out of a screen, but the overwrite scenario is less likely than originally stated.

Possible follow-up: If a future UX needs "Back cancels active work", add an explicit cancellation/reset action tied to route transitions. That is a product behavior decision, not an urgent bug.

### Constraint Refresh Marks Finalize Complete
Original claim: Constraint refresh stores a new token and marks finalize complete before finalize is attempted.

Current assessment: Reject. The current code marks `constraintRefresh` and `discover` complete after refreshed discovery succeeds. It does not mark `finalize` complete until `finalizeSearch` returns.

### Finalize And Retry Can Overlap
Original claim: Finalize and retry can run concurrently and leave buttons disabled forever.

Current assessment: Mostly reject. Both actions synchronously check and set `finalizingRequestIdRef.current`, so a second action should return while the first is active. This is still a sensitive area, but the described overlap/frozen-UI sequence does not match the current implementation.

Possible follow-up: If hardening further, track the operation type as well as request id, for example `{ requestId, operation: "finalize" | "retry" }`, so diagnostics and future edits are clearer.

### Query Quality Timer Stale Closure / Request ID Wraparound
Original claim: Old timeouts can leak and request id wraparound could allow stale updates.

Current assessment: Downgrade. The active request guard handles practical stale updates, and request id wraparound is not a realistic mobile-session risk. Still, the hard-constraint refresh timing above is a real same-request stale-data problem.

### Enrichment Timeout Does Not Explicitly Clear Timer
Original claim: Timeout leaks a timer.

Current assessment: Reject as a leak. `scheduleNextPoll()` calls `stopEnrichmentPolling()` before timeout handling, so the current timer ref is already cleared.

### Retry Advice Ref Mismatch
Original claim: `requestRetryAdvice()` may discard valid responses because refs sync asynchronously via `useEffect`.

Current assessment: Possible but low priority. The function snapshots state and uses refs for stale checks. A very fast response after a same-turn state change could be sensitive, but user-visible risk is lower than the query-quality and rating/null-safety fixes.

## Recommended Fix Order
1. Stop query-quality polling before hard-constraint refresh starts. Addressed.
2. Fix rating/review null safety in result rows and detail metadata. Addressed.
3. Make `SearchResultsSection` and `SearchResultDetailScreen` array-safe. Addressed.
4. Normalize enrichment string fields before merge. Addressed.
5. Rework fallback candidate ids or detail navigation identity. Partially addressed through detail snapshot fallback; fallback id generation remains open.
6. Simplify or correctly lifecycle `isApplyingQuerySuggestion`. Still open.
