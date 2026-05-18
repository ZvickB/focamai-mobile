# React Native/Expo Mobile App Audit: Controller & Data Safety

## Summary
This audit identified 8 high/medium severity issues in the search controller and data handling layers.

## Section 1: Controller (Race Conditions & State Management)

### 1. Missing Cleanup on Navigation Back During Active Poll
File: src/search/useMobileSearchController.js:454-459
Issue: Cleanup effect only runs on unmount. If user navigates back mid-polling, timers keep running. Old timers fire on next search and overwrite current results with stale data.
What can go wrong: User starts search A with enrichment polling → navigates back → starts search B → old enrichment from A overwrites B's results.
Severity: High

### 2. Query Quality Polling Not Stopped Before Hard Constraint Refresh
File: src/search/useMobileSearchController.js:809
Issue: Query-quality polling from original query can complete after constraint refresh and overwrite the new suggestion.
What can go wrong: Hard constraint triggers refresh → old poll completes late → overwrites suggestion with one for the old query.
Severity: Medium

### 3. finalizingRequestIdRef Guard Insufficient After Constraint Refresh
File: src/search/useMobileSearchController.js:770, 816, 820
Issue: Constraint refresh stores new token and marks finalize phase as "complete" before actual finalize is attempted. If finalize fails, session is inconsistent.
What can go wrong: Phase shows complete but finalize hasn't run → user can't retry → confusing error state.
Severity: High

### 4. Finalize and Retry Can Overlap Without True Mutual Exclusion
File: src/search/useMobileSearchController.js:841, 870, 980, 1076, 1112, 1208
Issue: Both finalize and retry check and set finalizingRequestIdRef to the same requestId. Finalize's finally clears the flag even if retry is still running → retry's finally doesn't reset UI flag → buttons stay disabled forever.
What can go wrong: User submits slow finalize → taps retry → both run concurrently → finalize clears flag → retry doesn't reset setIsFinalizing(false) → UI frozen.
Severity: High

### 5. Stale Closure Risk in Query Quality Polling
File: src/search/useMobileSearchController.js:252-260
Issue: Old timeouts keep firing after new search starts. Resource leak; edge case where requestId wraparound could cause old poll to update new search.
What can go wrong: Rapid searches → lingering timeouts → resource leak.
Severity: Low

### 6. Enrichment Polling Timeout Does Not Explicitly Clear Timer
File: src/search/useMobileSearchController.js:374-403
Issue: On timeout, timer ref not explicitly cleared.
What can go wrong: Minor resource leak.
Severity: Low

### 7. Stale Ref Comparison in requestRetryAdvice()
File: src/search/useMobileSearchController.js:1003-1035
Issue: Snapshot uses state vars; staleness check uses refs. Refs sync via useEffect asynchronously. Mismatch can cause stale response to be discarded.
What can go wrong: User changes follow-up notes → response arrives before ref syncs → staleness check rejects valid response.
Severity: Medium

### 8. applyQuerySuggestion() Resets State Immediately Without Waiting
File: src/search/useMobileSearchController.js:1240-1251
Issue: setIsApplyingQuerySuggestion(false) called immediately after startDiscoverySearch, not after it completes.
What can go wrong: UI flicker; loading state disappears instantly.
Severity: Low

## Section 2: Data Normalization & Null Safety

### 1. Fallback candidateId Index String Can Collide in Retry Scenario
File: src/search/searchApi.js:246-248, src/screens/SearchResultDetailScreen.jsx:69
Issue: getCandidateId generates fallback "final-0", "final-1". If both original and retry searches have malformed results at same index, fallback IDs collide and old candidateId matches wrong new result.
What can go wrong: Open result #1 from search A (fallback "final-0") → retry → search B result #1 also "final-0" → same candidateId shows wrong product.
Severity: Medium

### 2. mergeEnrichmentIntoResults() Does Not Validate Entry Field Types
File: src/search/useMobileSearchController.js:98-137
Issue: Enrichment entries assigned without type validation. If fit_reason is object, assigned directly; rendering coerces to "[object Object]".
What can go wrong: Backend returns fit_reason: {nested: object} → rendered as "[object Object]".
Severity: Low

### 3. formatReviewCountLabel() Does Not Validate reviewCount Type
File: src/search/SearchResultRows.jsx:13-19
Issue: Checks for null/undefined/empty but not for type. Object reviewCount coerces to "[object Object] reviews".
What can go wrong: Backend returns reviewCount as object → displayed as "[object Object] reviews".
Severity: Low

### 4. Route Parameter Item Missing Default Fields
File: src/screens/SearchResultDetailScreen.jsx:71
Issue: When candidateId lookup fails, fallback routeItem may lack fields. Rendering handles undefined defensively but inconsistency means different content depending on lookup path.
What can go wrong: Detail opened via candidateId shows normalized fields; same detail opened via route shows empty fallbacks for undefined fields.
Severity: Low

## Section 3: Quick Wins

### Fix 1: Clear finalizingRequestIdRef Before Starting New Finalize
File: src/search/useMobileSearchController.js:841
Change: Replace if-return with finalizingRequestIdRef.current = null
Benefit: Prevents overlap with retry; fixes frozen UI bug.

### Fix 2: Move setIsApplyingQuerySuggestion(false) to After Discovery Completes
File: src/search/useMobileSearchController.js:1250
Change: Reset state in discovery promise finally, not immediately after call.
Benefit: Fixes UI flicker; shows loading state correctly.

### Fix 3: Explicitly Stop Query Quality Polling Before Constraint Refresh
File: src/search/useMobileSearchController.js:899
Change: Add stopQueryQualityPolling before refreshDiscoveryForHardConstraints
Benefit: Prevents stale polling from overwriting new suggestion.

### Fix 4: Validate candidateId Lookup Result
File: src/screens/SearchResultDetailScreen.jsx:71
Change: Type-check routeItem before using as fallback.
Benefit: Prevents runtime errors; clarifies intent.
