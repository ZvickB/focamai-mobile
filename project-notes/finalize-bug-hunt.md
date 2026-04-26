# Finalize Bug Hunt Handoff

## Current symptom
- Expo Go can run the mobile app and the initial search/discovery path works.
- The problematic path is `Start search` -> wait for discovery/refinement -> tap `Show focused picks`.
- Earlier notes describe this as an Expo Go hang/crash during finalize. Current static review plus API probing found a concrete mobile/web divergence that can break finalize before any final results are rendered.

## Strongest bug found
- Mobile drops `amazonDomain` after discovery and does not send it to `/api/search/finalize`.
- The web hook stores the submitted Amazon domain and sends it through discovery, finalize, and enrichment.
- The mobile hook only stores:
  - `submittedQuery`
  - `discoveryToken`
  - `candidatePool`
  - `previewResults`
- The discovery response includes `amazonDomain`, and the mobile `candidatePool` also appears to include it, but mobile never stores a separate `submittedAmazonDomain` and never includes `amazonDomain` in the finalize request body.

## Why that matters
- Backend finalize chooses cache lookup scopes from `body.amazonDomain`.
- Relevant backend behavior:
  - `web/backend/server.js` `sanitizeFinalizeDiscoveryContext(...)` reads `body.amazonDomain`.
  - `handleFinalizeSelection(...)` builds `finalizeScopes`.
  - If `amazonDomain` is present, finalize looks in the Rainforest marketplace scope, e.g. `rainforest:amazon.com`.
  - If `amazonDomain` is missing, finalize falls back to older generic discovery scopes: `CACHE_SCOPE_DISCOVERY` and `CACHE_SCOPE_RAINFOREST`.
- Rainforest discovery writes snapshots under the marketplace-specific Rainforest scope.
- So mobile can successfully get a discovery token, then immediately fail finalize lookup because finalize searches the wrong cache scope.

## API proof from this chat
- Command run from `mobile/`: Node `fetch` against `https://focamai.com`.
- Query: `wireless headphones`.
- Discovery without explicit marketplace succeeded:
  - status `200`
  - `amazonDomain: "amazon.com"`
  - candidate count `16`
  - discovery token present
- Finalize without `amazonDomain`, matching the current mobile request shape, returned:
  - status `409`
  - body `{"error":"Your search session expired. Start a new search."}`
- Finalize with `amazonDomain: "amazon.com"` added to the same request shape returned:
  - status `200`
  - result count `6`
  - payload keys: `debug`, `finalizeFast`, `requestMode`, `retryCount`, `results`, `selection`, `usage`
- This is the cleanest reproduction found so far. It strongly suggests the first fix should be restoring marketplace/domain propagation in the mobile port.

## Files to inspect first
- `src/components/home/useGuidedSearch.js`
  - Main mobile logic hook.
  - `fetchDiscoveryResults(...)` currently only takes `query`; it should probably support/store `amazonDomain` like the web hook.
  - `finalizeGuidedSearch(...)` currently posts `query`, `discoveryToken`, notes, retry fields, excluded IDs, and `requestMode`, but not `amazonDomain`.
  - `fetchEnrichment(...)` currently sends only `token` and `query`; web also appends `amazonDomain`.
  - `handleFinalizeRefinement(...)`, `handleRetryWithFeedback(...)`, and probes should include the stored submitted domain.
- `src/screens/HomeScreen.jsx`
  - Phase 3 debug harness.
  - `Show focused picks` is disabled while `isFinalizing`, which is good.
  - It does not show submitted marketplace/domain, so add that to the status snapshot while debugging.
- `src/lib/api.js`
  - API base URL is `Constants.expoConfig.extra.apiBaseUrl`.
  - Default comes from `app.config.js`: `process.env.API_BASE_URL || "https://focamai.com"`.
- `../web/src/components/home/useGuidedSearch.js`
  - Canonical behavior for marketplace propagation.
  - Look for `submittedAmazonDomain`, `setSubmittedAmazonDomain`, `appendAmazonDomain`, `amazonDomain: submittedAmazonDomain`, and enrichment polling.
- `../web/backend/server.js`
  - Confirm cache scope behavior around `sanitizeFinalizeDiscoveryContext(...)`, `handleRainforestDiscoverySearch(...)`, and `handleFinalizeSelection(...)`.

## What has already been done before this note
- Prior hardening, already present in `src/components/home/useGuidedSearch.js` and `src/screens/HomeScreen.jsx`:
  - Duplicate finalize attempts are blocked while `isFinalizing`.
  - Active finalize requests are abortable.
  - Reset/new search/unmount cancels active finalize and discovery requests.
  - Stale finalize success/error handlers are ignored via `requestId`.
  - Finalize/discovery result lists are normalized and capped before mobile rendering.
  - `candidatePool.candidates` is guarded with `Array.isArray(...)`.
  - Debug harness no longer stringifies full large finalize/framing/timing objects inline.
- Verification already done before this note per `session-handoff.md`:
  - `npx expo export --platform ios` passed.
- Verification done in this chat:
  - `npm ls --depth=0` completed successfully.
  - `npx expo export --platform ios` completed successfully.
  - Direct API probing proved finalize needs `amazonDomain` for the successful path.
- No app source files were changed in this chat. Only this handoff note was written.

## Important caveat
- The missing `amazonDomain` explains a finalize failure, especially "session expired" immediately after discovery.
- It may or may not explain Expo Go fully closing. If the app still crashes after domain propagation is fixed, the next debugging step should separate:
  - network/request failure before payload parsing
  - `response.text()` / `JSON.parse` memory or runtime failure
  - state update failure in `applyFinalizePayload(...)`
  - render failure in the debug harness after `setResults(...)`

## Recommended next fix
1. Port the web marketplace propagation into mobile:
   - Add `submittedAmazonDomain` state.
   - Store `payload.amazonDomain || candidatePool.amazonDomain || "amazon.com"` after discovery.
   - Include `amazonDomain` in finalize request bodies.
   - Include `amazonDomain` in enrichment polling query params.
   - Include `amazonDomain` in `handleProbeFinalizeRequest(...)`.
2. Add debug harness visibility:
   - Show `Submitted domain: ...` in `HomeScreen.jsx`.
   - Log `amazonDomain` in `[mobile-guided-search] finalize started` and `finalize request sent`.
3. Re-test in Expo Go:
   - Run `npx expo start --clear` from `mobile/`.
   - Query `wireless headphones` or another query known to return discovery results.
   - Tap `Start search`.
   - Wait for candidate pool and token.
   - Tap `Show focused picks` once.
   - Expected after the fix: finalize returns 6 final results instead of session-expired.
4. If Expo Go still crashes:
   - Capture the last Metro lines beginning with `[mobile-guided-search]`.
   - Note whether these appear:
     - `finalize started`
     - `finalize request sent`
     - `finalize response received`
     - `finalize payload received`
     - `finalize failed`
   - If logs stop before `finalize response received`, investigate network/fetch/runtime abort.
   - If logs stop after `finalize payload received`, investigate result processing/rendering.
   - If an error is surfaced instead of a crash, fix that first and keep the app from closing.

## Suggested next-chat prompt
Use this prompt in the next high-reasoning chat:

```text
We are in C:\Users\zvick\Desktop\udemy\my projects\focama\mobile. Read project-notes/session-handoff.md, project-notes/current-status.md, and especially project-notes/finalize-bug-hunt.md.

The active blocker is Expo Go finalize: discovery/search works, but tapping "Show focused picks" fails/crashes. A previous bug hunt found a strong mobile/web divergence: mobile drops amazonDomain after discovery and does not send amazonDomain to /api/search/finalize or enrichment. Direct API probing showed discovery succeeds, finalize without amazonDomain returns 409 "Your search session expired", and finalize with amazonDomain returns 200 with 6 results.

Please make the smallest code fix in mobile/src/components/home/useGuidedSearch.js and mobile/src/screens/HomeScreen.jsx to port the web amazonDomain propagation into mobile. Use ../web/src/components/home/useGuidedSearch.js as the canonical reference. Add lightweight debug visibility/logging for submittedAmazonDomain. Then run npx expo export --platform ios. Do not start Phase 4 UI work. Keep the focus on stabilizing Phase 3 finalize.
```

## Update after mobile domain propagation fix
- `src/components/home/useGuidedSearch.js` now stores `submittedAmazonDomain` after discovery using `payload.amazonDomain || payload.candidatePool.amazonDomain || payload.candidatePool.marketplace || "amazon.com"`.
- Mobile finalize requests, finalize probes, simple finalize probes, and enrichment polling now send the stored Amazon domain.
- `src/screens/HomeScreen.jsx` now shows `Submitted domain` in the Phase 3 harness status snapshot.
- Lightweight Metro logs now include the domain in `finalize started`, `finalize request sent`, and finalize probe logs.
- Verification run after the patch: `npx expo export --platform ios` passed.
- Still needs Expo Go device verification for `Start search` -> `Show focused picks`; expected result is 6 final results instead of immediate session-expired.
