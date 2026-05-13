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
- This branch is the mobile clean-slate restart: `restart/mobile-clean-slate`.
- Read `restart-strategy.md` before rebuilding search behavior; it captures why the earlier mobile path got tangled and how to proceed safely.
- Mobile is intentionally back to basic scaffolding and basic UI.
- Backend stays shared with web, and the current mobile shell has only a discovery-only backend test path.
- Product and flow decisions remain anchored in `../web/project-notes/`.
- Rebuild the mobile app gradually and avoid reintroducing the old all-at-once debug harness.
- The current Home UI is only a functional verification scaffold to prove endpoints and React Native rendering safety.
- The final mobile UI/UX can deliberately differ from the web app after the data path is proven; preserve product behavior and trust principles, not the exact web layout.
- Mobile UI/UX is expected to be redesigned after endpoint flow is proven; do not treat the web UI as the target layout, only as the product behavior reference.

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
  - active `Test discovery` button
  - About navigation button
  - small status snapshot
  - discovery response summary with candidate count, preview count, source, timing, and token status
  - tiny preview capped at 3 normalized preview results
  - refinement prompt and local follow-up notes box
  - minimal `Show focused picks` button that renders final result count/titles capped at 6
- Discovery-only backend access has been verified in Expo Go against the local backend using a LAN API base URL.
- Tiny preview rendering has been verified in Expo Go.
- Refinement prompt rendering has been verified in Expo Go.
- Minimal finalize rendering has been verified in Expo Go and is ahead of the previous unstable Phase 3/debug-harness attempt.
- No guided search logic is active.
- No API helper is active; the discovery request is intentionally local to `HomeScreen.jsx` for this first verified slice.
- No analytics helper is active.
- No TanStack Query provider is active.

## What was removed
- Phase 3 guided-search hook and debug harness behavior.
- Finalize crash investigation files.
- EAS/dev-client setup.
- Heavy copied web logic that was making the mobile branch feel tangled.

## Migration stance from here
- Keep the shell simple until Expo Go launches cleanly.
- Reintroduce behavior in thin vertical slices.
- Treat the current UI as temporary scaffolding until the endpoint flow is verified.
- Once the data path is stable, design the mobile-native UX intentionally instead of copying the web screens 1:1.
- Prefer the current web backend flow when search is rebuilt:
  - discovery
  - refinement
  - finalize
  - enrichment
- Do not start by copying the whole old hook back into mobile.

## Next step
- Commit the finalize checkpoint if it has not already been committed.
- Then add lightweight final-result metadata rows.
- Keep result count capped at 6 and do not add images, modal/details, enrichment, analytics, or retry yet.
- `EXPO_PUBLIC_API_BASE_URL` must point to the backend API, not the public frontend site.
- If using the deployed backend, set `EXPO_PUBLIC_API_BASE_URL` to the active Render backend URL and restart Expo with `npx expo start --clear --lan`.
- If using the local backend from a physical device, use the computer's LAN IP, not `localhost`, because `localhost` on the phone means the phone itself.
