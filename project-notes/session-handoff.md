# Mobile Session Handoff

## Purpose
- Fastest reset for a fresh mobile chat.
- Point to the canonical mobile and web notes without duplicating the whole project.

## Startup read order
1. `../AGENTS.md`
2. `current-status.md`
3. `mobile-ui-ux-plan.md` when doing mobile UI/UX work
4. `../migration-roadmap.md`
5. `../CLAUDE.md`
6. `../../web/project-notes/app_flow.md`
7. `../../web/project-notes/current-status.md`
8. `../../web/project-notes/doc_briefs.md`

## Current direction

`../web` is the Focamai product and brand baseline as well as the product-behavior reference. Mobile should be recognizably aligned with web through local brand assets, Manrope, the teal/orange/warm-neutral family, and calm trusted-assistant voice, but it should not runtime-import from `../web` or treat the web layout as a 1:1 mobile target. Shipping brand assets belong in `mobile/assets/`; the PNG wordmark remains preferred unless branding is intentionally revisited.

**The core staged endpoint foundation is mostly done in code, not full web/mobile behavior parity.** Mobile can call discovery, refinement, finalize, enrichment, query-quality suggestion polling, retry advice, and the follow-up hard-constraint pre-finalize refresh through a thin controller with session and stale-response guards. Mobile now also has temporary explicit marketplace-domain selection for the next search, saves that domain preference with AsyncStorage, asks first-run users to choose a store, and provides a basic Settings screen for changing it later. Mobile intentionally does not plan to use geolocation/GPS marketplace detection; keep explicit store choice plus saved preference unless the user explicitly reopens that product decision. That does not mean mobile acts exactly like the web app under the hood. Analytics, broader persistence, and the full web guided-flow ergonomics are still missing or deferred. A temporary same-session retry-with-feedback path still exists as the fallback under the newer retry-advice UI, the user reported the original retry smoke test is complete, and the first native detail parity pass is implemented in code.

**The next phase is not "just make it prettier."** The user reported the temporary retry UI smoke test and first product-card smoke test are complete, so work is now in mobile-native result/detail UX vertical slices, adding only the product behaviors each slice needs. Mobile UI/UX is expected to deliberately differ from the web layout — preserve product behavior and trust principles, not the exact web layout.

**For UI/UX work, `project-notes/mobile-ui-ux-plan.md` is now the primary implementation-order doc.** It outranks `project-notes/proposed-layout.md` and the PNG mockups for sequencing and screen decisions. `project-notes/mobile-ui-ux-direction.md` remains the principles/taste reference, and the proposed layout plus mockups remain brainstorming inputs only.

**Local repeatable smoke testing is Jest + React Native Testing Library for now.** Maestro files still exist as future Android E2E scaffolding, but the user does not have an Android phone and the emulator is not practical, so do not steer the current workflow through Maestro. Use `npm test` for local component smoke coverage and manual Expo Go for real device/live-backend behavior.

**What not to do:**
- Do not copy the 1552-line web `useGuidedSearch.js` wholesale. That's what broke `main`. The lesson was not "don't build complex things" — it was "don't port complexity before the foundation is proven."
- Do not assume all web data-path features are done. Add missing product behavior in bounded slices when the mobile UX needs it.
- Do not add analytics, broader persistence, or new marketplace behavior yet.

## Current mobile reality
- Current app root runs `RootNavigator.jsx` inside `SafeAreaProvider`.
- Current mobile smoke-test files:
  - `maestro/smoke-shell.yaml`
  - `maestro/search-live.yaml`
  - `maestro/README.md`
  - `src/search/__tests__/SearchEntrySection.test.jsx`
  - `src/search/__tests__/SearchResultsSection.test.jsx`
  - `package.json` scripts: `test`, `maestro:smoke`, `maestro:search:live`, and `check:android-export`
  - Maestro is future Android E2E only unless the user gets an Android target; Jest/RNTL is the practical local repeatable smoke layer.
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
  - marketplace persistence writes the selected domain before marking the first-run prompt seen, so a failed domain write does not permanently suppress the prompt
  - `MarketplacePromptSection.jsx` asks first-run users to choose a store before searching without requesting GPS/location permission
  - first-run store pills are draft-only; `Use [store]` is the actual commit action
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
- The May 19 Results/Picks mockup-structure rebuild is implemented:
  - `ResultsScreen` now uses full-width native phone spacing rather than the centered tablet-style column, with the local PNG wordmark top-left and small top-right New Search, History, and profile/settings actions.
  - The hero follows the reference hierarchy: `Here are your 6 best picks` with the `6` in ember, a short subtitle, and a four-cell criteria bar with placeholder factors (`Lightweight`, `Under $150`, `Travel-friendly`, `Confidence High`).
  - `SearchResultsSection` renders one large featured first-pick card, compact ranked rows for picks 2-6, a `Why these picks?` explanation footer, and the single affiliate/pricing availability note at the bottom instead of repeating disclosure inside every product card.
  - `SearchResultRows` no longer preserves the previous equal-card structure: the first pick visually dominates with a large image, title, reason, attribute chips, price, and `View details`; later picks use rank circles, small images, one-line reasons, price/provider metadata, and a compact confidence/chevron affordance.
  - Backend contracts, controller flow, explicit store preference behavior, query-quality polling, retry advice, enrichment hydration, candidate-id lookup, retailer CTA/disclosure, and retry placement are unchanged.
  - The rebuild verified with `npm test -- --runInBand src/search/__tests__/SearchResultsSection.test.jsx`, `node --check App.js`, `node --check index.js`, and Android Expo export; `.expo-export-check` was removed afterward.
- The Amazon affiliate disclosure slice now shows `As an Amazon Associate I earn from qualifying purchases.` near outbound retailer CTAs on both focused-pick cards and the detail screen. The CTA label remains vendor-agnostic as `View retailer`, and no backend contracts, controller flow, affiliate-tag logic, or multi-retailer behavior changed.
- The Amazon affiliate disclosure slice passed `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- UI/UX Slice 0/Slice 1 is complete:
  - Baseline review confirmed the current stack/controller behavior is still the active foundation.
  - Maestro shell smoke is not part of the current practical workflow because the user does not have an Android phone and the emulator is not practical.
  - `src/components/MobileUI.jsx` now owns the shared visual primitives: screen container, screen intro/section header, button, pill/chip, quiet status panel, surface, and product image frame.
  - `tailwind.config.js` and `RootNavigator.jsx` now use the warm mist/cream/deep-green visual direction from the UI/UX plan.
  - Search, Follow-up, Results, detail, Settings, and static screens consume those shared primitives without changing backend contracts, controller flow, explicit store preference behavior, candidate-id detail lookup, query-quality polling, retry advice, retailer CTA/disclosure, or the 6-result cap.
  - The Slice 1 pass verified with `node --check tailwind.config.js`, `node --check App.js`, `node --check index.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- UI/UX Slice 2 is complete:
  - Results now leads with user-facing `Your focused picks` shortlist copy instead of the old `Results checkpoint` scaffold language.
  - Focused picks render as up to 6 ranked mobile cards with rank, shared image/fallback frame, title, optional provider, price fallback, rating/review metadata, one short fit/caveat/feature preview, `View details`, and the existing retailer CTA/disclosure area.
  - Discovery preview is now secondary behind an early-preview reveal, and retry still sits below the shortlist section.
  - No backend contracts, controller flow, explicit store preference behavior, query-quality polling, retry advice, enrichment hydration, candidate-id lookup, retailer CTA/disclosure, or 6-result cap changed.
  - The Slice 2 pass verified with `npm test -- --runInBand src/search/__tests__/SearchResultsSection.test.jsx` and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. No touched `.js` files required direct `node --check`; touched implementation files were `.jsx`.
- A small branding alignment slice is complete before UI/UX Slice 3:
  - `assets/wordmark.png` is a local copy of the web PNG wordmark and is rendered on the Search screen.
  - NativeWind/navigation brand colors now sit closer to the web baseline: deep teal, secondary teal, orange accent, warm cream/mist backgrounds, and warm borders.
  - This was intentionally not a web-layout copy, and no controller flow, backend contracts, explicit store preference behavior, query-quality polling, retry advice, enrichment hydration, candidate-id detail lookup, retailer CTA/disclosure, or 6-result cap changed.
  - The branding alignment slice passed `node --check tailwind.config.js` and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Direct `node --check` on touched `.jsx` files is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- UI/UX Slice 3 is complete:
  - `SearchResultDetailScreen` remains a native stack screen, not a web modal copy.
  - Detail now leads with image/fallback, product title, price, rating/reviews, rank, and source context, then moves directly into `Why this pick` and `Worth knowing`.
  - Feature notes keep calm fallback copy while enrichment is absent, and late fit/caveat/feature hydration still flows through the existing `candidateId` lookup from the shared search controller.
  - The retailer CTA, pricing/availability note, and affiliate disclosure stay together with retailer-agnostic `View retailer` language.
  - Backend contracts, controller flow, explicit store preference behavior, query-quality polling, retry advice, enrichment hydration, candidate-id lookup, retailer CTA/disclosure, and 6-result cap are unchanged.
  - The Slice 3 detail polish passed `node --check App.js`, `node --check index.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Direct `node --check` on touched `.jsx` files is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- UI/UX Slice 4 is complete:
  - Search keeps the local PNG wordmark, one natural-language input, and a clearer primary `Find focused picks` action.
  - `SearchEntrySection` now has quiet example chips that fill the query, uses the shared secondary button for Settings, and preserves `returnKeyType="search"` plus submit-on-keyboard behavior.
  - A live-verification bug fix makes `SearchEntrySection` keep a local draft query and submit that exact draft to the controller, preventing chip/TextInput state races from starting a new search with the previous query.
  - `SearchScreen` keeps keyboard taps handled and adds extra scroll padding for smaller screens.
  - The first-run store prompt remains inline only when needed, with calmer store-preference copy and accessible marketplace chips.
  - Backend contracts, controller flow, explicit store preference behavior, query-quality polling, retry advice, enrichment hydration, candidate-id lookup, retailer CTA/disclosure, and 6-result cap are unchanged.
  - The Slice 4 search entry polish passed `npm test -- --runInBand src/search/__tests__/SearchEntrySection.test.jsx`, `node --check App.js`, `node --check index.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
  - `react-native-worklets` is now installed because the installed Reanimated 4 package imports it as a peer dependency; it is pinned to the Expo SDK 54 expected version `0.5.1` after Expo LAN startup warned that `0.8.3` was incompatible.
- UI/UX Slice 5 is complete:
  - `FollowUpScreen` keeps the existing native stack flow but now leads with the optional refine question instead of status/diagnostics.
  - `SearchRefineSection` owns both actions in one shared surface: primary `Get focused picks` and secondary `Skip and show results`.
  - The multiline answer input is larger and calmer, prompt-loading/fallback states remain readable, and the skip path remains available when finalization is possible.
  - `QuerySuggestionPrompt` is now a quiet secondary prompt below the refine question, so query-quality suggestions stay visible without interrupting the answer flow.
  - Hard-constraint discovery refresh was intentionally not part of this visual slice, but it has since been implemented as a separate product-completeness slice.
  - Backend contracts, controller flow, explicit store preference behavior, query-quality polling, retry advice, enrichment hydration, candidate-id lookup, retailer CTA/disclosure, and the 6-result cap are unchanged.
  - The Slice 5 follow-up/refine polish passed `npm test -- --runInBand src/search/__tests__/SearchRefineSection.test.jsx`, `node --check App.js`, `node --check index.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- The May 19 Follow-up/Refine direction is implemented as a continuity pass from the calmer Search base:
  - `FollowUpScreen` adds a thin `Search / Refine / Picks` progress cue only after search has started, keeps the original query as a compact orientation pill, and constrains the main column for tablet/iPad.
  - `SearchRefineSection` now reads as one soft elevated assistant-question surface instead of an intro plus form, with less visible copy, a generous native answer field, `Get focused picks`, and calm `Skip and show results`.
  - `QuerySuggestionPrompt` is quieter and secondary; `Try suggested search` remains available but visually de-emphasized.
  - Backend contracts, controller props/actions, skip behavior, query-quality suggestion behavior, hard-constraint refresh behavior, and the 6-result cap are unchanged.
  - This pass verified with `npm test -- --runInBand src/search/__tests__/SearchRefineSection.test.jsx src/search/__tests__/QuerySuggestionPrompt.test.jsx`, `node --check App.js`, `node --check index.js`, and Android Expo export; `.expo-export-check` was removed afterward.
- The Refine mockup redesign pass is now implemented:
  - `FollowUpScreen` uses a small custom header with back/search navigation, centered local PNG wordmark, and quiet icon-only Settings access, and the native stack header is hidden on this route. `SearchScreen` also uses quiet icon-only Settings access instead of a floating circular settings button.
  - The `Search / Refine / Picks` progress cue remains, but the lower Search Status/diagnostics panel is removed from Refine.
  - `SearchRefineSection` now frames the step as collaborative user-driven refinement: product-agnostic heading (`What should Focamai keep in mind?`), support copy, three text-only fallback chips (`Good value`, `Easy to use`, `Fits my space`), search-style notes input with disabled mic affordance, `Update my picks`, and text-only `Skip for now`. The query/orientation pill is intentionally removed to keep the primary and skip actions higher on the screen.
  - Static chip data is intentionally local and injectable through `suggestedRefinements` so later AI-generated refinement chips can be threaded in without redesigning this component. Until AI chips exist, use useful generic fallback chips instead of shimmer/loading chips.
  - Follow-up notes, finalize submission, skip finalize, hard-constraint refresh, backend contracts, controller ownership, and the 6-result cap are unchanged.
  - This pass verified with `npm test -- --runInBand src/search/__tests__/SearchRefineSection.test.jsx`, direct `node --check` on `App.js` and `index.js`, and Android Expo export; `.expo-export-check` was removed afterward.
- UI/UX Slice 6 is complete:
  - `SearchRetrySection` remains below results as recovery, not endless browsing.
  - The retry copy now asks what felt wrong in plain language and makes correction chips quieter so they read as shortcuts, not filters.
  - Retry advice is the primary path: rationale, suggested query, editable query, and `Search this suggestion`.
  - `Keeping` tags remain reassurance only, not a hard lock.
  - Same-session replacement picks remain available as the fallback from the current candidate pool and still depend on a written retry note.
  - Backend contracts, controller flow, explicit store preference behavior, query-quality polling, retry advice, enrichment hydration, candidate-id lookup, retailer CTA/disclosure, and the 6-result cap are unchanged.
  - The Slice 6 retry/recovery polish passed `npm test -- --runInBand src/search/__tests__/SearchRetrySection.test.jsx`, `node --check App.js`, `node --check index.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- UI/UX Slice 7 is complete:
  - `SearchProgressStatus` now uses calm user-facing stage titles: `Finding options`, `Preparing one question`, `Narrowing to six`, `Checking details`, and `Shortlist ready`.
  - Diagnostics remain behind the Details reveal.
  - API-base/HTML backend mistakes are rewritten into readable user-facing copy, while the raw message remains secondary context.
  - `SearchResultsSection` now has a Results-screen empty state and fewer-than-six credible result copy.
  - Backend contracts, controller flow, explicit store preference behavior, query-quality polling, retry advice, enrichment hydration, candidate-id lookup, retailer CTA/disclosure, and the 6-result cap are unchanged.
  - The Slice 7 loading/empty/error-state polish passed `npm test -- --runInBand src/search/__tests__/SearchProgressStatus.test.jsx src/search/__tests__/SearchResultsSection.test.jsx`, `node --check App.js`, `node --check index.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- The Search-page V1 Visual Credibility Pass has been redone using the May 13 PNG as vibe reference, not an exact mockup:
  - `SearchScreen` now leads with a larger centered local PNG wordmark, stronger search-first headline, warm supporting copy, and a restrained narrowing-to-six cue.
  - `SearchEntrySection` now reads as a premium search module rather than a generic form card, while preserving draft-query submission, example-chip behavior, Settings navigation, and controller calls.
  - `MarketplacePromptSection` remains below the search module and keeps first-run region selection calm, saved-preference-oriented, and explicit about not using location permission.
  - Backend contracts, controller flow, explicit marketplace behavior, saved store preference, first-run prompt behavior, query submission, query-quality polling, retry advice, enrichment hydration, candidate-id lookup, retailer CTA/disclosure, and the 6-result cap are unchanged.
  - The redone pass passed focused Jest tests, `node --check App.js`, `node --check index.js`, and Android Expo export; `.expo-export-check` was removed afterward.
- The May 19 Search base simplifies that Search-page pass toward a calmer native utility:
  - Search/Home hide the native stack header and use top safe area inside the screen, so the local PNG wordmark can be the primary brand moment.
  - Settings is a quiet Lucide icon in the top corner of the search composition rather than a text button; it is intentionally not sticky/pinned and should scroll away with page content.
  - The Search status/progress panel is intentionally not rendered on Search anymore, so backing out from Refine returns to a clean search entry surface instead of stale status copy.
  - The entry screen now removes the bordered teal module/card feel, suggestion chips, `Search first` label, helper paragraph, bottom metadata row, and the separate narrowing-to-six cue.
  - The hero/search column is max-width constrained for tablet/iPad so the input and CTA stay phone-native instead of stretching across the screen.
  - `SearchEntrySection` centers the experience on one soft elevated input, placeholder-driven guidance, Lucide search/mic icons, one `Find picks` CTA, and a disabled mic affordance reserved for later voice input.
  - The subtle orange/ember cue is only a thin accent under the CTA, keeping the wordmark's orange present without making the screen decorative.
  - Keep future additions one at a time; do not reintroduce chips, onboarding sections, or dashboard-like modules as the default base.
  - The May 19 base passed `npm test -- --runInBand src/search/__tests__/SearchEntrySection.test.jsx`, `node --check App.js`, `node --check index.js`, and Android Expo export; `.expo-export-check` was removed afterward.
  - `metro.config.js` appends `"mjs"` to `resolver.sourceExts` because Lucide's current package exports ESM `.mjs` icon files; this fixed the iOS Metro resolver error and passed iOS export.
- Query-quality suggestion polling is now implemented as a bounded mobile product-behavior slice:
  - `src/search/searchApi.js` calls `GET /api/search/query-quality` with discovery token, submitted query, and Amazon domain
  - `src/search/searchApi.js` normalizes object-shaped query-quality display fields so `originalQuery`, `suggestedQuery`, and `reason` render as readable strings instead of `[object Object]`; malformed suggested queries are hidden and malformed reason copy falls back to calm generic text
  - `src/search/useMobileSearchController.js` starts best-effort polling after discovery returns a valid token, records a `queryQuality` phase event, ignores stale responses when a newer search starts, times out quietly, and keeps the original search uninterrupted when the endpoint returns no suggestion or errors
  - `src/search/QuerySuggestionPrompt.jsx` renders a small follow-up-screen prompt when the backend returns a confident suggested query and defensively coerces display fields at render time
  - `Try suggested search` starts a fresh discovery/refine pass for the suggested query while preserving existing backend contracts and the 6-result cap
  - `Keep these results` dismisses the suggestion and keeps the current discovery/refine flow
- The query-quality suggestion slice passed `node --check src/search/useMobileSearchController.js`, `node --check src/search/searchApi.js`, `node --check src/search/searchPhaseEvents.js`, `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Direct `node --check` on touched `.jsx` files is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- The follow-up hard-constraint refresh product-completeness slice is implemented:
  - `src/search/searchConstraints.js` mirrors the web hard-constraint detector for kosher/Jewish-use, dietary/allergy, safety/material, and compatibility/exclusion notes
  - when the Follow-up answer contains one of those hard constraints, `src/search/useMobileSearchController.js` does one pre-finalize `GET /api/search/rainforest-discover` refresh with the original query plus notes and `cacheMode=refresh`
  - finalize and post-finalize enrichment then use the refreshed discovery token, refreshed candidate pool, refreshed marketplace domain, and combined query
  - query-quality polling is stopped and any existing suggestion is cleared before hard-constraint refresh starts, stale response guards still apply, and the Search -> Follow-up -> Results -> Detail stack flow is unchanged
  - ordinary soft follow-up preferences still finalize against the existing discovery token
- The follow-up hard-constraint refresh slice passed `npm test -- --runInBand src/search/__tests__/searchConstraints.test.js`, direct `node --check` on touched `.js` files, and Android Expo export; `.expo-export-check` was removed afterward.
- The stale-query submit fix passed `npm test -- --runInBand src/search/__tests__/SearchEntrySection.test.jsx` and Android Expo export; `.expo-export-check` was removed afterward.
- The query-quality display fix passed `npm test -- --runInBand src/search/__tests__/searchApi.test.js src/search/__tests__/QuerySuggestionPrompt.test.jsx`, direct `node --check` on touched `.js` files, and Android Expo export; `.expo-export-check` was removed afterward.
- A small detail trust-polish slice is implemented:
  - `SearchResultDetailScreen` passes the current enrichment phase status from the shared search flow into detail metadata rendering.
  - `SearchResultDetailMetadata.jsx` now makes `Why this pick`, `Worth knowing`, and feature-note fallback copy status-aware, so mobile distinguishes "still checking" from "extra analysis finished/was not ready in time and this note is limited."
  - This is copy/readiness polish only; backend contracts, controller flow, explicit store preference behavior, query-quality polling, retry advice, hard-constraint refresh behavior, enrichment hydration, candidate-id detail lookup, retailer CTA/disclosure, and the 6-result cap are unchanged.
- A small detail CTA polish slice is implemented:
  - `ScreenContainer` supports an optional fixed footer below the scroll view.
  - `SearchResultDetailScreen` uses that footer only when a retailer link exists, keeping `View retailer`, current price, short confirmation copy, and the affiliate disclosure reachable while scrolling detail content.
  - The in-page CTA/disclosure and unavailable-link state remain intact, with no backend contract or controller-flow changes.
- The May 19 detail redesign is implemented:
  - `SearchResultDetailScreen` now uses a native detail header with back-to-picks navigation and the centered local PNG wordmark, matching the newer Search/Refine/Results direction.
  - The detail page uses the May 13 mockup as taste reference only: product-first image/title/facts, calmer decision-note surfaces, Lucide-supported feature notes, retailer CTA/disclosure, and at-a-glance metadata.
  - It intentionally does not add saved, compare, share, profile, confidence percentages, tabs, bottom nav, or Amazon-specific CTA language.
  - Candidate-id lookup, stale route-snapshot fallback, enrichment-aware fallback copy, fixed retailer footer, retailer CTA/disclosure, backend/controller contracts, query-quality polling, retry advice, hard-constraint refresh, and the 6-result cap remain unchanged.
- The native detail parity slice keeps the native stack detail screen instead of copying the web modal layout. It adds a clearer detail overview and feature-highlight section, formats rating/review values on device, keeps calm fallback copy when feature/fit/caveat enrichment is absent, and preserves the existing candidate-id lookup, retailer CTA/disclosure, pricing/availability caveat, retry behavior, query-quality polling, controller flow, backend contracts, and 6-result cap.
- The native detail parity slice passed `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward. Direct `node --check` on touched `.jsx` files is not supported by this Node setup, so the Expo Android export is the JSX parse/bundle check.
- The detail enrichment fix now polls `GET /api/search/enrichment` instead of `/api/search/enrich`, preserves finalize `fitReason`/`featureBullets` camelCase data, and merges enrichment entries by `candidate_id`, `candidateId`, or `id`. If the detail screen lacks AI fit reasons, caveats, or feature bullets, verify this path first.
- The detail enrichment fix passed `node --check src/search/searchApi.js`, `node --check src/search/useMobileSearchController.js`, `node --check index.js`, `node --check App.js`, and `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- The enrichment/domain slice passed `npx expo export --platform android --output-dir .expo-export-check`; `.expo-export-check` was removed afterward.
- A focused audit-hardening slice is implemented:
  - result rows and detail metadata no longer turn missing ratings into `0.0` or object-shaped review counts into `[object Object]`
  - missing detail ratings no longer render as empty stars
  - `SearchResultsSection` and `SearchResultDetailScreen` are defensive about malformed/non-array result props
  - Results now passes the tapped item snapshot to detail navigation
  - detail prefers the live matched rank, falls back to a normalized route snapshot with a stale-snapshot note, and shows a clear unavailable state when neither live item nor snapshot exists
  - enrichment merge now trims primitive copy and drops object-shaped `fit_reason`/`caveat` values before hydrating focused picks
  - fallback final-result IDs are scoped to the current request/discovery-token identity when backend IDs are missing, so malformed no-id results from different searches no longer all reuse durable IDs like `final-0`
  - the `isApplyingQuerySuggestion` lifecycle audit item is addressed by removing the misleading controller-owned flag; accepting a suggestion now simply hands off to the normal new-search discovery/refine lifecycle
  - verification passed with focused Jest tests, direct `node --check` for touched `.js` entry/controller files, and Android Expo export; `.expo-export-check` was removed afterward
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
- The shared `/api/search/refine` response now includes optional AI refinement chip suggestions in addition to the existing follow-up question fields. Mobile normalizes those suggestions in `src/search/searchApi.js`, exposes them through the existing `refinementPrompt` object, passes them from `FollowUpScreen` into `SearchRefineSection`, and falls back to `Good value`, `Easy to use`, and `Fits my space` when suggestions are missing or invalid. Suggestion labels are capped at 3 and must be non-empty strings no longer than 22 characters; object-shaped or overlong labels are dropped rather than truncated.
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
  - manual live-flow verification of follow-up hard-constraint refresh behavior or broader mobile-native flow polish

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

## Audit checkpoints
- **Last full audit:** commit `397a7da` ("Harden mobile audit fixes and checklist"), ~May 19 2026. Covers null safety, AsyncStorage, nav params, and controller data audit findings.
- **Next audit:** schedule after the UI/UX pass is complete. Do not start it mid-slice.

## Next step
- Continue building mobile search in bounded vertical slices against `src/search/useMobileSearchController.js`.
- Do not keep doing micro-extractions unless they directly support a real mobile UX/data slice.
- Next planned step: manually verify the polished Search -> Follow-up -> Results -> Detail flow in Expo Go against a reachable backend, using `project-notes/untracked/things-to check.md` as the concise checklist.
- Include the status-aware detail fallback copy, fixed detail retailer footer, query-quality suggestion copy, hard-constraint refresh behavior, retry advice, retailer CTA/disclosure, and stale-query prevention in that pass.
- Keep the current controller flow, backend contracts, candidate-id lookup, retailer CTA/disclosure, query-quality polling, retry behavior, and 6-result cap while improving detail content/behavior.
- Keep result count capped at 6 and do not add analytics or broad persistence yet.
- `EXPO_PUBLIC_API_BASE_URL` must point to the backend API, not the public frontend site.
- If using the deployed backend, set `EXPO_PUBLIC_API_BASE_URL` to the active Render backend URL and restart Expo with `npx expo start --clear --lan`.
- If using the local backend from a physical device, use the computer's LAN IP, not `localhost`, because `localhost` on the phone means the phone itself.
- When giving the user a run command, say explicitly whether to use normal `npx expo start --lan` or cache-clearing `npx expo start --clear --lan`; prefer normal for ordinary edits and `--clear` for env/package/import changes or stale transform errors.
