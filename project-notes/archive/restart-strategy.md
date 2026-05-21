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
- Treat the restart UI as endpoint/data-path verification scaffolding, not the final mobile UX direction.
- After the endpoint flow is proven, mobile UI/UX may intentionally diverge from the web layout while preserving the product behavior and trust principles.
- Every rebuild step needs a small on-device checkpoint before adding the next moving part.

## Middle-path strategy
- The restart does not mean rebuilding forever in tiny endpoint-only steps.
- Once discovery, refinement, and finalize are individually proven, move in bounded vertical slices.
- Use the web app as the behavior contract and request-shape reference, not as code to copy wholesale.
- Build a small mobile-native search data/controller layer around the backend phases:
  - discovery
  - refinement
  - finalize
  - enrichment polling
  - retry advice
  - query-quality suggestion later
- Each bounded slice should include enough UI to verify the user journey on device, but should still defer unrelated layers.
- Add lightweight mobile phase/debug events when the controller becomes non-trivial so failures identify the phase that broke instead of becoming another opaque mobile port.
- After the plain scaffold has been split into obvious components, stop doing extraction-only work unless it supports a real slice.
- Prefer slices that are bigger than one card but smaller than a full web-flow port.

## Phase shift — foundation is proven, now tackle data-path complexity

The core data path (discover → refine → finalize) and session hardening are verified working in Expo Go.
The next phase is tackling the complex data-path features that were correctly deferred during the foundation-proving work.
These are not "polish" — they are correctness and product-completeness items.

**What to tackle now (in order):**

1. **`amazonDomain` propagation** — currently hardcoded as `"amazon.com"` placeholder in the session. The discovery response includes the real domain. Thread it from discovery response into the session, and forward it through finalize and enrichment. Without this, finalize silently fails for non-US domains and enrichment uses the wrong scope.

2. **Enrichment polling** — the backend returns raw finalize results; the web app then polls `/api/search/enrich` (or equivalent) to hydrate product data (images, prices, review counts). Mobile currently skips this entirely. Add enrichment polling as a slice on the controller after finalize completes.

3. **Retry with feedback** — the "I want something different" loop is a core product behavior. Add the retry path to the controller: send retry feedback to finalize with the previous result exclusions and a retry count flag.

**Still defer:**
- Analytics (no user-facing impact, add after data path is complete)
- Full native UI redesign (scaffold serves testing; design the real UX after the data path is stable)
- Persistence, marketplace preferences, deep links

**The rule that still applies:** do NOT copy the 1552-line web hook wholesale. The lesson from main was not "don't build complex things" — it was "don't port complexity before the foundation is proven." Foundation is proven now. Add each feature as a deliberate, bounded slice to the existing 435-line controller.

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

## Recommended implementation path
1. Prove backend endpoint flow with the temporary scaffold.
   - Keep the UI plain.
   - Verify request/response behavior and safe React Native rendering first.

2. Extract a thin mobile search data layer from the scaffold.
   - Move endpoint calls, response reading, shape guards, and normalization out of `HomeScreen.jsx`.
   - Keep the data layer small and mobile-specific.
   - Do not copy the full web guided-search hook back in one piece.
   - Preserve the web request contracts, especially `query`, `amazonDomain`, `discoveryToken`, follow-up notes, and shortlist/result caps.

3. Build native UI slices against that data layer.
   - The native UI direction has already been thought through in `project-notes/mobile-ui-ux-direction.md`.
   - Use that doc for the intended mobile patterns: first-run onboarding, native search/refine flow, ranked result rows, product detail stack screen, retailer-agnostic copy, and mobile-specific divergence from web.

4. Wire each UI slice as it is built.
   - Do not design the whole polished UI first and connect everything at the end.
   - Wire search/refine, finalize, results rows, product detail, enrichment, query-quality suggestion, and retry advice one slice at a time.

5. Add support layers after the core flow is stable.
   - Persistence
   - Analytics
   - Saved/history/profile surfaces if the product later needs them
   - Richer compare or marketplace preference behavior

## Checkpoint rule
- Add only one meaningful moving part at a time.
- Verify each step in Expo Go on the actual target device before layering on the next step.
- If something crashes, stop at that layer and simplify the render/output until the failure point is obvious.
- A "meaningful moving part" can be a bounded vertical slice after the core endpoints are proven; it does not have to mean one tiny endpoint forever.

## Practical debugging rule
- First prove the request returns.
- Then prove normalized data is small and safe.
- Then render a minimal UI.
- Only then build the real experience.
