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
- Prefer the current web backend flow when search is rebuilt:
  - discovery
  - refinement
  - finalize
  - enrichment
- Do not start by copying the whole old hook back into mobile.

## Next step
- Verify the discovery-only slice in Expo Go.
- Use a simple query such as `travel stroller`.
- If the app reports that the server returned HTML instead of JSON, set `EXPO_PUBLIC_API_BASE_URL` to the active Render backend URL and restart Expo with `npx expo start --clear --lan`.
- Once discovery is proven, add a tiny capped preview from normalized safe fields before adding refinement or finalize.
