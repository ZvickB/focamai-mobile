# Mobile Current Status

## Purpose
- Short current snapshot for future mobile chats.
- Keep this focused on what is true now and where to read details.

## Current state
- The mobile app now has a real Expo scaffold inside `mobile/`.
- The migration target is the existing Focama web app in `../web`.
- The backend is intentionally shared with web and should remain unchanged during normal mobile migration work.
- The roadmap already defines the target stack:
  - Expo managed workflow
  - React Navigation v7
  - NativeWind v4
  - Reanimated 3
  - AsyncStorage
  - Expo Linking
  - Expo Constants/app config

## What is already decided
- Product behavior should be translated from the web app, not redesigned from scratch here.
- Most product thinking should continue to live in `../web/project-notes/`.
- Mobile notes should focus on translation, RN gotchas, and current migration phase.
- The highest-value early ports are the pure logic/shared modules rather than the DOM-heavy UI pieces.

## Current notes reality
- `mobile/CLAUDE.md` existed and already contained useful migration guidance.
- `mobile/AGENTS.md` now exists as the mobile front door.
- `mobile/project-notes/` now exists so future chats have a real startup note path instead of a missing folder.

## Current implementation reality
- Stage 1 scaffold is now present with:
  - Expo app root files in `mobile/`
  - NativeWind config (`babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`)
  - Expo app config in `app.config.js`
  - Stage 1 runtime verification completed in Expo Go on iPad
- Phase 2 navigation shell is now present with:
  - `RootNavigator.jsx`
  - stub screens for Home, About, Contact, Privacy, and Affiliate Disclosure
  - `QueryClientProvider` and `SearchProgressProvider` wired at the app root
- No mobile test suite is present yet.
- The mobile roadmap is still the canonical implementation plan and should be followed one phase at a time.

## Carry-over from web that matters most
- Calm, focused, mobile-first product feel
- Search-first entry point
- Guided flow with refine/finalize/enrichment behavior
- 6-result shortlist
- Trusted-assistant explanation tone
- Vendor-agnostic product shape

## Recommended next step
- Verify the Phase 2 checkpoint in Expo Go:
  - Home screen renders
  - tapping "Go to About" opens About
  - iOS back navigation returns to Home
- Then begin Phase 3: port the logic layer.
