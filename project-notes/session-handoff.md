# Mobile Session Handoff

## Purpose
- Fastest reset for a fresh mobile chat.
- Point to the canonical mobile and web notes without duplicating the whole project.

## Startup read order
1. `../AGENTS.md`
2. `current-status.md`
3. `../migration-roadmap.md`
4. `../CLAUDE.md`
5. `../../web/project-notes/app_flow.md`
6. `../../web/project-notes/current-status.md`
7. `../../web/project-notes/doc_briefs.md`

## Current direction
- This is a React Native Expo port of the existing Focama web app.
- Backend stays shared with web. Mobile work is frontend-only unless the user explicitly asks otherwise.
- Most product and flow decisions remain anchored in `web/project-notes`.
- Mobile should preserve the calm, search-first, focused experience rather than reinvent it.
- The current migration plan is phase-based and lives in `../migration-roadmap.md`.

## What to preserve from web
- Search-first home experience
- One fast follow-up refinement question
- 6 focused picks
- Trusted-assistant AI tone with honest caveats
- Mobile-first, not marketplace-shaped UI
- Vendor-agnostic product presentation

## Current mobile reality
- `mobile/` now contains:
  - Stage 1 Expo scaffold
  - Phase 2 navigation shell
  - Phase 3 logic-layer port plus a temporary debug harness in `mobile/src/screens/HomeScreen.jsx`
- Core setup already landed for:
  - Expo app root files
  - NativeWind configuration
  - Reanimated Babel/Metro setup
  - `app.config.js` with `extra.apiBaseUrl`
- Current app root now runs:
  - `RootNavigator.jsx`
  - `QueryClientProvider`
  - `SearchProgressProvider`
  - top-level route screens
- Current Phase 3 files now exist in mobile:
  - `mobile/src/components/home/useGuidedSearch.js`
  - `mobile/src/components/home/resultPresentation.js`
  - `mobile/src/shared/search-input.js`
  - `mobile/src/lib/api.js`
  - `mobile/src/lib/analytics.js`
  - `mobile/src/screens/HomeScreen.jsx` debug harness
- Runtime reality right now:
  - `Start search` works in Expo Go and returns guided discovery data
  - candidate pool / preview data are coming back
  - finalize hardening fixes have now landed in the mobile hook/harness
  - tapping `Show focused picks` is still the only active Phase 3 investigation path
  - bundle/export sanity check now passes locally via `npx expo export --platform ios`
  - Expo Go on iPad still needs fresh post-patch verification to confirm whether the previous hang/crash is gone or now turns into a surfaced error/log
- `CLAUDE.md` already captures stack choices and RN replacements.
- The missing "front door" and mobile note stack have now been added:
  - `../AGENTS.md`
  - `current-status.md`
  - this file

## Current known issue
- The main active blocker is the mobile finalize path, not discovery.
- Repro:
  - launch Expo Go on iPad
  - enter a real query
  - tap `Start search`
  - wait for discovery / prompt data
  - tap `Show focused picks`
  - verify whether the new hardening removes the hang/crash or converts it into a visible error/log
- Do not start Phase 4 UI work until this is stabilized.

## Known issues to fix before deeper debugging
- Fix obvious stability bugs first before chasing the crash deeper.
- Highest-priority hardening items:
  - disable `Show focused picks` while finalize is pending so duplicate finalize requests cannot stack
  - make finalize requests abortable / ignorable when a search is reset or superseded
  - hard-cap and validate final results on mobile before rendering
  - guard `candidatePool.candidates` with `Array.isArray(...)` before mapping in finalize merge logic
  - keep the debug harness lightweight; avoid unnecessary heavy inline rendering/stringifying during finalize
- Status of those hardening items now:
  - done: duplicate finalize triggers are disabled in the harness and blocked in the hook while finalize is pending
  - done: active finalize requests now get aborted on reset/new search/unmount and stale finalize success/error handlers are ignored by request id
  - done: finalize/discovery result lists are normalized and capped before render on mobile
  - done: candidate pool is sanitized so `candidates` is always guarded before merge logic touches it
  - done: debug harness no longer stringifies full framing/timing objects inline the old way and now shows lighter summaries

## Current review findings
- Static review did not prove one single root cause yet.
- Highest-probability issue:
  - before the patch, overlapping finalize requests caused by the harness leaving `Show focused picks` active during an in-flight finalize
- Other meaningful risks:
  - stale finalize responses mutating state after reset/new search
  - debug harness rendering more finalize/enrichment payload than the real product flow
  - unsafe assumptions about finalize payload shape and candidate-pool shape
- Current interpretation after the patch:
  - the obvious client-side hardening gaps are addressed
  - if Expo Go still closes on `Show focused picks`, the next debugging pass should focus on the remaining finalize response path and on-device console/native logs rather than basic duplicate-click/state-race issues

## Important files
- `../migration-roadmap.md` — phased build order and file mapping
- `../CLAUDE.md` — stack, commands, RN gotchas
- `phase-3-plan.md` — intended Phase 3 scope and harness behavior
- `../../web/src/components/home/useGuidedSearch.js` — highest-value logic port
- `../../web/src/components/home/resultPresentation.js` — pure presentation-transform logic to reuse
- `../../web/src/contexts/SearchProgressContext.jsx` — reusable context pattern
- `../../web/shared/search-input.js` — shared validation logic candidate

## Migration stance
- Port pure logic first.
- Rebuild UI natively instead of forcing DOM-shaped components into RN.
- Keep note updates small and accurate as phases move.
- If a product decision is unclear, prefer the current web behavior unless the user wants a deliberate mobile divergence.

## If continuing from here
- Use the roadmap phase order.
- Update `current-status.md` whenever a phase meaningfully starts or completes.
- If a mobile-native decision changes how the web flow is translated, record it here so the next chat inherits it.
- Before calling Phase 1 complete, run `npx expo start` and verify the placeholder screen renders.
- Phase 1 has been runtime-verified in Expo Go on iPad.
- Before calling Phase 2 complete, verify Home -> About navigation in Expo Go.
- Treat Phase 3 as partially implemented but not exit-ready.
- The known hardening issues listed above have been implemented.
- Next step is device verification of the patched finalize path in Expo Go on iPad:
  - run `npx expo start --clear` from `mobile/`
  - reproduce `Start search` -> wait for discovery/refine -> tap `Show focused picks` once
  - if it succeeds, verify final results stay capped at 6 and retry still works
  - if it fails, capture the Metro log lines beginning with `[mobile-guided-search]` plus any Expo/native redbox or device console output
  - especially note whether `finalize started` logs appear without a matching `finalize payload received`, or whether a surfaced timeout/server error now appears instead of a silent crash
- Keep the work focused on Phase 3 finalize/debug-harness stabilization only.
- Do not begin Phase 4 native UI porting until `Show focused picks` works reliably in Expo Go.
