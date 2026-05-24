# UI Polish Plan

## Purpose
- Track the remaining UI coherence work after the May 20 UI system pass.
- Keep future polish aligned with the app rules: warm cream canvas, teal primary actions, restrained orange accents, airy cards, calm density, and trusted-assistant voice.
- This is a working note, not a product behavior roadmap.

## Current baseline
- `src/components/MobileUI.jsx` now owns the main shared primitives:
  - `ScreenContainer`
  - `AppHeader`
  - `HeaderBackButton`
  - `IconButton`
  - `ScreenIntro`
  - `Surface`
  - `SectionHeader`
  - `Button`
  - `Pill`
  - `QuietStatusPanel`
  - `ProductImageFrame`
- Search, Follow-up, Results, Detail, Settings, Region, and static info/legal screens have been pulled toward the same visual rhythm.
- Refine notes now allow/clamp to 500 characters, and the internal hard-constraint refresh query is capped separately so long AI chip prompts do not trip the 80-character discovery query limit.
- Follow-up, Results, and Detail now use the same shared header frame so back buttons and wordmarks do not drift across screen sizes.

## Remaining polish

### 1. ~~Add semantic design tokens~~ — **Done**
`project-notes/design-system.md` and `src/theme/themeTokens.js` now own the semantic tokens (spacing, radii, surface colors). `MobileUI.jsx` primitives use them consistently.

### 2. Create a shared input surface
Search and Refine inputs now look related, but they are still custom implementations.

Do:
- Extract a shared input surface for:
  - left icon
  - optional disabled mic affordance
  - single-line search mode
  - multiline refine mode
  - consistent placeholder color, radius, border, padding, shadow, and icon treatment
- Keep behavior screen-owned. The shared component should not own search/refine logic.

Done when:
- Search query input and Follow-up notes input use the same visual primitive.
- Future prompt-style inputs do not invent new card shapes.

### 3. Replace scary error-screen paths with inline recovery
The current backend/validation failure path can still feel too harsh. This needs a dedicated UX pass.

Do:
- Convert expected guided-flow errors into calm inline panels:
  - product query too long
  - refine notes too long
  - backend returned HTML instead of JSON
  - finalize failed
  - hard-constraint refresh failed
  - enrichment timeout or partial data
- Keep raw diagnostics behind an expandable details area.
- Keep user copy practical: what happened, what to do next, and whether their current search can continue.

Done when:
- A recoverable API or validation issue does not dump the user into a scary full-screen error experience.
- Search, Refine, Results, and Detail each have a reasonable local recovery state.

### 4. Decide the progress cue pattern
Refine currently has a visible progress cue. Results has status only in certain states. Detail mostly relies on the header.

Do:
- Decide whether the app should use:
  - a tiny consistent progress cue on Refine and Results, or
  - no persistent progress cue after Search, relying on headers and content instead.
- Avoid making the app feel like a checkout funnel or dashboard.

Done when:
- Moving Search -> Refine -> Results -> Detail feels intentional and not visually jumpy.
- Progress does not compete with the main task on each screen.

### 5. Tighten result/detail hierarchy
Results and Detail are the core product moment and should be checked with real messy data.

Do:
- Verify consistent order for:
  - title
  - price
  - rating/reviews when available
  - fit reason
  - caveat
  - feature notes
  - retailer CTA/disclosure
- Make missing image, missing price, missing rating, and missing enrichment notes feel intentional.
- Keep results from becoming retailer listing copy.
- Keep the first pick prominent without over-certifying it.

Done when:
- A user can scan six picks calmly.
- Detail explains the decision without feeling dense or salesy.

### 6. Manual Expo Go visual pass
Automated checks cannot catch the remaining polish issues.

Do:
- Test on a small phone width and a larger phone/tablet width.
- Check:
  - Search -> Follow-up -> Results -> Detail header alignment
  - long product titles
  - missing images
  - missing price/rating/reviews
  - fewer than six results
  - long AI refinement chip prompts
  - detail footer with and without retailer link
  - keyboard overlap on Search and Follow-up
  - back navigation positions across screen sizes

Done when:
- The main flow feels coherent in-hand, not just in code.

### 7. Preserve the voice standard
Copy should remain concise, honest, and assistant-like.

Do:
- Audit visible strings for marketplace/listing language.
- Avoid excessive specs, hype, confidence percentages, and Amazon-specific CTA labels.
- Keep caveats visible but not alarming.

Done when:
- Search, Refine, Results, Retry, and Detail all sound like the same calm assistant.

## Suggested next slice
Start with:
1. semantic design tokens
2. shared input surface
3. inline error/recovery UX

That order makes later polish easier and removes the biggest remaining unfinished-feeling behavior.
