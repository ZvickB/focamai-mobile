# Mobile UI/UX Direction

## Purpose
- Capture the intended mobile product direction before rebuilding the real UI.
- Use the web app as product behavior reference, not as the target layout.
- Use the current mockups as mood and structure inspiration, not as fixed screens.
- Keep this separate from endpoint verification work.

## Implementation note
- For actual UI/UX build order, use `mobile-ui-ux-plan.md`.
- This file remains the principles and visual-direction reference.
- `proposed-layout.md` and the PNG mockups remain brainstorming inputs, not final specs.

## Current stance
- First prove the mobile endpoint flow works reliably:
  - discovery
  - refine
  - finalize
  - enrichment
  - query-quality suggestion
  - retry advice
- Then design the mobile UI/UX intentionally around native mobile patterns.
- Do not directly port the full web homepage UI.
- Do not rebuild the old mobile debug harness.
- Do not add heavy feature surfaces before the data path is proven.
- Treat Amazon as the current primary commerce path and affiliate target, while keeping Focamai's product identity focused on calm decision support rather than Amazon's browsing experience.
- The mobile app should read clearly as the mobile version of Focamai, not a separate brand or luxury-shopping spinoff.
- It should still feel like a native mobile app, not a PWA or a responsive copy of the website.

## What The Mockups Communicate
- Calm expert shopping, not marketplace shopping.
- A trusted product advisor that narrows choices before the user enters a retailer.
- Premium but quiet: soft white/cream surfaces, deep green trust color, small orange emphasis, spacious layout, clear cards.
- Decision support over browsing: confidence, reasons, caveats, and comparison signals matter more than endless product rows.
- The strongest feeling is: "I told it what I need, and it gave me a focused answer I can understand."

## What To Keep From The Mockups
- Natural-language search as the first action.
- A visible promise around 6 focused picks.
- A results summary that reflects the user's priorities.
- Ranked rows that make the 6 picks easy to scan on a phone.
- Clear "why this fits" reasoning.
- Honest caveats near the recommendation, not hidden in a detail page.
- Compact evidence chips, such as budget, use case, must-have feature, confidence.
- Large product imagery once real product cards are introduced.
- A clean result-detail screen with:
  - product facts
  - fit reason
  - caveat
  - key features
  - retailer CTA
  - affiliate/availability note

## What To Change Or Avoid
- Do not make the app feel like Amazon with a nicer skin.
- Avoid too many persistent tabs early. Search, picks, compare, saved, history, and profile imply product areas that may not exist yet.
- Avoid exact percentage scores unless the score has a clear source and meaning. Prefer labels such as "Strong match", "High confidence", or "Good fit for your priorities".
- Avoid overconfident "Top Pick" treatment if the app cannot explain why the first item is clearly stronger than the rest.
- Do not force generic CTA copy when the active source is Amazon. Amazon-specific labels such as "View on Amazon" are acceptable where they improve clarity, trust, or conversion, as long as Amazon does not become the app's visual identity.
- Avoid making onboarding too heavy. The first useful experience should be search.
- Do not introduce a new editorial serif as a core brand font.
- Do not let the mockup polish drift the app too far away from the existing Focamai vibe.
- Keep the UI honest about AI limits. Confidence should not imply certainty.

## What To Import From Web
- Product behavior and flow:
  - search starts with one product query
  - discovery and refine run in parallel
  - preview results are distinct from focused picks
  - focused picks are capped at 6
  - finalize locks the shortlist
  - enrichment explains the locked picks later
  - retry advice suggests a better next query
  - query-quality suggestion can propose a better search without replacing results automatically
- Endpoint contracts:
  - `GET /api/search/rainforest-discover`
  - `GET /api/search/refine`
  - `POST /api/search/finalize`
  - `GET /api/search/enrichment`
  - `GET /api/search/query-quality`
  - `POST /api/search/retry-advice`
- Small pure logic where useful:
  - result badge logic from `resultPresentation.js`
  - user-facing reason/description filtering from `homeContentUtils.js`
  - search input validation from shared search-input logic
- Trust principles:
  - provider-flexible result data and backend flow
  - Amazon-first UX today when Amazon is the active source
  - Amazon is the current source path, not Focamai's brand identity
  - clear affiliate disclosure near outbound links
  - prices and availability may change
  - search history remains internal telemetry, not user-facing history

## What To Make Fresh For Mobile
- Screen structure and navigation.
- Search input layout and keyboard behavior.
- Refinement interaction.
- Results presentation.
- Product detail screen or bottom sheet.
- Loading states.
- Empty and weak-result states.
- Retry flow UI.
- Query-quality suggestion UI.
- Any saved/profile/history surfaces.

## Explicit Web-To-Mobile Divergences
- Preserve the web behavior contract, not the web screen composition.
- Preserve the Focamai brand, but use native mobile interaction patterns.
- Navigation:
  - Web has a public site shell and page navigation.
  - Mobile should use a minimal app navigation model centered on the search flow.
  - Legal/static pages should be accessible but should not drive the app shell.
- Refinement:
  - Web expands refinement inside the homepage form.
  - Mobile may use a distinct step, expanding panel, or sheet-like section after search.
  - Do not assume the web form layout is the mobile answer.
- Preview results:
  - Web exposes `Show products now`.
  - Mobile should keep preview behavior available only if it helps endpoint/product parity.
  - Treat preview as a secondary escape hatch, not the main result path.
- Confidence:
  - Mockups show percentages, and web has badge labels.
  - Mobile should prefer confidence labels plus explanation unless a real scoring model supports exact numbers.
  - Avoid fake precision.
- Compare:
  - Do not add a Compare tab or compare mode just because the mockups imply it.
  - Defer compare until it is a real designed feature.
- Saved, profile, and history:
  - Do not add these as primary navigation until the product actually supports them.
  - Current `search_history` is internal telemetry, not user-facing history.
- Loading and progress:
  - Web uses skeleton grids and scroll positioning.
  - Mobile should use native staged progress states, such as finding options, narrowing to 6, and explaining picks.
  - Do not copy desktop skeleton grid behavior directly.
- Enrichment:
  - Web hydrates the modal.
  - Mobile should hydrate the native product detail screen in place.
  - Do not block the results list while enrichment is still running.
- Retry:
  - Web retry lives under the results section.
  - Mobile may work better as a short repair step or bottom sheet: what felt off, suggested query, start new search.
- Onboarding/home:
  - Web is a homepage.
  - Mobile can have a first-run onboarding session because native apps can remember completion.
  - Onboarding should be lightweight and should not become a permanent landing page.
- Static pages:
  - Web has full public pages.
  - Mobile should keep Privacy, Affiliate Disclosure, Contact, and related pages readable but secondary.

## Proposed Mobile Flow
1. Search
   - Start with the wordmark, one natural-language input, and a strong submit action.
   - Example chips can help users understand what to type.
   - Optional preference rows can exist later, but the first flow should stay lightweight.

2. Refine
   - After submit, show one focused follow-up question.
   - Let the user type natural-language notes.
   - Keep an escape hatch: show preview results now.
   - Make it clear that "focused picks" are stronger than preview results.

3. Results
   - Present "Here are your 6 best picks" as the main result state.
   - Show a compact summary of the user's main priorities.
   - Prefer ranked rows over a mobile grid.
   - Avoid a fixed giant top-pick hero as the default result pattern.
   - Consider a focused active row: as the user scrolls, the most prominent visible row can get a larger image and a little more detail.
   - Use stable rows/cards that can survive missing image, missing rating, or unknown review count.

4. Detail
   - Prefer a fresh native detail screen over a web-style modal.
   - Show facts immediately.
   - Hydrate fit reason and caveat when enrichment lands.
   - Keep the retailer CTA and affiliate/availability note together.

5. Recover
   - If results feel off, ask what felt wrong.
   - Show a suggested better query and let the user edit/start it.
   - Do not turn retry into endless result browsing.

## Suggested V1 Navigation
- Keep navigation minimal until the main flow is strong.
- Recommended early nav:
  - Search
  - Picks/results state inside the Search flow
  - Product detail as a normal stack screen opened from a result card
  - Legal/static pages reachable from a simple menu
- Defer:
  - Saved
  - Profile
  - Compare
  - User-facing History

## Visual Direction
- Background: warm white or very pale mist, not a busy gradient.
- Primary color: deep green/teal for trust and action.
- Accent: restrained orange for emphasis, not large saturated blocks.
- Cards: soft surfaces, subtle border, restrained shadow.
- Icons: simple line icons, used for meaning rather than decoration.
- Typography: keep Manrope as the primary mobile typeface.
- Do not treat the mockups as a typography rebrand.
- Use type weight, size, spacing, and color for emphasis instead of switching font personalities.
- Overall vibe should stay recognizably Focamai: calm, practical, focused, trusted, and lightly polished.
- Product images: use real product imagery when available, with graceful fallback.

## Native Mobile Feel
- Do not make the app feel like a packaged website.
- Use native app patterns:
  - stack navigation for drill-in detail screens
  - `FlatList` for result rows
  - native-feeling loading and empty states
  - safe-area-aware layouts
  - keyboard-aware search/refinement input
  - clear Android back behavior
  - bottom sheets only for small secondary interactions
  - touch-sized rows and controls
- Avoid web carryovers:
  - desktop-style header/nav shell
  - hover-driven affordances
  - dense card grids on phone
  - web modal overlays for rich detail pages
  - homepage-style marketing sections inside the app flow
- Rationale: mobile should be brand-compatible with Focamai web while feeling purpose-built for a phone.

## First-Run Onboarding
- Add a mobile-only first-run onboarding session before the main search screen.
- Keep it short, practical, and skippable.
- It should explain what to expect:
  - tell Focamai what product you are looking for
  - answer one optional follow-up
  - get 6 focused picks
  - open a pick to see why it fits and what to watch out for
  - leave for the retailer only when ready
- Avoid turning onboarding into a glossy marketing carousel.
- Avoid requiring account creation.
- Avoid overexplaining AI.
- Recommended shape:
  - 2 or 3 short screens maximum
  - clear `Skip` action
  - final CTA: `Start searching`
  - persist completion with AsyncStorage when persistence is reintroduced
  - make it reachable later from a help/settings surface if that surface exists
- Rationale: this is useful on native mobile because a first-run app session can teach the flow once, then disappear. Web does not need the same pattern.

## Amazon-First UX, Flexible Internals
- Mobile should not feel like an Amazon clone or marketplace wall.
- Amazon is the current primary commerce path and affiliate target.
- When the active source is Amazon, user-facing copy, CTA labels, and detail UI may say Amazon directly where it improves clarity, trust, or conversion.
- Do not force generic labels like "retailer" when "Amazon" is more accurate for the current experience.
- Avoid Amazon-specific navigation, iconography, colors, or screen names that would make Amazon feel like Focamai's brand identity.
- Keep result data normalized around product facts and fit, not marketplace branding.
- Keep backend/provider logic and normalized product data provider-flexible so another source can be added or swapped later.
- If more retailers become active, revisit frontend labels and CTA copy based on the real source mix instead of prematurely abstracting today's Amazon-first flow.
- Affiliate disclosure should stay clear and close to outbound CTAs, but it should support trust rather than make the whole app feel Amazon-branded.
- Rationale: Focamai's product promise is helping users narrow choices before leaving to shop. Amazon is the current commerce path, not the destination for the product identity.

## Open Design Questions
- Should mobile start with a short brand intro screen, or go directly to search?
- Should refinement be a dedicated step screen, an expanding card, or a bottom sheet?
- Should the top pick be visually larger than the other five, or should all six stay more equal?
- How much comparison should exist in v1 before a real compare feature exists?
- How should confidence be represented without fake precision?

## Product Detail Strategy
- Web can keep using its modal because it works well for desktop scanning and quick comparison.
- Mobile should not directly port that modal pattern.
- Use a normal native stack detail screen for product details:
  - result card tap navigates to `ProductDetail`
  - the screen has a clear back action
  - content scrolls naturally
  - enrichment hydrates in place
  - retailer CTA and affiliate/availability copy stay close together
- Use bottom sheets only for smaller secondary interactions, such as:
  - confidence explanation
  - affiliate disclosure details
  - preference picker
  - retry feedback prompt
- Rationale: mobile product details need enough room for image, facts, fit reason, caveat, feature bullets, CTA, and disclosure. A full screen should feel calmer and less cramped than a modal or sheet.

## Results List Strategy
- Use a ranked list instead of a grid on mobile.
- Do not make the UI depend on a single large "Top Pick" hero.
- The shortlist should feel like six strong options, not one winner and five leftovers.
- Explore a focused-row pattern:
  - all 6 results are rows
  - the most prominent visible row can expand slightly
  - the focused row may show a larger image, a fuller reason, and confidence text
  - the other rows stay compact for fast scanning
- Keep the first implementation simple:
  - FlatList rows
  - stable row heights if possible
  - no pinned morphing hero image
  - no complex scroll animation until basic rows are verified
- Rationale: rows preserve title, price, reason, and confidence better on a phone than a two-column grid. A focused visible row gives some of the mockup's premium product-image feel without overclaiming that one item is the definitive top pick.

## Near-Term Recommendation
- Finish endpoint verification first.
- Then extract a thin mobile search data layer from the temporary scaffold.
- Then build fresh native UI slices against that data layer.
- This UI direction has already been thought through here; future implementation should use this doc instead of treating the mobile UX as a blank slate.
- Wire each UI slice as it is built rather than designing the whole polished UI first and connecting everything at the end.
- Start with no bottom tab bar.
- Start with no user-facing history/profile/saved/compare.
- Make the first polished UI slice:
  - search input
  - one follow-up prompt
  - focused-picks loading state
  - 6 lightweight ranked result rows
  - one native product detail screen
