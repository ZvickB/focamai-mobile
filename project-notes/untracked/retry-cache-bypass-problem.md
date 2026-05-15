# Retry Cache Bypass Problem

## Why this note exists
- We noticed a likely weakness in the retry path while investigating the Yupik / non-dairy white chocolate chips tester failure.
- This is scratch handoff context, not canonical behavior yet.
- If implemented, update active notes such as `project-notes/app_flow.md`, `project-notes/current-status.md`, and `project-notes/session-handoff.md`.

## Current behavior
- User sees bad results.
- User opens retry and gives correction feedback.
- `/api/search/retry-advice` returns a suggested better query.
- When the user clicks `Search this`, the frontend starts a normal guided search with that suggested query.
- Normal guided discovery calls `/api/search/rainforest-discover`.
- `rainforest-discover` checks the shared discovery cache before calling Rainforest/Amazon.
- The shared discovery cache key is based on normalized query + empty details + marketplace scope.
- The cache key does not include retry feedback, rejected result IDs, retry count, provider version, or search-quality algorithm version.

## Why this can be a problem
- Retry means the user is explicitly saying the previous evidence was wrong or incomplete.
- But the retry-accepted search can still reuse cached discovery evidence if the suggested query already exists in cache.
- The AI often adds details to the retry query, so many retries will naturally miss cache, but that is not guaranteed and should not be the safety mechanism.
- Failure cases:
  - AI suggests the same or very similar query.
  - A previous retry already cached the improved query.
  - Cache normalization collapses small wording changes.
  - Old provider-era cache exists for the improved query.
  - Two different retry complaints produce the same suggested query but should not necessarily trust the same candidate pool.
- This can make retry feel like a loop: the user corrects Focamai, but Focamai may search cached evidence that already failed.

## Related Yupik/non-dairy lesson
- Saved Rainforest samples show that Amazon/Rainforest can return the correct non-dairy/vegan Yupik white chips for `yupik white chocolate chips non dairy`.
- The broader failure was likely caused by one or more of:
  - stale or weak cached candidate pool,
  - earlier Oxylabs-era discovery pool,
  - follow-up notes not triggering a fresh provider search,
  - dietary constraints not being treated as hard enough.
- The retry path should be a stronger escape hatch from bad discovery evidence.

## Recommended fix
- Add an explicit retry/search-refresh signal from frontend to discovery.
- When user accepts retry advice (`Search this`), call discovery with something like:
  - `cacheMode=refresh`, or
  - `bypassCache=true`, or
  - `source=retry_advice`.
- Backend behavior for that signal:
  - skip the shared discovery cache lookup for that request,
  - fetch fresh provider results from Rainforest/Amazon,
  - still write the fresh results back to the normal cache afterward,
  - record cache status/source clearly in search history/debug events.

## Additional hardening
- Version discovery cache entries by provider/search algorithm, for example:
  - `rainforest_discovery:v2:amazon.ca:<query>`
  - or a stored `cacheVersion`/`providerVersion` checked before reuse.
- This prevents old Oxylabs-era or pre-fix pools from being treated as current Rainforest evidence.
- Consider bypassing cache when follow-up notes add hard constraints such as:
  - non-dairy / dairy-free
  - vegan
  - gluten-free
  - nut-free
  - allergy or material exclusions
- In those cases, either run a fresh combined query or show a clear suggested refined search.

## Implementation shape
- Frontend:
  - Update retry accepted path in `src/components/home/useGuidedSearch.js`.
  - Pass a discovery option when `handleTryRetrySuggestion` calls `startGuidedSearch`.
  - Thread that option into `fetchDiscoveryResults` query params.
- Backend:
  - Update `handleRainforestDiscoverySearch` in `backend/server.js`.
  - Parse and sanitize the cache mode flag.
  - If refresh/bypass is set, skip the `cachedEntry?.candidatePool` early return.
  - Continue to write the fresh provider response to cache/session snapshot.
- Tests:
  - Add backend test that normal discovery uses cache.
  - Add backend test that retry/refresh discovery bypasses an existing cached candidate pool and calls provider fetch.
  - Add frontend hook test that accepting retry advice sends the refresh flag.

## Product rule
- Normal repeated searches can use cache.
- Retry-accepted searches should not blindly trust cache, because retry is a correction path.
