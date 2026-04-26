# Focama Mobile Agent Guide

Read this file first at the start of every chat in `mobile/`.

## Purpose
- This is the mobile front door for AI work in this repo.
- Mobile notes should explain how to translate the existing product into React Native without re-deciding the product every time.
- Product thinking stays primarily in `../web/project-notes/`. Mobile notes focus on React Native migration, current mobile status, and how work should be carried out here.

## Repo root
- The mobile Git repository root is this `mobile/` directory, not the parent `focama/` directory.
- Before running Git commands for mobile work, verify with `git rev-parse --show-toplevel`; it should return `C:/Users/zvick/Desktop/udemy/my projects/focama/mobile`.
- The sibling `../web/` directory is a separate project/repo used as the product and implementation reference.

## First reads
- Read `project-notes/session-handoff.md` first for the fastest mobile reset.
- Read `project-notes/current-status.md` next for the immediate mobile snapshot.
- Read `migration-roadmap.md` for the actual phase-by-phase migration plan and file mapping.
- Read `CLAUDE.md` for mobile stack decisions, run commands, and React Native gotchas.
- Read `../web/project-notes/app_flow.md` for the canonical product behavior that mobile is translating.
- Read `../web/project-notes/doc_briefs.md` for product intent, voice, and UX direction.
- Read `../web/project-notes/finalize-strategy.md` before changing result explanation behavior, AI scope, or guided-flow expectations.

## Source of truth
- `migration-roadmap.md`: canonical migration phases, file mapping, and checkpoints.
- `project-notes/current-status.md`: short mobile snapshot and current phase reality.
- `project-notes/session-handoff.md`: fastest startup reset for a new mobile chat.
- `CLAUDE.md`: mobile stack choices, run commands, and practical RN replacements.
- `../web/project-notes/app_flow.md`: current product behavior.
- `../web/project-notes/current-status.md`: current web/backend reality.
- `../web/project-notes/doc_briefs.md`: product intent, UX direction, and trust/compliance tone.

## Working rules
- Treat web product truth and mobile implementation work as different things.
- Do not silently change the product while "porting" it.
- If the mobile app intentionally diverges from the web app, call that out clearly and record it in mobile notes.
- Keep the backend unchanged unless the user explicitly asks to work outside `mobile/`.
- Keep changes scoped. Finish one phase or one clear migration slice before starting another.
- Prefer copying stable logic and rewriting only the UI/platform layer that truly needs React Native primitives.
- Keep implemented behavior and planned migration work separate.
- If a web note and the mobile roadmap conflict, treat the web note as product truth and the roadmap as the implementation plan unless the user explicitly chooses otherwise.

## Current product direction to preserve
- The app should feel calm, focused, mobile-first, and not marketplace-shaped.
- The guided product flow remains the core experience:
  - `discover`
  - `refine`
  - `finalize`
  - `enrichment`
- Shortlists are 6 items end to end.
- The homepage remains search-first with one strong main input and a refinement step that appears after submit.
- AI copy should sound like a trusted assistant with honest caveats, not marketing.
- Keep the product vendor-agnostic in UI and response shape even if provider choices change later.
- Prefer the PNG wordmark for now unless branding is being revisited on purpose.

## React Native migration guardrails
- Expo managed workflow is the current direction.
- React Navigation replaces React Router.
- NativeWind replaces the current Tailwind web layer, but do not assume every web utility maps cleanly to native.
- Reanimated replaces web motion patterns where animation is needed.
- AsyncStorage replaces `localStorage`; treat persistence as async.
- `scrollIntoView`, DOM layout assumptions, hover states, and direct `window` access must be rethought rather than copied.
- Prefer direct ports for pure logic modules first:
  - `useGuidedSearch`
  - `resultPresentation`
  - analytics/state helpers that are not DOM-bound
- Treat screen composition, layout, keyboard handling, safe areas, modal/sheet behavior, and navigation as native-first work.

## Notes update rules
- After a meaningful mobile change, update:
  - `project-notes/current-status.md`
  - `project-notes/session-handoff.md` if a fresh chat would otherwise be misled
- If the migration phase changes or a roadmap checkpoint is completed, update `project-notes/current-status.md` with the new status.
- If a mobile decision changes how web behavior should be translated, record that in `project-notes/session-handoff.md`.
- Do not duplicate large chunks of web product notes into mobile notes; link back to the web notes instead.

## Communication preferences
- The user is stronger in React/frontend than backend architecture and is still building React Native instincts.
- Explain RN-specific differences in practical terms:
  - what changed
  - why native needs it
  - what to watch out for
- When a port is not 1:1, explain the tradeoff plainly instead of hiding the mismatch.

## Workflow preferences
- This repo is worked in PowerShell on Windows. Prefer PowerShell-safe commands.
- For mobile work, manual emulator/device verification is the default until a mobile test suite exists.
- For pure logic ports, run tests later when a mobile test harness exists or when shared logic is exercised through the web tests.
- For meaningful checkpoints, report what changed, what was verified, and which roadmap phase the app is in.
- Never print full `.env` contents or raw secret values into tool output.

## If unsure
- Prefer the smallest change that keeps the mobile app aligned with the roadmap and the web product behavior.
