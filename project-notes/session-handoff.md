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

**The core staged endpoint foundation is mostly done in code, not full web/mobile behavior parity.** Mobile can call discovery, refinement, finalize, enrichment, query-quality suggestion polling, and retry advice through a thin controller with session and stale-response guards. Mobile now also has temporary explicit marketplace-domain selection for the next search, saves that domain preference with AsyncStorage, asks first-run users to choose a store, and provides a basic Settings screen for changing it later. Mobile intentionally does not plan to use geolocation/GPS marketplace detection; keep explicit store choice plus saved preference unless the user explicitly reopens that product decision. That does not mean mobile acts exactly like the web app under the hood. Analytics, broader persistence, follow-up hard-constraint refresh, and the full web guided-flow ergonomics are still missing or deferred. A temporary same-session retry-with-feedback path still exists as the fallback under the newer retry-advice UI, the user reported the original retry smoke test is complete, and the first native detail parity pass is implemented in code.

**The next phase is not "just make it prettier."** The user reported the temporary retry UI smoke test and first product-card smoke test are complete, so work is now in mobile-native result/detail UX vertical slices, adding only the product behaviors each slice needs. Mobile UI/UX is expected to deliberately differ from the web layout — preserve product behavior and trust principles, not the exact web layout.

**What not to do:**
- Do not copy the 1552-line web `useGuidedSearch.js` wholesale. That's what broke `main`. The lesson was not "don't build complex things" — it was "don't port complexity before the foundation is proven."
- Do not assume all web data-path features are done. Add missing product behavior in bounded slices when the mobile UX needs it.
- Do not add analytics, broader persistence, or new marketplace behavior yet.

## Current mobile reality
- Current app root runs `RootNavigator.jsx` inside `SafeAreaProvider`.
- Current screens:
  - Search
  - Follow-up
  - Results
  - SearchResultDetail
  - Home compatibility route that currently renders Search
  - About
  - Contact
  - Privacy
  - Affiliate Disclosure
- The provider-backed search flow is now split across Search, Follow-up, and Results:
  - `SearchScreen` has the product query input, active search button, Settings navigation, first-run Amazon store prompt, and search status summary.
  - `FollowUpScreen` has the refinement prompt, follow-up notes input, `Show focused picks` action, and `Skip - show results` action.
  - `ResultsScreen` has the combined results checkpoint, tiny preview capped at 3 normalized preview results, focused-pick metadata rows capped at 6, retry feedback box, and focused-pick detail navigation.
  - `SearchResultDetailScreen` remains the focused-pick detail destination using already-normalized rank, title, source/provider, price, rating, review count, image/link, explanation, caveat, and feature-note metadata; it receives `candidateId` and rank from Results and looks up the current item from the shared search flow, with a legacy route-item fallback. The first native detail parity pass now shows web-modal-equivalent content in a native order: image/fallback, rank/source/price/rating/review overview, feature bullets, retailer CTA/disclosure, pricing caveat, at-a-glance metadata, and fit/caveat decision notes.
- Focused picks on the Results screen now use mobile-native tappable product cards built from the same normalized on-device fields plus merged candidate image/link data when discovery/finalize IDs match; discovery preview rows, controller state ownership, backend request shapes, retry behavior, enrichment polling, and `candidateId` detail lookup are unchanged.
- The first product-card slice passed `node --check` for touched `.js` files and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. The user reported the Expo Go smoke test worked: focused picks render as mobile-native product cards, images/fallbacks behave correctly, tapping card/details opens `SearchResultDetailScreen`, `View retailer` opens the retailer URL, and retry replacement cards still work.
- Search endpoint calls, JSON/HTML response guarding, API base URL checks, and result normalization now live in `src/search/searchApi.js`.
- The temporary search phase/state orchestration now lives in `src/search/useMobileSearchController.js`; `SearchFlowProvider` exposes one shared hook instance to the Search, Follow-up, and Results route screens.
- The hook path was manually verified in Expo Go by the user after a local Android Metro export/bundle check.
- The lighter Home search/refine/results scaffold has passed a local Android Metro export/bundle check and was manually verified in Expo Go by the user.
- The temporary preview and focused-pick row rendering helpers now live in `src/search/SearchResultRows.jsx`.
- Preview and focused-pick rendering now sit behind `src/search/SearchResultsSection.jsx`, which owns the current focused results slice.
- The plain focused-pick detail screen now lives in `src/screens/SearchResultDetailScreen.jsx` and uses only normalized finalize metadata already on device.
- The focused-pick detail snapshot, metadata rows, explanation/caveat fallback sections, and feature-note rendering now live in `src/search/SearchResultDetailMetadata.jsx`.
- The extracted result-row module and plain focused-pick detail screen were manually verified in Expo Go by the user:
  - search
  - focused picks render
  - tapping a focused-pick row opens `SearchResultDetailScreen`
  - Back returned to the search flow with results still visible in the earlier one-screen scaffold
- The temporary product query input, search button, and Settings button presentation now live in `src/search/SearchEntrySection.jsx`.
- Search flow state is now provided by `src/search/SearchFlowContext.jsx`; `SearchFlowProvider` currently only calls the existing `useMobileSearchController()` hook, and the split search screens read that state with `useSearchFlow()`.
- The split-screen search flow passed `node --check src/search/useMobileSearchController.js` and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Manual Expo Go verification is still pending.
- The user-facing search status summary and expandable diagnostics now live in `src/search/SearchProgressStatus.jsx`.
- The temporary refine prompt, notes input, and finalize button presentation now live in `src/search/SearchRefineSection.jsx`.
- The focused results slice keeps backend contracts unchanged, keeps final rows capped at 6, improves the plain list with clearer metadata labels and tap affordance, and still uses the existing detail navigation.
- The latest focused results slice passed a local JSX parser check and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- The controller now exposes in-memory phase events for `discover`, `refine`, and `finalize`; the Progress panel renders them as running/complete/failed with small timing/count details.
- Phase events are diagnostic UI only and sit behind the search status Details reveal. There is still no analytics, broad persistence, or copied web hook.
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
- Mobile now has a temporary explicit Amazon store preference flow:
  - `src/search/amazonMarketplaces.js` mirrors the supported marketplace domain list from the web shared helper
  - `SearchEntrySection.jsx` keeps the Search screen focused on query entry and Settings navigation; the inline marketplace selector has moved out of the main search surface
  - `discoverProducts` sends `amazonDomain` on `GET /api/search/rainforest-discover`
  - discovery stores the requested/resolved `amazonDomain` on the active search session
  - `AsyncStorage` stores the selected domain under `focamai_marketplace` and reloads it on app startup
  - `AsyncStorage` tracks the first-run prompt under `focamai_marketplace_asked`
  - `MarketplacePromptSection.jsx` asks first-run users to choose a store before searching without requesting GPS/location permission
  - `SettingsScreen.jsx` lets users change the saved store later, passes the changed domain back to Home, and owns secondary utility/legal navigation
  - finalize forwards the active session's Amazon domain, and post-finalize enrichment polling calls `GET /api/search/enrich` with discovery token, submitted query, and session domain
  - changing the store while a search is active clears marketplace-scoped results, cancels stale in-flight responses, keeps the typed query, and asks the user to search again
  - mobile intentionally does not plan to use geolocation or GPS-based marketplace detection; keep mobile on explicit store choice plus saved preference unless the user explicitly reopens that product decision
  - this is not the full web marketplace behavior: no automatic active-search restart when the store changes
- The explicit marketplace-domain slice passed `node --check` for touched JS files and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Manual Expo Go verification is still pending.
- The Home focus cleanup removed the temporary inline Amazon store selector from `SearchEntrySection.jsx`; store preference changes now live in Settings, while the first-run store prompt still appears before searching when needed.
- The latest Home focus cleanup had no touched `.js` files for `node --check`; `index.js` still passed `node --check`, and `npx expo export --platform android --output-dir .expo-export-check` passed; `.expo-export-check` was removed afterward.
- The Home status cleanup made `SearchProgressStatus.jsx` default to a plain user-facing state message and moved API base, token, timing, candidate counts, and phase events into an expandable Diagnostics section.
- The latest Home status cleanup had no newly touched `.js` files for `node --check`; `index.js` and the already-modified `App.js` both passed `node --check`, and `npx expo export --platform android --output-dir .expo-export-check` passed; `.expo-export-check` was removed afterward.
- Enrichment polling is guarded by request id and a 30 second timeout, records an `enrich` phase event, and merges `fit_reason`, `caveat`, and `feature_bullets` into focused picks by candidate id.
- Focused-pick rows can show a one-line `fit_reason` preview, and `SearchResultDetailScreen` now shows `Why this pick`, `Worth knowing`, and feature-note sections with calm fallback copy when enrichment data is absent.
- The focused-pick detail destination is now a more complete mobile-native destination using only normalized focused-pick fields already passed through navigation: rank, title, source/provider, price, rating, review count, `fit_reason`, `caveat`, and `feature_bullets`.
- The latest focused-pick detail slice had no touched `.js` files for `node --check`; `index.js` still passed `node --check`, and `npx expo export --platform android --output-dir .expo-export-check` passed; `.expo-export-check` was removed afterward.
- The focused-pick detail/CTA slice now makes `SearchResultDetailScreen` show the product image/fallback, a retailer CTA when a link exists, an unavailable-link state when it does not, and a pricing/availability caveat before the existing at-a-glance, fit reason, caveat, and feature metadata. It keeps using the shared search-flow lookup by `candidateId`, preserves the 6-result cap, and does not change backend contracts or controller flow.
- The focused-pick detail/CTA slice passed `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Direct `node --check` on touched `.jsx` files is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- The Amazon affiliate disclosure slice now shows `As an Amazon Associate I earn from qualifying purchases.` near outbound retailer CTAs on both focused-pick cards and the detail screen. The CTA label remains vendor-agnostic as `View retailer`, and no backend contracts, controller flow, affiliate-tag logic, or multi-retailer behavior changed.
- The Amazon affiliate disclosure slice passed `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- Query-quality suggestion polling is now implemented as a bounded mobile product-behavior slice:
  - `src/search/searchApi.js` calls `GET /api/search/query-quality` with discovery token, submitted query, and Amazon domain
  - `src/search/useMobileSearchController.js` starts best-effort polling after discovery returns a valid token, records a `queryQuality` phase event, ignores stale responses when a newer search starts, times out quietly, and keeps the original search uninterrupted when the endpoint returns no suggestion or errors
  - `src/search/QuerySuggestionPrompt.jsx` renders a small follow-up-screen prompt when the backend returns a confident suggested query
  - `Try suggested search` starts a fresh discovery/refine pass for the suggested query while preserving existing backend contracts and the 6-result cap
  - `Keep these results` dismisses the suggestion and keeps the current discovery/refine flow
- The query-quality suggestion slice passed `node --check src/search/useMobileSearchController.js`, `node --check src/search/searchApi.js`, `node --check src/search/searchPhaseEvents.js`, `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Direct `node --check` on touched `.jsx` files is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- The native detail parity slice keeps the native stack detail screen instead of copying the web modal layout. It adds a clearer detail overview and feature-highlight section, formats rating/review values on device, keeps calm fallback copy when feature/fit/caveat enrichment is absent, and preserves the existing candidate-id lookup, retailer CTA/disclosure, pricing/availability caveat, retry behavior, query-quality polling, controller flow, backend contracts, and 6-result cap.
- The native detail parity slice passed `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Direct `node --check` on touched `.jsx` files is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- The detail enrichment fix now polls `GET /api/search/enrichment` instead of `/api/search/enrich`, preserves finalize `fitReason`/`featureBullets` camelCase data, and merges enrichment entries by `candidate_id`, `candidateId`, or `id`. If the detail screen lacks AI fit reasons, caveats, or feature bullets, verify this path first.
- The detail enrichment fix passed `node --check src/search/searchApi.js`, `node --check src/search/useMobileSearchController.js`, `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- The enrichment/domain slice passed `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- Temporary same-session retry with feedback exists in code:
  - `src/search/searchApi.js` sends retry finalize requests with `requestMode: "guided_retry"`, feedback, retry count, and excluded current focused-pick IDs
  - `src/search/useMobileSearchController.js` keeps retry state, blocks overlapping finalize requests, reuses the current discovery session, stops enrichment polling before retry finalize, replaces the shortlist on success, and restarts enrichment polling when needed
  - `src/search/SearchRetrySection.jsx` keeps same-session retry as the fallback action below the retry-advice path
  - retry usage is capped at 2 and retry finalize attempts appear as separate phase events
- The retry-with-feedback slice passed `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. The user reported the retry smoke test is complete, and the next work has moved into mobile-native result cards.
- A bounded mobile-native retry-advice path is now implemented:
  - `src/search/searchApi.js` calls `POST /api/search/retry-advice` with submitted query, follow-up notes, rejection feedback, and current shortlist titles
  - `src/search/useMobileSearchController.js` keeps retry-advice state separate from same-session retry, ignores stale advice after feedback/results/search changes, and starts accepted suggestions as fresh guided searches with discovery `cacheMode=refresh`
  - `src/search/SearchRetrySection.jsx` keeps the retry feedback box as the entry point, adds quick correction chips, shows suggested query/rationale when available, supports `Search this`, supports editing the suggestion first, and shows lightweight `Keeping:` reassurance tags
  - if retry advice fails or returns no suggestion, the same-session `Retry these picks instead` path remains available
  - backend contracts, explicit marketplace choice, saved store preference, query-quality polling, enrichment polling, candidate-id detail lookup, retailer CTA/disclosure, and the 6-result cap are unchanged
- The retry-advice slice passed `node --check src/search/useMobileSearchController.js`, `node --check src/search/searchApi.js`, `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- Discovery-only backend access has been verified in Expo Go against the local backend using a LAN API base URL.
- Tiny preview rendering has been verified in Expo Go.
- Refinement prompt rendering has been verified in Expo Go.
- Minimal finalize rendering has been verified in Expo Go and is ahead of the previous unstable Phase 3/debug-harness attempt.
- Lightweight final-result metadata rows are implemented and now sit under a plainer focused-picks section.
- Discovery and refinement requests launch together and now update the UI independently; a slow follow-up should no longer delay discovery summary/preview rendering.
- No full guided search logic is active.
- A thin mobile search API helper and mobile controller hook are active, but analytics, persistence, and polished result UI are still deferred.
- No analytics helper is active.
- TanStack Query is installed and `App.js` wraps the app in `QueryClientProvider`, but no existing search code has been migrated to queries.
- Manrope is loaded with `expo-font` before the app tree renders; `Text`/`TextInput` default to Manrope and NativeWind has Manrope font-family aliases for future styling work.
- The scaffold has enough component extraction for now. Future work should move in bounded vertical slices that are larger than one-card cleanup but still avoid broad ports.
- Settings now exists and should be used for secondary preferences, app info, and legal/support links when doing so keeps Search focused on search.
- Prefer next slices that are user-visible native UI work:
  - manual Expo Go verification of the native detail parity slice
  - polished search/refine/results flow
  - follow-up hard-constraint refresh behavior or broader mobile-native flow polish

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
- Next planned slice: verify the native detail parity and retry-advice passes in Expo Go, then return to follow-up hard-constraint refresh behavior.
- Keep the current controller flow, backend contracts, candidate-id lookup, retailer CTA/disclosure, query-quality polling, retry behavior, and 6-result cap while improving detail content/behavior.
- Keep result count capped at 6 and do not add analytics or broad persistence yet.
- `EXPO_PUBLIC_API_BASE_URL` must point to the backend API, not the public frontend site.
- If using the deployed backend, set `EXPO_PUBLIC_API_BASE_URL` to the active Render backend URL and restart Expo with `npx expo start --clear --lan`.
- If using the local backend from a physical device, use the computer's LAN IP, not `localhost`, because `localhost` on the phone means the phone itself.
- When giving the user a run command, say explicitly whether to use normal `npx expo start --lan` or cache-clearing `npx expo start --clear --lan`; prefer normal for ordinary edits and `--clear` for env/package/import changes or stale transform errors.
