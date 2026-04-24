# Phase 3 Plan

## Purpose
- Capture the agreed implementation plan for mobile Phase 3 in one durable note.
- Give the next chat a clean handoff target so it does not need to reuse this large thread.

## Status
- Phase 1 scaffold is complete and runtime-verified in Expo Go.
- Phase 2 navigation shell is complete and verified in Expo Go.
- Phase 3 has not been implemented yet.

## Phase 3 goal
- Port the logic layer first so the mobile app can run the real guided search flow against the shared backend.
- Do not port the full native UI in this phase.
- Use a temporary debug harness in `HomeScreen` to verify the hook behavior before starting Phase 4 UI work.

## Canonical references used for this plan
- `../migration-roadmap.md`
- `current-status.md`
- `session-handoff.md`
- `../../web/project-notes/app_flow.md`
- `../../web/src/components/home/useGuidedSearch.js`
- `../../web/src/components/home/resultPresentation.js`
- `../../web/src/lib/analytics.js`
- `../../web/src/contexts/SearchProgressContext.jsx`
- `../../web/shared/search-input.js`

## Important interpretation notes
- Follow the roadmap phase order, but port the current real web behavior rather than any older simplified assumptions.
- The current primary discovery route in the web hook is `/api/search/rainforest-discover`, not the older generic `/api/search/discover` path.
- Mobile should use absolute API URLs built from Expo config. Relative `/api/...` fetches are fine on web but not reliable in React Native.
- `beginGuidedSearch` should become React Native friendly. Do not keep a DOM-only `event.preventDefault()` contract in the mobile hook.
- Do not bring over full web UI code in this phase. Keep the work centered on pure/shared modules plus the search hook.

## Scope for this phase

### 1. Port shared validation
- Copy `web/shared/search-input.js` to `mobile/src/shared/search-input.js`.
- Keep behavior identical unless React Native usage forces a small import-path adjustment.

### 2. Port result presentation helpers
- Copy `web/src/components/home/resultPresentation.js` to `mobile/src/components/home/resultPresentation.js`.
- Keep the deterministic badge behavior and shortlist-order preservation unchanged.
- Bring over the small related unit-test scenarios as reference notes if helpful, but do not stop Phase 3 on adding a new mobile test runner.

### 3. Port analytics with React Native replacements
- Create `mobile/src/lib/analytics.js` from the web version.
- Replace `localStorage` with `@react-native-async-storage/async-storage`.
- Replace `crypto.randomUUID()` with Expo Crypto.
- Replace web/test environment checks with React Native-safe checks.
- Add a module-level session-id cache so AsyncStorage is only read once per app session.
- Use the configured API base URL for analytics requests instead of a relative `/api/analytics/track` path.
- Keep analytics fire-and-forget and non-blocking.

### 4. Add a small API config helper
- Create a tiny helper in mobile, likely `mobile/src/lib/api.js` or similar.
- Read `extra.apiBaseUrl` from Expo config.
- Provide a safe helper to build absolute URLs for:
  - analytics
  - `rainforest-discover`
  - `refine`
  - `framing-fields`
  - `finalize`
  - `enrichment`
- Keep this helper minimal and Phase-3-only in scope.

### 5. Port the search progress context shape
- Update `mobile/src/contexts/SearchProgressContext.jsx` to match the web progress shape:
  - `hasStartedSearch`
  - `hasDiscoveryResults`
  - `hasFinalResults`
- Remove the current placeholder-only `stage/message` contract.
- If the Phase 3 debug screen still wants readable text, derive that display text in the screen instead of keeping a fake context schema.

### 6. Port `useGuidedSearch`
- Create `mobile/src/components/home/useGuidedSearch.js`.
- Port the current web hook behavior, including:
  - input validation
  - discovery fetch
  - refinement prompt fetch
  - background framing-fields fetch
  - preview results
  - finalize flow
  - enrichment polling
  - retry with excluded ids
  - selected-product state
  - deterministic badge reveal timing
  - analytics events
- Replace browser-only pieces:
  - `window.setTimeout` -> `setTimeout`
  - `window.clearTimeout` -> `clearTimeout`
  - `performance.now()` -> `Date.now()`
  - browser global feature flags -> React Native-safe equivalents
  - relative fetch URLs -> absolute URLs from the mobile API helper
- Update imports away from web alias paths like `@/...` and use local mobile-relative imports.
- Change the hook API where needed so screen handlers call functions directly without DOM event objects.

### 7. Replace the Home stub with a Phase 3 verification harness
- Keep `mobile/src/screens/HomeScreen.jsx` intentionally simple.
- Do not start the real Phase 4 screen port here.
- Add only enough UI to verify the logic layer:
  - query input
  - start search button
  - finalize button
  - show preview button
  - retry feedback input and retry button
  - reset button
  - compact text output for:
    - submitted query
    - discovery token present/missing
    - prompt text
    - preview result count
    - final result count
    - retry count
    - timing data
    - error state
- If useful, include a simple list of result ids/titles for quick inspection.

## Explicitly out of scope for Phase 3
- Porting `HomeExperience.jsx`
- Porting `HomeShared.jsx`
- Porting product cards
- Porting the product detail modal
- Scroll choreography
- keyboard-avoiding polish
- animations and shimmer parity
- responsive result grids
- supplementary trust/legal screen content rewrites

## Implementation order
1. Create mobile copies of `search-input.js` and `resultPresentation.js`.
2. Add the mobile API base-url helper.
3. Port `analytics.js`.
4. Update the mobile search progress context to the web shape.
5. Port `useGuidedSearch.js` with React Native-safe adaptations.
6. Replace the current `HomeScreen` stub with the debug harness.
7. Verify the golden path in Expo Go before touching any Phase 4 UI.

## Behavioral requirements to preserve
- `Show products now` should reveal preview results without finalization.
- `Show focused picks` should execute finalization and return the focused shortlist.
- Final results should remain capped at 6 items.
- Retry must require feedback.
- Retry must exclude previously rejected shortlist ids.
- Retry count must stay capped at 2 follow-up retries.
- If enrichment is not inline, the app should poll every 1.5 seconds up to 30 seconds and merge enrichment by candidate id.
- Selected product state should still be able to hydrate from the latest live results by id.

## Known risks and watchouts
- React Native cannot rely on browser-relative URLs for API calls.
- AsyncStorage makes analytics session-id creation async, which can ripple into the search-start path.
- The web hook currently assumes a browser submit event in `beginGuidedSearch`; that should be redesigned lightly for mobile instead of awkwardly shimmed.
- Import aliases used by the web app should not be copied blindly into mobile files.
- Background framing and analytics should fail quietly rather than blocking the main guided flow.
- The temporary Home debug harness should not accidentally become the Phase 4 UI foundation.

## Verification checklist for Phase 3
- Enter a real query in Expo Go and start search successfully.
- Discovery returns a token and candidate/preview data.
- Refine returns a prompt, or the fallback prompt appears if refine fails.
- Preview results can be shown without finalization.
- Finalize returns a shortlist.
- Result count stays at or under 6.
- Retry is blocked when feedback is empty.
- Retry works when feedback is present and increments the retry count.
- Enrichment polling updates results when enrichment becomes ready.
- Reset clears the guided-search state cleanly.
- No backend contract changes are required.

## Phase 3 exit criteria
- The mobile app can execute the real guided flow from query submission through finalize using the shared backend.
- The debug harness proves discovery, refine, preview, finalize, retry, and enrichment all work in Expo Go.
- The codebase is ready to begin Phase 4 native UI porting from a stable logic layer.

## Suggested next-chat prompt
- Read `mobile/project-notes/phase-3-plan.md`, `mobile/project-notes/current-status.md`, and `mobile/migration-roadmap.md`, then implement Phase 3 only. Keep UI minimal and use a debug harness in `mobile/src/screens/HomeScreen.jsx` until the logic layer is verified in Expo Go.
