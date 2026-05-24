# Mobile UI/UX Implementation Plan

## Purpose
- Turn the mobile UI/UX direction, proposed layout, mockups, and current code reality into an actionable build plan.
- This is the primary mobile UI/UX sequencing doc from this point forward.
- Use it to decide what to polish next and what to defer.

## Source priority
1. `../web/project-notes/app_flow.md` and `../web/project-notes/doc_briefs.md` remain product truth.
2. `../web` also provides the Focamai brand baseline: wordmark/logo reference, Manrope usage, teal/orange/warm-neutral family, and calm trusted-assistant voice.
3. `project-notes/current-status.md` and `project-notes/session-handoff.md` describe current mobile reality.
4. This file is the main plan for mobile UI/UX implementation order.
5. `project-notes/mobile-ui-ux-direction.md` is the principles and taste document.
6. `project-notes/proposed-layout.md` and the PNG mockups are brainstorming references only.

If this plan conflicts with the proposed layout or mockups, follow this plan unless the user explicitly chooses otherwise. If this plan conflicts with web product behavior, preserve web product behavior and update this plan.

For brand assets, use `../web` as reference only. Mobile must keep local copies of any shipping brand assets under `mobile/assets/` and should prefer the PNG wordmark unless branding is intentionally revisited. Mobile should look like the same Focamai product without being wedded to exact web visual sameness.

## Current stance
- The staged mobile data path is now strong enough to start serious UI/UX work.
- Do not treat this as a full redesign or a fixed mockup implementation.
- Build polished native slices against the existing controller and backend contracts.
- A small pre-Slice-3 brand alignment pass now anchors mobile to the local PNG wordmark and web-inspired teal/orange/warm-neutral tokens while preserving native layout choices.
- Preserve:
  - `discover -> refine -> finalize -> enrichment`
  - query-quality suggestion polling
  - retry advice
  - explicit saved store preference
  - candidate-id detail lookup
  - retailer CTA plus nearby affiliate disclosure
  - 6 focused picks
- Avoid changing backend contracts, controller ownership, marketplace behavior, or product copy rules while doing visual polish.

## What the mockups are useful for
- Calm expert shopping, not marketplace browsing.
- Spacious warm background, deep green trust color, restrained orange emphasis.
- Strong product imagery when available.
- Ranked shortlist that is easy to scan on a phone.
- Explanations and caveats close to each pick.
- A detail screen with image, facts, reasons, caveats, features, CTA, and disclosure.

## What to reject from the mockups for now
- Bottom tab bar.
- History, profile, saved, and compare as primary navigation.
- Percentage confidence scores.
- Large top-pick hero treatment that makes one item feel over-certified.
- Amazon-specific UI identity or permanent "View on Amazon" style labels.
- Heavy onboarding before the first useful search.
- Extra preference panels before the backend/product behavior needs them.
- Decorative complexity that makes the app feel like a mockup instead of a native utility.

## Product shape to protect
- Focamai narrows a noisy marketplace before the user enters it.
- The app should feel like a trusted assistant, not a retailer, review site, or marketplace.
- AI copy should explain fit and surface tradeoffs without hype.
- Retailer language should stay neutral: retailer, store, seller, price, availability.
- Confidence should be represented with plain labels only when the underlying source is clear.
- Caveats should be visible in the result/detail journey, not buried.

## V1 navigation shape
- Keep the stack flow:
  - Search
  - Follow-up
  - Results
  - Search result detail
  - Settings and legal/static pages as secondary stack screens
- Keep no bottom tabs in V1.
- Keep Settings as the home for store preference, legal/support links, and later help entry points.
- Keep detail as a normal stack screen, not a web-style modal.

## Implementation slices

### Slice 0 - Verify the baseline before polishing
Status: complete.
Goal: know the current scaffold still works before visual changes hide behavior bugs.

Do:
- Run the Maestro shell smoke locally if available.
- Manually verify in Expo Go:
  - Search opens.
  - Settings opens and returns.
  - Search -> Follow-up -> Results works with a live backend.
  - A focused pick opens detail.
  - Retailer CTA opens when a link exists.
  - Retry advice can suggest a new search.
  - Detail hydration still updates through `candidateId`.

Done when:
- Current behavior is understood and any visible blockers are recorded before UI work begins.

### Slice 1 - Shared mobile surface and visual system
Status: complete.
Goal: make the app feel cohesive before polishing individual screens.

Do:
- Establish a small set of reusable native surfaces:
  - screen container
  - section header
  - primary button
  - secondary button
  - pill/chip
  - quiet status panel
  - product image frame
- Keep Manrope as the typeface.
- Use warm white or pale mist backgrounds, deep green/teal action color, and restrained orange emphasis.
- Keep card radius and shadows restrained.
- Replace text-only utility buttons with familiar icon buttons only when the icon is obvious or labeled accessibly.
- Make touch targets, spacing, and text wrapping safe on phone widths.

Avoid:
- A full design-system project.
- Decorative cards inside cards.
- Large gradient/orb backgrounds.
- Tab navigation or feature surfaces.

Likely files:
- `tailwind.config.js`
- `src/navigation/RootNavigator.jsx`
- shared components under `src/components/` or small helpers under `src/search/` if the scope stays search-only

Done when:
- The existing screens can share consistent spacing, typography, buttons, chips, and panels without changing behavior.

### Slice 2 - Results ranked list
Status: complete.
Goal: make the six picks the first polished product moment.

Why first:
- Results have real data now.
- This screen carries the core product promise.
- It exposes most rendering risks: missing images, unknown price, missing rating, late enrichment, retry replacements.

Do:
- Replace the "Results checkpoint" framing with user-facing result copy.
- Present "Your 6 focused picks" or similar calm headline.
- Show up to 6 ranked mobile rows/cards.
- Prefer a ranked list over a grid.
- Let the first item be a little richer, but keep all six credible.
- Show the essentials:
  - rank
  - image or graceful fallback
  - title
  - source/provider if useful
  - price
  - rating/review count if available
  - one short fit/caveat preview when available
  - "View details" or row tap affordance
- Keep preview results visually secondary or move them behind a small "early preview" reveal if they remain useful.
- Keep retry entry below the shortlist, not mixed into the six picks.

Avoid:
- Exact match percentages.
- "Top Pick" language unless the reason is explicit and modest.
- Amazon branding as a primary visual cue.
- Dense comparison tables.

Likely files:
- `src/search/SearchResultsSection.jsx`
- `src/search/SearchResultRows.jsx`
- `src/screens/ResultsScreen.jsx`

Done when:
- The shortlist feels like a calm, scannable native result list on a phone.
- Missing image/price/rating states still look intentional.
- Retry replacement cards still render correctly.

### Slice 3 - Product detail screen
Status: complete in code and Android export verified. The native detail page now leads with image/fallback, product title, price, rating/reviews, rank/source context, then places `Why this pick` and `Worth knowing` near the top. Feature notes, retailer CTA, pricing/availability note, and affiliate disclosure stay retailer-agnostic and close to the product decision. A later trust-polish pass made the missing-note copy status-aware, so the detail screen distinguishes enrichment that is still checking from enrichment that finished or timed out without extra fit/caveat/feature notes. A small CTA polish pass also keeps a compact retailer footer reachable while scrolling when a retailer link exists.

Goal: make each pick understandable enough to decide whether to leave for the retailer.

Do:
- Keep the native stack detail screen.
- Lead with product image/fallback, title, price, rating/reviews, and rank/source context.
- Keep `Why this pick` and `Worth knowing` near the top.
- Show feature bullets with calm fallback copy while enrichment is absent.
- Keep retailer CTA, pricing/availability note, and affiliate disclosure together.
- Keep the CTA retailer-agnostic, such as `View retailer` or `Check availability`.
- Make late enrichment hydration feel natural, not like the screen changed unexpectedly.

Avoid:
- Tabs inside the detail screen for V1 unless content genuinely needs them.
- Share/save controls unless those features exist.
- Amazon-specific final-click language unless the product decision explicitly changes.

Likely files:
- `src/screens/SearchResultDetailScreen.jsx`
- `src/search/SearchResultDetailMetadata.jsx`
- `src/search/AffiliateDisclosureNote.jsx`

Done when:
- Detail reads like a native decision-support page, not a debug dump or web modal copy.

### Slice 4 - Search entry screen
Status: complete in code, component smoke verified, and Android export verified. The Search screen keeps the local PNG wordmark, one natural-language input, a clearer primary `Find focused picks` action, quiet example chips, a secondary Settings button, keyboard submit behavior, and extra scroll padding for smaller screens. The first-run store prompt is calmer and still stays inline only when needed.

Goal: make the first screen focused, lightweight, and search-first.

Do:
- Use the PNG wordmark if available.
- Keep one strong natural-language input.
- Provide a clear primary search action.
- Add a few example chips only if they help users understand input shape.
- Keep Settings reachable but visually secondary.
- Keep the first-run store prompt useful and calm without becoming the main screen.
- Add keyboard-safe behavior:
  - `returnKeyType="search"`
  - `onSubmitEditing`
  - `keyboardShouldPersistTaps="handled"`
  - avoid covered controls on smaller screens

Avoid:
- Main-screen marketplace picker after first-run.
- History/profile/saved buttons.
- Heavy privacy or AI explanation copy on the main screen.
- Permanent onboarding-style hero copy.

Likely files:
- `src/screens/SearchScreen.jsx`
- `src/search/SearchEntrySection.jsx`
- `src/search/MarketplacePromptSection.jsx`

Done when:
- The user can understand the app's first action in a few seconds and submit without distraction.

### Slice 5 - Follow-up/refine screen
Status: complete in code, component smoke verified, and Android export verified. The Follow-up screen now leads with one optional AI question, keeps the multiline answer natural, keeps `Get focused picks` and `Skip and show results` together in the same surface, shows query-quality suggestions as a quiet secondary prompt, and has readable prompt-loading/fallback states. The follow-up hard-constraint refresh product-completeness slice is now implemented in the mobile controller: kosher/Jewish-use, dietary/allergy, safety/material, and compatibility/exclusion notes trigger one refreshed discovery request with `cacheMode=refresh` before finalize.

Goal: make the one-question refinement feel useful, optional, and low-friction.

Do:
- Show the AI question prominently.
- Let the user answer naturally in a multiline input.
- Keep actions clear:
  - primary: get focused picks
  - secondary: skip and show results
- Place query-quality suggestions without interrupting the user.
- Make loading and fallback prompt states readable.

Important product parity:
- Web refreshes discovery before finalize when follow-up notes add hard constraints. Mobile now mirrors this through a bounded controller slice without copying the full web guided-search hook.

Avoid:
- Turning follow-up into many preference controls.
- Making the user feel blocked if they do not answer.
- Overexplaining the backend phases.

Likely files:
- `src/screens/FollowUpScreen.jsx`
- `src/search/SearchRefineSection.jsx`
- `src/search/QuerySuggestionPrompt.jsx`
- `src/search/useMobileSearchController.js` and `src/search/searchConstraints.js` for hard-constraint refresh behavior

Done when:
- The refine step feels like one helpful question, not a form.

### Slice 6 - Retry and recovery
Status: complete in code, component smoke verified, and Android export verified. Retry now stays under results as a recovery surface, asks what felt wrong in plain language, keeps correction chips quiet, leads with suggested-query advice plus rationale and editable search, keeps `Keeping` tags as reassurance only, and leaves same-session replacement picks as the clearly labeled fallback.

Goal: make bad results recoverable without turning the app into endless browsing.

Do:
- Keep retry under results.
- Ask what felt wrong in plain language.
- Keep correction chips, but make them visually quiet.
- Show suggested query and rationale clearly.
- Let the user search the suggestion or edit it first.
- Keep same-session retry as fallback if retry advice fails.
- Show what Focamai is keeping only as reassurance, not a hard promise.

Avoid:
- Infinite "more results" behavior.
- Making retry look like filters.
- Hiding the suggested-query path below the same-session retry fallback.

Likely files:
- `src/search/SearchRetrySection.jsx`
- `src/search/useMobileSearchController.js`
- `src/search/searchApi.js`

Done when:
- A user can correct direction quickly and understand whether they are starting a better search or asking for replacement picks.

### Slice 7 - Loading, empty, weak-result, and error states
Status: complete in code, component smoke verified, and Android export verified. The progress panel now uses calm stage titles like `Finding options`, `Narrowing to six`, `Checking details`, and `Shortlist ready`, keeps diagnostics expandable and secondary, rewrites API-base/HTML errors into readable user-facing copy while preserving the raw message as secondary context, and Results now has intentional empty and fewer-than-six result states.

Goal: make uncertainty feel calm instead of broken.

Do:
- Replace debug-forward wording with user-facing states:
  - finding options
  - narrowing to six
  - explaining picks
  - checking details
- Keep diagnostics expandable and secondary.
- Add empty/weak-result copy that suggests the next action.
- Ensure backend HTML/API-base mistakes still produce readable messages.
- Keep progress honest. Do not imply enrichment is complete before it is.

Likely files:
- `src/search/SearchProgressStatus.jsx`
- screen-level wrappers
- `src/search/useMobileSearchController.js` only where state shape truly needs it

Done when:
- Loading and failure states are understandable without exposing implementation noise first.

## Deferred until after V1 polish
- Bottom tabs.
- Saved, profile, history, compare.
- Heavy onboarding or account/login flow.
- User-facing search history.
- Analytics UI or timing panel polish.
- Exact confidence percentages.
- A full compare mode.
- Deep links.
- Broad persistence beyond the current store preference.
- TanStack Query migration unless it directly simplifies a UI slice.

## Verification rhythm
For each implementation slice:
- Run `npx expo export --platform android --output-dir .expo-export-check`.
- Remove `.expo-export-check` after the check.
- Run direct `node --check` on touched `.js` files where applicable.
- Manually verify in Expo Go for behavior that needs a device.
- Update `project-notes/current-status.md` after meaningful changes.
- Update `project-notes/session-handoff.md` if a fresh chat would otherwise be misled.

Use normal `npx expo start --lan` for ordinary UI/code edits. Use `npx expo start --clear --lan` after env changes, package changes, moved imports/files, or stale transform errors.

## Open decisions to make as we build
- Whether preview results should remain visible by default on mobile or move behind a reveal.
- Whether the first ranked pick should be slightly expanded or all six should be equal height.
- Whether the first-run store prompt belongs inline, in a lightweight sheet, or in Settings after first choice.
- Whether retry feedback should eventually become a bottom sheet.
- Whether product detail needs a sticky bottom CTA after the basic detail screen feels good.

Make these decisions by testing the actual app flow, not by treating any mockup as final.
