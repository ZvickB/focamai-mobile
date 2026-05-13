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
  - a simple Home input with a discovery-only backend test button
- The backend remains shared with the web app, and mobile now has a minimal discovery-only request path.
- The mobile app still does not run the full guided flow: no refinement, finalize, enrichment, cards, analytics, or persistence are active.
- Web/product truth still lives in `../web/project-notes/`.

## Current implementation reality
- Kept:
  - `App.js`
  - Expo config and assets
  - NativeWind/Metro/Babel/Tailwind setup
  - `src/navigation/RootNavigator.jsx`
  - basic route screens in `src/screens/`
- Added during the restart rebuild:
  - `src/screens/HomeScreen.jsx` can call `GET /api/search/rainforest-discover` for one query and render only a small response summary.
- Removed from active mobile code:
  - guided search hook
  - result presentation helpers
  - search progress context
  - API helper
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

## Recommended next step
- Verify the discovery-only slice in Expo Go:
  - enter a simple product query
  - tap `Test discovery` or submit from the keyboard
  - confirm the response summary shows candidate count, preview count, source, timing, and token status
- If the request returns HTML instead of JSON, set `EXPO_PUBLIC_API_BASE_URL` to the active Render backend URL and restart Expo with `--clear`.
- After discovery is proven on device, render a tiny capped preview from the safest fields only.
