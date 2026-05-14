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
  - Home, About, Contact, Privacy, and Affiliate Disclosure screens
  - a plain Home search input with discovery/refine/finalize controls
  - a tiny capped preview of the first few discovery preview results
  - a refinement prompt and local follow-up notes box
  - lightweight focused-pick metadata rows capped at 6
- The backend remains shared with the web app, and mobile now has a minimal discovery/refine/finalize request path.
- The discovery-only slice has been verified in Expo Go against the local backend using a LAN API base URL.
- The tiny capped preview has also been verified in Expo Go.
- The refinement prompt slice has also been verified in Expo Go.
- The minimal finalize slice has also been verified in Expo Go and is ahead of the previous unstable Phase 3/debug-harness attempt.
- The extracted tiny controller hook was manually verified in Expo Go by the user after the local bundle check.
- Discovery and refinement requests are still launched together, but the UI now updates each one independently so a slow follow-up question does not block discovery rendering.
- The mobile app still does not run the full guided flow: no enrichment, real product cards, analytics, persistence, retry, or modal/details are active.
- The current Home UI is now a slightly cleaner search/refine/results scaffold, not the intended final mobile UX.
- A tiny mobile search controller hook now owns the scaffold's query, phase loading flags, discovery/refine orchestration, follow-up notes, and finalize result state around `src/search/searchApi.js`.
- The hook path and lighter Home scaffold have passed local Android Metro export/bundle checks with `npx expo export --platform android`; the latest Home UI reshaping still needs manual Expo Go verification.
- Current work is proving endpoint flow and native rendering safety first; final mobile UI/UX can deliberately diverge from the web layout after the data path is stable.
- Mobile UI/UX is expected to be redesigned after endpoint flow is proven; do not treat the web UI as the target layout, only as the product behavior reference.
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
  - `src/screens/HomeScreen.jsx` renders a plain mobile search/refine/results scaffold and delegates search phase/state handling to `src/search/useMobileSearchController.js`.
  - `src/search/useMobileSearchController.js` can call `GET /api/search/rainforest-discover` for one query and expose a small response summary.
  - The hook exposes a tiny preview capped at 3 normalized items from `previewResults`.
  - The hook also calls `GET /api/search/refine` in parallel and exposes the follow-up prompt plus local notes state.
  - The hook can call `POST /api/search/finalize` with minimal guided payload and expose final results capped at 6.
  - Home now renders lightweight final-result metadata rows with rank, title, source/provider, price, rating, and review count, still capped at 6.
  - Home exposes progress, preview, refine, and focused-pick sections instead of one debug-heavy status block.
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
  - React Native Reanimated
  - Safe Area Context
- Removed old Phase 3/debug dependencies for now:
  - TanStack Query
  - AsyncStorage
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

## Recommended next step
- Verify the reshaped Home search/refine/results scaffold manually in Expo Go.
- Next mobile search work should build against the tiny controller hook in bounded vertical slices, likely by introducing a small dedicated result-row component/module or the next non-rich result detail slice.
- Keep result count capped at 6 and do not add images, modal/details, enrichment, analytics, or retry yet.
- `EXPO_PUBLIC_API_BASE_URL` must point to the backend API, not the public frontend site.
- Do not fall back to `https://focamai.com` for mobile API requests; that returns frontend HTML for unknown API paths.
- If using the deployed backend, set `EXPO_PUBLIC_API_BASE_URL` to the active Render backend URL and restart Expo with `--clear`.
- If using the local backend from a physical device, use the computer's LAN IP, not `localhost`, because `localhost` on the phone means the phone itself.
