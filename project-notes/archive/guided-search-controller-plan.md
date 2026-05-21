# Guided Search Controller Plan

## Purpose
Guide the next mobile search-controller slice. This does not replace `migration-roadmap.md` or `restart-strategy.md`; it narrows the plan for translating the web `useGuidedSearch` behavior into a mobile-native controller path.

## Translate, Do Not Port
The web `useGuidedSearch` hook is the behavior and request-contract reference, not mobile implementation source. It mixes browser UI assumptions, marketplace persistence, analytics, web timing, React Query mutations, enrichment streaming, query-quality polling, retry advice, modal selection, badge timing, and DOM-era user-flow helpers in one large hook.

Mobile needs the same product path and backend contracts, but not the same shape. The React Native controller should stay small, explicit, and testable through Expo Go checkpoints:

- Preserve the phase order: discovery -> refinement -> finalize -> later enrichment.
- Preserve backend request fields, especially `query`, `amazonDomain` when mobile has marketplace context, `discoveryToken`, `followUpNotes`, `requestMode`, retry fields, and result caps.
- Keep the controller native-friendly: no DOM assumptions, no web modal state, no web analytics lifecycle, no wholesale React Query dependency unless a later slice earns it.

## Current Mobile Controller
`src/search/useMobileSearchController.js` already handles the clean restart path:

- Owns `productQuery`, `followUpNotes`, loading flags, `errorMessage`, `discoverySummary`, `refinementPrompt`, `finalResults`, and `phaseEvents`.
- Starts discovery and refinement in parallel.
- Ignores stale discovery/refine responses with `searchRequestIdRef`.
- Builds a compact discovery summary with candidate count, preview count, token, source, timing, and preview items.
- Calls finalize only after a discovery token exists.
- Uses `guided_refined` or `guided_empty_notes` based on trimmed follow-up notes.
- Exposes preview items capped at 3 and final results capped at 6 through `searchApi.js`.
- Keeps phase events local and diagnostic only.

`src/search/searchApi.js` already handles:

- `EXPO_PUBLIC_API_BASE_URL` checks.
- JSON/HTML response guarding.
- `Date.now()` client timing.
- Discovery, refine, and finalize endpoint calls.
- Minimal safe normalization for preview and final rows.

## Web Hook Responsibilities
The web hook currently owns more than the next mobile slice should:

- Input validation and query normalization through shared search-input logic.
- Amazon marketplace resolution, saved preference state, and restarting active searches when the effective marketplace changes.
- Discovery and refinement request orchestration, including abort controllers and stale response guards.
- Discovery token/session handling and expired-session reset.
- Preview reveal behavior and final-result display selection.
- Finalize request assembly with `requestMode`, retry fields, excluded IDs, previous results, candidate pool merge, selection state, and top-up metadata.
- Enrichment through SSE first and polling fallback.
- Query-quality polling and suggestion accept/reject behavior.
- Retry-advice requests and stale retry snapshot guards.
- Result selection, modal display hydration, retailer click tracking, result impression/click analytics, and badge reveal timing.
- Web debug events, analytics IDs, and React Query mutation lifecycle.

## Adopt Now
The next mobile controller slice should strengthen the existing discovery/refine/finalize path without broadening the product surface:

- Introduce an explicit active search session shape in the controller: `requestId`, `submittedQuery`, `amazonDomain`, `discoveryToken`, `candidateCount`, `previewCount`, and phase statuses.
- Keep stale-response protection for all phases, including finalize. The current finalize path uses the current request id, but it should also ignore a finalize response if a newer search has started before it returns.
- Add a session-expired/error path when discovery returns no token or finalize is attempted without one.
- Keep request payload parity with web where the backend expects it. If marketplace context is not implemented yet, document the temporary default and make `amazonDomain` an explicit field in the mobile request context when that slice arrives.
- Keep final result normalization capped at 6 and guard every render-facing field.
- Keep phase events lightweight, but make them describe user-relevant phase outcomes: discovery complete, refinement fallback/failed, finalize complete/failed, stale ignored.

This is still not enrichment, retry, analytics, or marketplace UI. It is the controller foundation that lets those later slices attach cleanly.

## Adopt Soon
After the controller session guard is stable in Expo Go:

- Bring over shared input validation in a mobile-safe way, likely by copying the stable pure `shared/search-input.js` into `mobile/src/shared/`.
- Add a native "show preview now" concept only if the mobile UX needs a separate preview reveal. The current scaffold can keep showing a tiny preview automatically while the UX is still temporary.
- Expand result normalization only for fields needed by the next native result/detail UI slice: image, link, subtitle/provider, rating/review count, price, badge/selection metadata, and later feature bullets.
- Add product-detail navigation data intentionally, using the navigation stack rather than web modal state.
- Add marketplace/domain context as its own slice before relying on Amazon domain restarts.

## Defer
Keep these out of the next controller slice:

- Enrichment SSE/polling and fit/caveat hydration.
- Query-quality polling and suggested-query UI.
- Retry-advice flow.
- Analytics IDs, result impressions/click tracking, and persisted session IDs.
- TanStack Query provider/mutations.
- AsyncStorage persistence.
- External retailer links and affiliate CTA behavior.
- Full product cards, images, rich badges, skeleton polish, and modal-equivalent detail hydration.

These are real product responsibilities, but they are later vertical slices, not prerequisites for stabilizing the mobile controller.

## Web Assumptions Not To Copy
Do not copy these web assumptions directly into React Native:

- `event.preventDefault`, `<form>`, DOM submit behavior, or textarea sizing assumptions.
- `window`, `window.setTimeout`, `window.clearTimeout`, `performance.now`, URL query params for dev toggles, or browser-only globals.
- `scrollIntoView`; mobile needs `ScrollView` or `FlatList` refs plus measured layout when auto-scroll becomes necessary.
- Web modal state for product details; use stack/modal screens.
- Hover classes, pointer behavior, and click wording.
- `localStorage`; any persistence needs AsyncStorage and async controller flow.
- Browser marketplace/geolocation assumptions. Mobile may need a simpler explicit marketplace path first.
- React Query just because the web hook uses `useMutation`.
- EventSource-first enrichment. Expo Go support and lifecycle behavior must be proven before choosing SSE; polling may be the safer first mobile enrichment slice.

## Next Implementation Slices
1. Controller session hardening
   - Add explicit active search/session state.
   - Ensure discovery, refine, and finalize all ignore stale responses.
   - Handle missing discovery token as an expired session.
   - Keep current UI nearly unchanged so verification isolates controller behavior.

2. Request-contract parity pass
   - Make mobile API helpers accept a request context object that can carry `amazonDomain` without changing backend contracts.
   - Preserve current behavior while making the contract obvious for the later marketplace slice.
   - Keep shortlist capped at 6 and preview rendering small.

If only one slice is done next, pick controller session hardening. It reduces the highest-risk class of mobile bugs: stale or overlapping search state.

## RN Gotchas And Checkpoints
React Native-specific watch points:

- Physical devices cannot use backend `localhost`; use LAN IP for local backend testing.
- Restart Expo with `npx expo start --clear --lan` after `.env` changes. Normal code-only edits can use `npx expo start --lan`.
- Treat fetch results as untrusted until normalized; raw backend objects should not be passed directly into render-heavy UI.
- Avoid state updates after a newer search starts. Request ids are currently the simplest controller-level guard.
- Abort support can be useful, but stale guards still matter because not every race is an abort race.
- Keep keyboard behavior in mind when adding UX around refinement; `TextInput` and `KeyboardAvoidingView` differ from web forms.

Verification checkpoints for the next slice:

- Local parser/export check: `npx expo export --platform android --output-dir .expo-export-check`, then remove `.expo-export-check`.
- Expo Go golden path with a LAN or deployed backend URL: enter query -> discovery summary appears -> follow-up appears independently -> focused picks returns up to 6 -> detail navigation still works.
- Overlap check: start a search, quickly change the query and start another; older discovery/refine/finalize responses must not replace the newer session.
- Missing/failed phase check: bad backend URL or HTML response should produce a readable phase/error message, not a render crash.
