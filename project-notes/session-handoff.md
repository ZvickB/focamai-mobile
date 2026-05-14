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
- Backend stays shared with web, and the current mobile shell has a small discovery/refine/finalize scaffold path.
- Product and flow decisions remain anchored in `../web/project-notes/`.
- Rebuild the mobile app gradually and avoid reintroducing the old all-at-once debug harness.
- Use the happy middle from `restart-strategy.md`: after discovery/refine/finalize are proven, build bounded vertical slices around a small mobile-native search data/controller layer.
- The current Home UI is a plain search/refine/results scaffold to prove endpoints and React Native rendering safety before richer UX work.
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
  - active search button
  - About navigation button
  - small progress snapshot
  - discovery response summary with candidate count, preview count, source, timing, and token status
  - tiny preview capped at 3 normalized preview results
  - refinement prompt and local follow-up notes box
  - minimal `Show focused picks` button that renders focused-pick metadata rows capped at 6
- Search endpoint calls, JSON/HTML response guarding, API base URL checks, and result normalization now live in `src/search/searchApi.js`.
- The temporary search phase/state orchestration now lives in `src/search/useMobileSearchController.js`; HomeScreen mostly renders the scaffold UI around that hook.
- The hook path was manually verified in Expo Go by the user after a local Android Metro export/bundle check.
- The lighter Home search/refine/results scaffold has passed a local Android Metro export/bundle check, but still needs a manual Expo Go verification pass.
- Discovery-only backend access has been verified in Expo Go against the local backend using a LAN API base URL.
- Tiny preview rendering has been verified in Expo Go.
- Refinement prompt rendering has been verified in Expo Go.
- Minimal finalize rendering has been verified in Expo Go and is ahead of the previous unstable Phase 3/debug-harness attempt.
- Lightweight final-result metadata rows are implemented and now sit under a plainer focused-picks section.
- Discovery and refinement requests launch together and now update the UI independently; a slow follow-up should no longer delay discovery summary/preview rendering.
- No full guided search logic is active.
- A thin mobile search API helper and tiny mobile controller hook are active, but enrichment, analytics, retry, persistence, and polished result UI are still deferred.
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
- Preserve web backend contracts and phase order, but do not port the web `useGuidedSearch` implementation as the mobile controller.
- Prefer the current web backend flow when search is rebuilt:
  - discovery
  - refinement
  - finalize
  - enrichment
- Do not start by copying the whole old hook back into mobile.

## Next step
- Verify the reshaped Home search/refine/results scaffold manually in Expo Go.
- Continue building mobile search in bounded vertical slices against `src/search/useMobileSearchController.js`, likely by extracting result-row UI into a dedicated module or adding the next non-rich result detail slice.
- Keep result count capped at 6 and do not add images, modal/details, enrichment, analytics, or retry yet.
- `EXPO_PUBLIC_API_BASE_URL` must point to the backend API, not the public frontend site.
- If using the deployed backend, set `EXPO_PUBLIC_API_BASE_URL` to the active Render backend URL and restart Expo with `npx expo start --clear --lan`.
- If using the local backend from a physical device, use the computer's LAN IP, not `localhost`, because `localhost` on the phone means the phone itself.
- When giving the user a run command, say explicitly whether to use normal `npx expo start --lan` or cache-clearing `npx expo start --clear --lan`; prefer normal for ordinary edits and `--clear` for env/package/import changes or stale transform errors.
