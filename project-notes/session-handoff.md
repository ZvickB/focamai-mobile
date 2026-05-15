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

**The core staged endpoint foundation is mostly done in code, not full web/mobile behavior parity.** Mobile can call discovery, refinement, finalize, and enrichment through a thin controller with session and stale-response guards. Mobile now also has temporary explicit marketplace-domain selection for the next search, saves that domain preference with AsyncStorage, asks first-run users to choose a store, and provides a basic Settings screen for changing it later. That does not mean mobile acts exactly like the web app under the hood. Geolocation marketplace detection, query-quality suggestions, retry-advice, analytics, broader persistence, rich product cards, external retailer CTAs, and the full web guided-flow ergonomics are still missing or deferred. A temporary same-session retry-with-feedback path exists in code, but it has not been manually verified in Expo Go and should not be treated as complete product behavior yet.

**The next phase is not "just make it prettier."** First confirm whether the temporary retry UI appears after focused picks and whether its request path works in Expo Go. After that, build mobile-native product cards and the search/refine/results UX in vertical slices, adding only the product behaviors each slice needs. Mobile UI/UX is expected to deliberately differ from the web layout — preserve product behavior and trust principles, not the exact web layout.

**What not to do:**
- Do not copy the 1552-line web `useGuidedSearch.js` wholesale. That's what broke `main`. The lesson was not "don't build complex things" — it was "don't port complexity before the foundation is proven."
- Do not assume all web data-path features are done. Add missing product behavior in bounded slices when the mobile UX needs it.
- Do not add analytics, persistence, or marketplace preferences yet.

## Current mobile reality
- Current app root runs `RootNavigator.jsx` inside `SafeAreaProvider`.
- Current screens:
  - Home
  - About
  - Contact
  - Privacy
  - Affiliate Disclosure
- Home currently has:
  - simple product query input
  - active search button
  - Settings navigation button
  - first-run Amazon store prompt when no saved store/prompt state exists
  - temporary horizontal Amazon store selector
  - small progress snapshot
  - lightweight phase events for `discover`, `refine`, and `finalize`
  - discovery response summary with candidate count, preview count, source, timing, and token status
  - combined results checkpoint with tiny preview capped at 3 normalized preview results
  - refinement prompt and local follow-up notes box
  - minimal `Show focused picks` button that renders focused-pick metadata rows capped at 6
  - temporary retry feedback box intended to appear after focused picks with a `Try again` button and 2-retry cap
  - plain focused-pick detail navigation from a result row
  - detail screen at-a-glance snapshot using only already-normalized metadata
- Search endpoint calls, JSON/HTML response guarding, API base URL checks, and result normalization now live in `src/search/searchApi.js`.
- The temporary search phase/state orchestration now lives in `src/search/useMobileSearchController.js`; HomeScreen mostly renders the scaffold UI around that hook.
- The hook path was manually verified in Expo Go by the user after a local Android Metro export/bundle check.
- The lighter Home search/refine/results scaffold has passed a local Android Metro export/bundle check and was manually verified in Expo Go by the user.
- The temporary preview and focused-pick row rendering helpers now live in `src/search/SearchResultRows.jsx`.
- Preview and focused-pick rendering now sit behind `src/search/SearchResultsSection.jsx`, which owns the current focused results slice.
- The plain focused-pick detail screen now lives in `src/screens/SearchResultDetailScreen.jsx` and uses only normalized finalize metadata already on device.
- The temporary focused-pick detail snapshot and metadata rows now live in `src/search/SearchResultDetailMetadata.jsx`.
- The extracted result-row module and plain focused-pick detail screen were manually verified in Expo Go by the user:
  - search
  - focused picks render
  - tapping a focused-pick row opens `SearchResultDetailScreen`
  - Back returns to Home with results still visible
- The temporary product query input, search button, and About button presentation now live in `src/search/SearchEntrySection.jsx`.
- The temporary progress/status section now lives in `src/search/SearchProgressStatus.jsx`.
- The temporary refine prompt, notes input, and finalize button presentation now live in `src/search/SearchRefineSection.jsx`.
- The focused results slice keeps backend contracts unchanged, keeps final rows capped at 6, improves the plain list with clearer metadata labels and tap affordance, and still uses the existing detail navigation.
- The latest focused results slice passed a local JSX parser check and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- The controller now exposes in-memory phase events for `discover`, `refine`, and `finalize`; the Progress panel renders them as running/complete/failed with small timing/count details.
- Phase events are diagnostic UI only. There is still no analytics, persistence, query-quality suggestion flow, web-style retry-advice flow, or copied web hook.
- The latest phase-event slice passed a local JSX parser check and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- Phase-event construction, replacement, and display formatting now live in `src/search/searchPhaseEvents.js`; this was a behavior-preserving controller readability cleanup.
- The latest controller cleanup passed a local JSX/parser check and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- The controller session-hardening slice is now implemented in `src/search/useMobileSearchController.js`:
  - the hook tracks an explicit active search session with request id, submitted query, selected/resolved Amazon domain, discovery token, candidate count, preview count, and phase statuses
  - discovery, refinement, and finalize ignore stale responses when a newer search has started
  - finalize snapshots the active session before sending, blocks overlapping finalize calls, ignores stale finalize completions, and treats missing discovery tokens as expired-session errors
  - starting a newer search can add a lightweight `Session` stale phase event for in-flight older work
- The controller session-hardening slice passed local parser checks and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- The detail-content slice adds a rank-aware at-a-glance snapshot to `SearchResultDetailScreen` while still using only title, source/provider, price, rating, review count, and rank.
- The latest detail-content slice passed a local JSX parser check and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- Mobile now has a temporary explicit Amazon store selector:
  - `src/search/amazonMarketplaces.js` mirrors the supported marketplace domain list from the web shared helper
  - `SearchEntrySection.jsx` renders a plain horizontal country-code selector
  - `discoverProducts` sends `amazonDomain` on `GET /api/search/rainforest-discover`
  - discovery stores the requested/resolved `amazonDomain` on the active search session
  - `AsyncStorage` stores the selected domain under `focamai_marketplace` and reloads it on app startup
  - `AsyncStorage` tracks the first-run prompt under `focamai_marketplace_asked`
  - `MarketplacePromptSection.jsx` asks first-run users to choose a store before searching without requesting GPS/location permission
  - `SettingsScreen.jsx` lets users change the saved store later, passes the changed domain back to Home, and owns secondary utility/legal navigation
  - finalize forwards the active session's Amazon domain, and post-finalize enrichment polling calls `GET /api/search/enrich` with discovery token, submitted query, and session domain
  - changing the store while a search is active clears marketplace-scoped results, cancels stale in-flight responses, keeps the typed query, and asks the user to search again
  - this is not the full web marketplace behavior yet: no geolocation and no automatic active-search restart when the store changes
- The explicit marketplace-domain slice passed `node --check` for touched JS files and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Manual Expo Go verification is still pending.
- Enrichment polling is guarded by request id and a 30 second timeout, records an `enrich` phase event, and merges `fit_reason`, `caveat`, and `feature_bullets` into focused picks by candidate id.
- Focused-pick rows can show a one-line `fit_reason` preview, and `SearchResultDetailScreen` can show `Why this pick` and `Worth knowing` rows when enrichment data arrives.
- The enrichment/domain slice passed `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- Temporary same-session retry with feedback exists in code:
  - `src/search/searchApi.js` sends retry finalize requests with `requestMode: "guided_retry"`, feedback, retry count, and excluded current focused-pick IDs
  - `src/search/useMobileSearchController.js` keeps retry state, blocks overlapping finalize requests, reuses the current discovery session, stops enrichment polling before retry finalize, replaces the shortlist on success, and restarts enrichment polling when needed
  - `src/search/SearchRetrySection.jsx` renders the temporary plain retry UI below focused results
  - retry usage is capped at 2 and retry finalize attempts appear as separate phase events
- The retry-with-feedback slice passed `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Manual Expo Go retry verification is still pending, and the user may not currently see the retry UI in-device.
- The active web product uses a richer retry-advice flow that suggests a better next query. That web-style retry-advice flow has not been implemented in mobile yet.
- Discovery-only backend access has been verified in Expo Go against the local backend using a LAN API base URL.
- Tiny preview rendering has been verified in Expo Go.
- Refinement prompt rendering has been verified in Expo Go.
- Minimal finalize rendering has been verified in Expo Go and is ahead of the previous unstable Phase 3/debug-harness attempt.
- Lightweight final-result metadata rows are implemented and now sit under a plainer focused-picks section.
- Discovery and refinement requests launch together and now update the UI independently; a slow follow-up should no longer delay discovery summary/preview rendering.
- No full guided search logic is active.
- A thin mobile search API helper and mobile controller hook are active, but analytics, persistence, and polished result UI are still deferred.
- No analytics helper is active.
- No TanStack Query provider is active.
- The scaffold has enough component extraction for now. Future work should move in bounded vertical slices that are larger than one-card cleanup but still avoid broad ports.
- Settings now exists and should be used for secondary preferences, app info, and legal/support links when doing so keeps Home focused on search.
- Prefer next slices that are user-visible native UI work:
  - real product cards
  - polished search/refine/results flow
  - tighter result/detail UX after retry is smoke-verified in Expo Go

## What was removed
- Phase 3 guided-search hook and debug harness behavior.
- Finalize crash investigation files.
- EAS/dev-client setup.
- Heavy copied web logic that was making the mobile branch feel tangled.

## Migration stance from here
- Keep the shell simple until Expo Go launches cleanly.
- Reintroduce behavior in thin vertical slices.
- Treat the current UI as temporary scaffolding until the endpoint flow is verified.
- Once the core staged endpoint path is stable, design the mobile-native UX intentionally instead of copying the web screens 1:1.
- Preserve web backend contracts and phase order, but do not port the web `useGuidedSearch` implementation as the mobile controller.
- Prefer the current web backend flow when search is rebuilt:
  - discovery
  - refinement
  - finalize
  - enrichment
- Do not start by copying the whole old hook back into mobile.

## Next step
- Continue building mobile search in bounded vertical slices against `src/search/useMobileSearchController.js`.
- Do not keep doing micro-extractions unless they directly support a real mobile UX/data slice.
- Next phase: mobile-native search/refine/results slices with real product cards, while explicitly tracking missing web behaviors instead of assuming parity.
- Before starting redesign, smoke-test or fix the temporary retry UI in Expo Go if possible.
- Keep result count capped at 6 and do not add images, modal/details, analytics, or persistence yet.
- `EXPO_PUBLIC_API_BASE_URL` must point to the backend API, not the public frontend site.
- If using the deployed backend, set `EXPO_PUBLIC_API_BASE_URL` to the active Render backend URL and restart Expo with `npx expo start --clear --lan`.
- If using the local backend from a physical device, use the computer's LAN IP, not `localhost`, because `localhost` on the phone means the phone itself.
- When giving the user a run command, say explicitly whether to use normal `npx expo start --lan` or cache-clearing `npx expo start --clear --lan`; prefer normal for ordinary edits and `--clear` for env/package/import changes or stale transform errors.
