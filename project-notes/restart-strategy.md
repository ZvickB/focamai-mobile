# Mobile Restart Strategy

## Purpose
- Explain why the mobile branch was rolled back to a clean shell.
- Define the safer rebuild approach from this point forward.
- Keep this separate from the broad migration roadmap so the roadmap can remain a reference instead of a postmortem.

## What happened
- The earlier mobile branch tried to port too much of the web guided-search flow at once.
- Discovery, refinement, finalize, enrichment, analytics, copied web helpers, debug UI, and crash investigation code all ended up active together.
- That made failures hard to interpret because a crash could have come from:
  - React Native rendering
  - Expo Go/device behavior
  - request payload shape
  - backend timeout or provider latency
  - large response processing
  - stale or overlapping finalize requests
  - copied web assumptions that did not fit native
- The web app later improved its backend flow by splitting work into smaller staged routes, and the backend moved to Render. Those changes may help mobile, but they do not automatically make the old mobile port safe.
- The current branch `restart/mobile-clean-slate` intentionally removes the tangled Phase 3/debug logic so the mobile app can be rebuilt from a stable Expo shell.

## What stays true
- The broad migration direction is still good.
- React Native / Expo is still a reasonable target.
- The web app remains the product source of truth.
- The shared backend should be reused when mobile search is rebuilt.
- The product should still feel calm, focused, search-first, and mobile-first.

## What changes
- Do not copy the full web guided-search hook back into mobile in one pass.
- Do not wire discovery, refine, finalize, enrichment, analytics, and full result rendering at the same time.
- Do not treat a successful web flow as proof that the same data path is safe in Expo Go.
- Every rebuild step needs a small on-device checkpoint before adding the next moving part.

## Rebuild order
1. Verify the clean shell
   - Launch in Expo Go.
   - Confirm Home renders.
   - Confirm typing in the input works.
   - Confirm About navigation works.

2. Add one backend request
   - Start with discovery only.
   - Send a simple query.
   - Log a small response summary.
   - Render only a count or minimal text summary.

3. Render a tiny preview
   - Normalize the response first.
   - Show only the safest fields.
   - Keep the preview capped.
   - Avoid modal/details/enrichment at this stage.

4. Add refinement as its own slice
   - Fetch and display the follow-up question.
   - Keep follow-up input local.
   - Verify it does not affect discovery stability.

5. Add finalize as its own slice
   - Send only the minimum required payload.
   - Render only result count/title first.
   - Add caps and shape guards before any rich card rendering.

6. Add richer UI after the data path is proven
   - Product cards
   - Images
   - Explanation/caveat copy
   - Modal/details
   - Clickout and disclosure
   - Enrichment polling/stream behavior

7. Add support layers last
   - Analytics
   - Persistence
   - Retry flows
   - Marketplace preference handling
   - Deep links or external links

## Checkpoint rule
- Add only one meaningful moving part at a time.
- Verify each step in Expo Go on the actual target device before layering on the next step.
- If something crashes, stop at that layer and simplify the render/output until the failure point is obvious.

## Practical debugging rule
- First prove the request returns.
- Then prove normalized data is small and safe.
- Then render a minimal UI.
- Only then build the real experience.

