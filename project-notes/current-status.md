# Mobile Current Status

## Purpose
- Short current snapshot for future mobile chats.
- Keep this focused on what is true now and where to read details.

## Current state
- Branch `restart/mobile-clean-slate` is a clean restart point for the mobile app.
- Read `project-notes/restart-strategy.md` before rebuilding search behavior; it explains what went wrong in the earlier port and the new small-slice rebuild approach.
- The old guided-search/debug harness has been removed from the active mobile code.
- The app is now only a basic Expo + React Native shell with:
  - NativeWind styling
  - React Navigation stack
  - Search, Follow-up, Results, focused-pick detail, Settings, About, Contact, Privacy, and Affiliate Disclosure screens
  - a provider-backed search flow split across Search, Follow-up, and Results screens
  - a legacy Home route that currently renders the Search screen for compatibility
  - a plain Search screen input with discovery/refine handoff
  - a Settings-owned Amazon store selector that applies to future searches
  - a first-run Amazon store prompt and a basic Settings screen for changing the saved store later
  - Settings links for About, Contact, Privacy, and Affiliate Disclosure so the Search screen stays focused
  - a tiny capped preview of the first few discovery preview results
  - a refinement prompt and local follow-up notes box
  - a combined results checkpoint that owns discovery preview and focused-pick rows together
  - a temporary retry-with-feedback box intended to appear after focused picks
  - calm user-facing search status with expandable diagnostics for phase events and backend details
  - lightweight focused-pick metadata rows capped at 6
  - a plain focused-pick detail screen with rank, title, source/provider, price, rating, review count, explanation fallback sections, caveat fallback sections, and feature notes
- A minimal Maestro smoke-test layer now exists under `maestro/`:
  - `maestro/smoke-shell.yaml` opens the current Expo Go URL, verifies the Search screen, opens Settings, and returns to Search.
  - `maestro/search-live.yaml` is an optional live-backend journey for query -> Follow-up -> focused picks -> detail; keep it separate from stable smoke coverage because it depends on backend/provider/network timing.
  - `maestro/README.md` documents Windows/Android usage with Expo Go and the `EXPO_GO_URL` override.
  - `package.json` has `maestro:smoke`, `maestro:search:live`, and `check:android-export` scripts.
  - Stable test IDs were added to the Search, Settings, Follow-up, Results, first focused-pick, and detail surfaces without changing controller flow, backend contracts, marketplace preference behavior, query-quality polling, enrichment polling, retry paths, candidate-id lookup, retailer CTA/disclosure, or the 6-result cap.
- The backend remains shared with the web app, and mobile now has a minimal discovery/refine/finalize request path.
- The discovery-only slice has been verified in Expo Go against the local backend using a LAN API base URL.
- The tiny capped preview has also been verified in Expo Go.
- The refinement prompt slice has also been verified in Expo Go.
- The minimal finalize slice has also been verified in Expo Go and is ahead of the previous unstable Phase 3/debug-harness attempt.
- The extracted tiny controller hook was manually verified in Expo Go by the user after the local bundle check.
- The reshaped Home search/refine/results scaffold was manually verified in Expo Go by the user.
- The extracted result-row module and plain focused-pick detail screen were manually verified in Expo Go by the user:
  - search
  - focused picks render
  - tapping a focused-pick row opens `SearchResultDetailScreen`
  - Back returned to the search flow with results still visible in the earlier one-screen scaffold
- A focused results slice now owns preview and focused-pick rendering together in `src/search/SearchResultsSection.jsx`.
- The focused results slice keeps backend contracts unchanged, keeps the shortlist capped at 6, uses only existing normalized fields, and still navigates to the existing plain detail screen.
- The latest focused results slice passed a local JSX parser check and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward.
- A lightweight controller phase-event slice records `discover`, `refine`, and `finalize` as running/complete/failed with small timing/count details.
- Phase events are local in-memory controller state only and now sit behind an expandable Diagnostics area in the Home search status panel; there is still no analytics, broad persistence, or copied web hook.
- The latest phase-event slice passed a local JSX parser check and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward.
- A tiny controller cleanup now keeps phase-event construction, replacement, and display formatting in `src/search/searchPhaseEvents.js`.
- The controller cleanup is behavior-preserving and does not change request payloads, result caps, UI ordering, or backend contracts.
- The latest controller cleanup passed a local JSX/parser check and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward.
- A controller session-hardening slice now adds an explicit active search session in `src/search/useMobileSearchController.js` with request id, submitted query, selected/resolved Amazon domain, discovery token, candidate/preview counts, and phase statuses.
- Discovery, refinement, and finalize now use the active session/ref guards so stale responses from older searches cannot replace newer session state.
- Finalize now snapshots the active session before sending, blocks overlapping finalize calls with a ref guard, ignores stale finalize completions, and treats a missing discovery token as an expired-session path.
- The phase-event helper now labels a lightweight `Session` stale event when a new search supersedes in-flight work; events remain diagnostic only.
- The controller session-hardening slice passed local parser checks and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward.
- A small detail-content slice now adds a rank-aware at-a-glance snapshot to `SearchResultDetailScreen`.
- The detail-content slice still uses only already-normalized metadata already passed through navigation: title, source/provider, price, rating, review count, and rank.
- The latest detail-content slice passed a local JSX parser check and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward.
- The controller now propagates the real `amazonDomain` from the discovery response into the active search session and forwards that domain through finalize and enrichment requests.
- Mobile now has a temporary explicit Amazon store preference flow:
  - `src/search/amazonMarketplaces.js` mirrors the supported marketplace domain list from the web shared helper
  - `SearchEntrySection.jsx` keeps the Search screen focused on query entry and Settings navigation; the inline marketplace selector has moved out of the main search surface
  - `discoverProducts` sends `amazonDomain` on `GET /api/search/rainforest-discover`
  - the active search session stores the requested/resolved domain and reuses it for finalize and enrichment
  - `AsyncStorage` stores the selected domain under `focamai_marketplace` and reloads it on app startup
  - `AsyncStorage` tracks the first-run prompt under `focamai_marketplace_asked`
  - `MarketplacePromptSection.jsx` asks first-run users to choose a store before searching without requesting GPS/location permission
  - `SettingsScreen.jsx` lets users change the saved store later, passes the changed domain back to Home, and owns secondary utility/legal navigation
  - changing the store while a search is active clears marketplace-scoped results, cancels stale in-flight responses, keeps the typed query, and asks the user to search again
  - mobile intentionally does not plan to use geolocation or GPS-based marketplace detection; keep mobile on explicit store choice plus saved preference unless the user explicitly reopens that product decision
  - this is not the full web marketplace behavior: no automatic active-search restart when the store changes
- The explicit marketplace-domain slice passed `node --check` for touched JS files and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward. Manual Expo Go verification is still pending.
- Enrichment polling is now implemented as a guarded best-effort post-finalize path:
  - it polls `GET /api/search/enrich` with discovery token, submitted query, and session Amazon domain
  - it merges `fit_reason`, `caveat`, and `feature_bullets` into focused picks by candidate id
  - it records an `enrich` phase event as running, complete, or timeout without blocking the existing shortlist UI
- The focused-pick list can now show a one-line `fit_reason` preview, and the detail screen shows `Why this pick`, `Worth knowing`, and feature-note sections with calm fallback copy when enrichment fields are absent.
- The enrichment/domain slice passed `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward.
- The focused-pick detail destination is now a more complete mobile-native detail screen using only normalized focused-pick fields already passed through navigation: rank, title, source/provider, price, rating, review count, `fit_reason`, `caveat`, and `feature_bullets`.
- Focused-pick detail navigation now passes `candidateId` and `rank`; `SearchResultDetailScreen` looks up the current item from the shared search flow, with a legacy route-item fallback, so late enrichment can hydrate the detail view without moving search logic into the screen.
- The latest focused-pick detail slice had no touched `.js` files for `node --check`; `index.js` still passed `node --check`, and `npx expo export --platform android --output-dir .expo-export-check` passed; the temporary export directory was removed afterward.
- A temporary same-session retry-with-feedback path exists after focused picks:
  - `finalizeSearch` accepts `excludedCandidateIds`, `rejectionFeedback`, and `retryCount`, and sends `requestMode: "guided_retry"` when retry count is above zero
  - `useMobileSearchController.js` keeps same-session retry state, blocks overlapping finalize calls, stops enrichment polling before retry finalize, excludes the currently displayed focused-pick IDs, and replaces the shortlist on success
  - retry attempts are capped at 2 and render as separate finalize phase events in the Progress panel
  - `SearchRetrySection.jsx` renders the plain feedback input, disabled-state button, and retry usage note below focused results
- The retry-with-feedback slice passed `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward. The user reported the retry smoke test is complete, so the next work has moved into mobile-native results/product-card slices.
- A bounded mobile-native retry-advice path now wraps the existing retry feedback box:
  - `src/search/searchApi.js` calls `POST /api/search/retry-advice` with the submitted query, follow-up notes, rejection feedback, and current shortlist titles
  - `src/search/useMobileSearchController.js` keeps retry-advice state separate from same-session retry, ignores stale advice after feedback/results/search changes, and starts accepted suggestions as fresh guided searches with discovery `cacheMode=refresh`
  - `src/search/SearchRetrySection.jsx` keeps the retry feedback box as the entry point, adds quick correction chips, shows the suggested query/rationale when available, supports `Search this`, supports editing the suggested query before searching, and shows lightweight `Keeping:` reassurance tags
  - if retry advice fails or returns no suggested query, the existing same-session `Retry these picks instead` fallback remains available
  - backend contracts, explicit marketplace choice, saved store preference, query-quality polling, enrichment polling, candidate-id detail lookup, retailer CTA/disclosure, and the 6-result cap are unchanged
- The mobile retry-advice slice passed `node --check src/search/useMobileSearchController.js`, `node --check src/search/searchApi.js`, `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Direct `node --check` on touched `.jsx` files is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- Discovery and refinement requests are still launched together, but the UI now updates each one independently so a slow follow-up question does not block discovery rendering.
- The mobile app still does not run the full guided flow: product-card imagery, card-level retailer CTAs, the first focused-pick detail CTA slice, and query-quality suggestion polling are implemented, while analytics, broad persistence, richer detail parity, and richer guided-flow ergonomics are still inactive.
- The old one-screen Home search/refine/results scaffold has been split into separate `SearchScreen`, `FollowUpScreen`, and `ResultsScreen` routes using the shared search flow provider. This is still scaffold UI, not the intended final mobile UX.
- A tiny mobile search controller hook now owns the scaffold's query, phase loading flags, discovery/refine orchestration, follow-up notes, and finalize result state around `src/search/searchApi.js`, and the hook instance is shared across the search stack through `SearchFlowProvider`.
- The hook path and lighter Home scaffold have passed local Android Metro export/bundle checks with `npx expo export --platform android`.
- The search entry card is now extracted into a small presentational component; behavior is unchanged and still uses the controller state/handlers.
- The refine section is now extracted into a small presentational component; behavior is unchanged and still uses the controller state/handlers.
- The plain focused-pick detail screen is implemented and manually verified in Expo Go.
- The detail screen metadata rows are now extracted into a tiny helper component; the screen still shows only existing normalized metadata.
- The temporary scaffold has enough component extraction for now. Do not keep doing micro-extractions unless they directly support a real mobile UX/data slice.
- A provider-only search flow context now lives in `src/search/SearchFlowContext.jsx`; it simply exposes the existing `useMobileSearchController()` state through `SearchFlowProvider`, and the split search screens consume it with `useSearchFlow()` so search state lives above individual route screens.
- The search flow now has separate route screens:
  - `src/screens/SearchScreen.jsx` owns query entry, first-run marketplace prompt, Settings navigation, and search submission into Follow-up.
  - `src/screens/FollowUpScreen.jsx` owns the refine prompt, follow-up notes, finalize action, and a skip action that finalizes without notes.
  - `src/screens/ResultsScreen.jsx` owns preview/focused result rendering, retry feedback, and focused-pick detail navigation.
  - `src/screens/HomeScreen.jsx` is now only a compatibility export of `SearchScreen`.
- The split-screen search flow passed `node --check src/search/useMobileSearchController.js` and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward. Manual Expo Go verification is still pending.
- Focused picks in `ResultsScreen` now render as mobile-native tappable product cards instead of plain list rows. The controller preserves the discovery candidate pool and `normalizeFinalResults` merges finalized picks with candidate image/link data when IDs match. Cards can show product imagery with a fallback, source/provider, price, rating, review count, fit/caveat copy, a detail affordance, and a short retailer CTA when a link is available. Discovery preview rows, controller ownership, request shapes, retry behavior, enrichment polling, and `candidateId` detail navigation are unchanged.
- The first product-card slice passed `node --check` for touched `.js` files and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward. The user reported the Expo Go smoke test worked: focused picks render as mobile-native product cards, image fallbacks behave correctly, tapping card/details opens `SearchResultDetailScreen`, `View retailer` opens the retailer URL, and retry replacement cards still work.
- The focused-pick detail/CTA slice now makes `SearchResultDetailScreen` show the product image/fallback, a retailer CTA when a link exists, an unavailable-link state when it does not, and a pricing/availability caveat before the existing at-a-glance, fit reason, caveat, and feature metadata. It keeps using the shared search-flow lookup by `candidateId`, preserves the 6-result cap, and does not change backend contracts or controller flow.
- The focused-pick detail/CTA slice passed `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward. Direct `node --check` on the touched `.jsx` file is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- The Amazon affiliate disclosure slice now shows `As an Amazon Associate I earn from qualifying purchases.` near outbound retailer CTAs on both focused-pick cards and the detail screen. The CTA label remains vendor-agnostic as `View retailer`, and no backend contracts, controller flow, affiliate-tag logic, or multi-retailer behavior changed.
- The Amazon affiliate disclosure slice passed `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward.
- Query-quality suggestion polling is now implemented as a bounded mobile product-behavior slice:
  - `src/search/searchApi.js` calls `GET /api/search/query-quality` with discovery token, submitted query, and Amazon domain
  - `src/search/useMobileSearchController.js` starts best-effort polling after discovery returns a valid token, records a `queryQuality` phase event, ignores stale responses when a newer search starts, times out quietly, and keeps the original search uninterrupted when the endpoint returns no suggestion or errors
  - `src/search/QuerySuggestionPrompt.jsx` renders a small follow-up-screen prompt when the backend returns a confident suggested query
  - `Try suggested search` starts a fresh discovery/refine pass for the suggested query while preserving existing backend contracts and the 6-result cap
  - `Keep these results` dismisses the suggestion and keeps the current discovery/refine flow
- The query-quality suggestion slice passed `node --check src/search/useMobileSearchController.js`, `node --check src/search/searchApi.js`, `node --check src/search/searchPhaseEvents.js`, `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward. Direct `node --check` on touched `.jsx` files is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- The native detail parity slice now keeps `SearchResultDetailScreen` as a stack destination while moving closer to the web `ProductDetailModal` content order: image/fallback, rank/source/price/rating/review overview, feature bullets with fallback copy, retailer CTA, affiliate disclosure, pricing/availability caveat, at-a-glance metadata, and fit/caveat decision notes. It uses only already-normalized focused-pick fields and device-derived formatting; backend contracts, controller flow, candidate-id lookup, retailer CTA behavior, retry behavior, query-quality polling, and the 6-result cap are unchanged.
- The native detail parity slice passed `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward. Direct `node --check` on touched `.jsx` files is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- The detail enrichment fix now polls the active web/backend `GET /api/search/enrichment` endpoint instead of the non-existent `/api/search/enrich` path, preserves finalize `fitReason`/`featureBullets` camelCase data during normalization, and merges enrichment entries by `candidate_id`, `candidateId`, or `id`. This is the fix for detail screens not showing AI fit reasons, caveats, or feature bullets after the native detail parity pass.
- The detail enrichment fix passed `node --check src/search/searchApi.js`, `node --check src/search/useMobileSearchController.js`, `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; the temporary export directory was removed afterward.
- Current work is proving the core staged endpoint flow and native rendering safety first; final mobile UI/UX can deliberately diverge from the web layout after that foundation is stable. This does not mean mobile has web feature parity.
- Mobile UI/UX is expected to be redesigned after endpoint flow is proven; do not treat the web UI as the target layout, only as the product behavior reference.
- Settings now exists and should be used for secondary preferences, app info, and legal/support links when doing so keeps Search focused on search.
- Home no longer renders the temporary inline Amazon store selector. Store changes now live in Settings, while the first-run store prompt still appears before searching when needed.
- The latest Home focus cleanup had no touched `.js` files for `node --check`; `index.js` still passed `node --check`, and `npx expo export --platform android --output-dir .expo-export-check` passed; the temporary export directory was removed afterward.
- Home search status now defaults to a plain user-facing state message and keeps API base, token, timing, candidate counts, and phase events inside a Details/Diagnostics reveal.
- The latest Home status cleanup had no newly touched `.js` files for `node --check`; `index.js` and the already-modified `App.js` both passed `node --check`, and `npx expo export --platform android --output-dir .expo-export-check` passed; the temporary export directory was removed afterward.
- The intended rebuild path is a happy middle: use web as the behavior/request contract, then build a small mobile-native search data/controller layer and bounded vertical UI slices instead of copying the full web hook or staying in tiny endpoint-test mode forever.
- Web/product truth still lives in `../web/project-notes/`.

## Current implementation reality
- Kept:
  - `App.js`
  - Expo config and assets
  - NativeWind/Metro/Babel/Tailwind setup
  - `src/navigation/RootNavigator.jsx`
  - basic route screens in `src/screens/`
- Added during the restart rebuild:
  - `src/screens/SearchScreen.jsx`, `src/screens/FollowUpScreen.jsx`, and `src/screens/ResultsScreen.jsx` split the plain mobile search/refine/results scaffold across stack routes while sharing one controller instance through `SearchFlowProvider`.
  - `src/screens/HomeScreen.jsx` remains as a compatibility export of `SearchScreen`.
  - `src/search/useMobileSearchController.js` can call `GET /api/search/rainforest-discover` for one query and expose a small response summary.
  - `src/search/SearchEntrySection.jsx` owns the temporary product query input, search button, and Settings navigation button presentation.
  - `src/search/SearchProgressStatus.jsx` owns the user-facing search status summary and expandable diagnostics so HomeScreen stays focused on screen composition.
  - `src/search/SearchRefineSection.jsx` owns the temporary refine prompt, notes input, and finalize button presentation.
  - `src/search/SearchRetrySection.jsx` owns the temporary retry feedback input, retry button, and retry usage note.
  - The hook exposes a tiny preview capped at 3 normalized items from `previewResults`.
  - The hook also calls `GET /api/search/refine` in parallel and exposes the follow-up prompt plus local notes state.
  - The hook can call `POST /api/search/finalize` with minimal guided payload and expose final results capped at 6.
  - Results now renders lightweight final-result metadata rows with rank, title, source/provider, price, rating, and review count, still capped at 6.
  - The search stack composes entry, progress, preview, refine, retry, and focused-pick sections instead of one Home screen owning every presentation detail inline.
  - `src/search/SearchResultRows.jsx` owns the temporary preview and focused-pick row rendering helpers so HomeScreen owns less presentation detail.
  - `src/search/SearchResultsSection.jsx` owns the current focused results slice by rendering discovery preview and focused picks in one checkpoint using existing normalized fields and detail navigation.
  - `src/search/useMobileSearchController.js` exposes a small `phaseEvents` array for the current in-memory search path.
  - `src/search/useMobileSearchController.js` also owns the active in-memory search session and stale-response guards for discovery, refinement, and finalize.
  - `src/search/searchPhaseEvents.js` owns tiny helpers for creating/replacing/displaying phase-event state.
  - `src/search/SearchProgressStatus.jsx` renders those phase events inside the existing progress scaffold.
  - `src/screens/SearchResultDetailScreen.jsx` shows a non-rich detail view for a focused pick using only the normalized result fields already returned by finalize and enrichment.
  - `src/search/SearchResultDetailMetadata.jsx` owns the detail snapshot, metadata rows, explanation/caveat fallback sections, feature-note rendering, and fallback formatting.
  - `src/navigation/RootNavigator.jsx` includes the `SearchResultDetail` stack route.
  - `src/search/searchApi.js` now owns the temporary search endpoint calls, JSON/HTML response guard, API base URL check, and preview/final result normalization.
- Removed from active mobile code:
  - guided search hook
  - result presentation helpers
  - search progress context
  - analytics helper
  - copied shared search-input helper
  - finalize/debug investigation notes
  - EAS/dev-client setup

## Current dependencies
- The dependency set is intentionally small for the restart.
- Kept core app dependencies:
  - Expo
  - React Navigation
  - NativeWind
  - TanStack Query provider at the app root, currently available but not used by search logic
  - Expo Font with Manrope loaded before the app tree renders
  - React Native Reanimated
  - Safe Area Context
  - AsyncStorage for saved marketplace-domain preference
- Removed old Phase 3/debug dependencies for now:
  - Expo Constants
  - Expo Crypto
  - Expo Linking
  - Expo Dev Client
  - lucide-react-native

## Product direction to preserve later
- Calm, focused, mobile-first product feel
- Search-first entry point
- Guided product flow when it is rebuilt
- 6-result shortlist
- Trusted-assistant explanation tone
- Vendor-agnostic product shape
- Mobile does not need to copy the web UI/UX 1:1; preserve product behavior and trust principles, then design the native experience intentionally.

## Phase status

The small-slice core staged endpoint foundation is mostly complete in code. Discovery, refinement, finalize, explicit marketplace-domain selection with saved preference, first-run prompt, Settings change path, marketplace-change invalidation, session hardening, stale-response guards, enrichment polling, temporary same-session retry fallback, product-card/detail CTAs, affiliate disclosure near CTAs, query-quality suggestion polling, web-style retry advice, and the first native detail parity pass are working through the mobile controller/UI. This is not full web/mobile behavior parity. Mobile geolocation marketplace detection is intentionally not planned; mobile should keep explicit store choice instead. Analytics, broader persistence, and the full web guided-flow ergonomics are still missing or deferred.

The current phase is mobile-native search/refine/results work. The first detail parity pass is implemented in code, and the next step is device verification of the detail screen's image fallback, overview metadata, feature fallback, retailer CTA/disclosure, pricing caveat, and late enrichment hydration through `candidateId` lookup.

## Recommended next step

Next planned slice: run the new Maestro shell smoke locally on Android/Expo Go, then verify the native detail parity and retry-advice passes in Expo Go before returning to follow-up hard-constraint refresh or broader mobile-native flow polish.
- Keep the native stack detail screen pattern.
- Preserve the current controller flow, backend contracts, candidate-id lookup, retailer CTA/disclosure, query-quality polling, retry behavior, and 6-result cap.
- Add only detail content/behavior that already exists in normalized finalize/enrichment data or can be safely derived on device.

## Environment notes
- `EXPO_PUBLIC_API_BASE_URL` must point to the backend API, not the public frontend site.
- Do not fall back to `https://focamai.com` for mobile API requests; that returns frontend HTML for unknown API paths.
- If using the deployed backend, set `EXPO_PUBLIC_API_BASE_URL` to the active Render backend URL and restart Expo with `--clear`.
- If using the local backend from a physical device, use the computer's LAN IP, not `localhost`, because `localhost` on the phone means the phone itself.
