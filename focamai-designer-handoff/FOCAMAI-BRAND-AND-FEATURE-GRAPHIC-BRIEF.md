# Focamai Brand and Feature Graphic Brief

## Scope

This review covers the current `focamai-mobile` application and its sibling `focama-web` product reference. Everything under `store-listing/` was deliberately excluded. No existing Play Store feature graphic, archived promotional composition, or store-listing asset was used as inspiration.

## 1. What the app does

Focamai is an AI-assisted product decision tool. Instead of dropping users into a crowded marketplace, it begins with one natural-language question: what are you shopping for? It then asks one focused follow-up about preferences, must-haves, or deal breakers before narrowing the search to six useful product picks.

The result is a ranked shortlist rather than an endless catalogue. Each recommendation combines ordinary product facts with an explanation of why it fits the user's needs and an honest caveat under “Worth knowing.” Users can inspect a product in detail and then leave for Amazon when ready. Amazon is currently the primary commerce destination, but it is deliberately not the visual or conceptual identity of the app.

The key product promise is relief from shopping noise: tell Focamai what matters, receive a manageable answer, understand the tradeoffs, and make the final decision yourself.

## 2. Overall visual identity

### Colors

The palette feels warm, composed, and trustworthy.

| Role | Color | Typical use |
|---|---|---|
| Primary ink | `#14222B` | Primary text and dark icons |
| Primary teal | `#0F6175` | Actions, links, and active states |
| Secondary teal | `#2F7F8A` | Supporting accents and borders |
| Ember orange | `#E59B26` | Small moments of emphasis |
| Mist | `#FBF7EF` | Main warm-ivory background |
| Cream | `#FCF9F3` | Quiet cards and panels |
| Warm border | `#E4D7C6` | Dividers, frames, and surface outlines |

Teal carries trust and action. Orange is a spark, not a field color: the highlighted “6,” a progress step, a short underline, or a shopping-oriented moment. Large saturated orange areas would feel off-brand.

### Typography

- Manrope is the canonical app typeface.
- Headings generally use semibold rather than heavy bold.
- Body copy remains open, practical, and highly readable.
- The mobile hero scale is approximately 28–32px.
- Supporting language commonly sits around 15–16px with generous line height.
- Small uppercase eyebrows are used sparingly.
- The wordmark supplies the most expressive typography; the interface stays restrained.

The web code still contains some Instrument Sans usage in its global and boot layer, but the documented brand direction and mobile implementation clearly favor Manrope.

### Spacing

- Spacious rather than sparse.
- Standard mobile gutters are 24px, tightening to 16px on compact phones.
- Major vertical sections use roughly 16–20px gaps.
- Cards generally have 20px internal padding.
- Controls are comfortably touch-sized, usually at least 52px high.
- Rounded corners are consistent: approximately 18–22px for cards, inputs, images, and buttons.
- Whitespace reduces cognitive load rather than merely suggesting luxury.

### Iconography

- Simple Lucide line icons.
- Usually 20–24px with medium, consistent strokes.
- Teal or ink depending on context.
- Icons explain actions or information; they are not decorative filler.
- Product imagery is framed plainly and given room to breathe.
- Amazon colors, logos, and marketplace-style badge clutter are intentionally avoided.

### Design philosophy

Focamai is a decision aid, not a storefront. The interface progressively reveals complexity:

1. Start with one strong input.
2. Ask one useful follow-up.
3. Return six ranked answers.
4. Explain fit and tradeoffs.
5. Send the user to the retailer only when they choose.

The hierarchy favors reasoning over merchandising. Product titles are normalized, metadata is quiet, exact confidence percentages are avoided, and caveats are treated as a trust feature rather than bad news.

### Personality

- Calm
- Thoughtful
- Capable
- Practical
- Honest
- Lightly polished
- Never pushy
- More trusted research assistant than shopping influencer

Its implicit voice is: “Here are the options that appear to fit, here is why, and here is what you should double-check.”

## 3. Files that best represent the brand

Copies of these references are included in this bundle. Their original repository paths are listed below.

### Mobile

- `project-notes/design-system.md`
- `project-notes/mobile-ui-ux-direction.md`
- `assets/wordmark.png`
- `assets/app-icon.png`
- `assets/adaptive-icon-foreground.png`
- `tailwind.config.js`
- `src/components/MobileUI.jsx`
- `src/screens/SearchScreen.jsx`
- `src/search/SearchRefineSection.jsx`
- `src/screens/ResultsScreen.jsx`
- `src/search/SearchResultRows.jsx`
- `src/search/SearchResultDetailMetadata.jsx`

### Web

- `../focama-web/project-notes/doc_briefs.md`
- `../focama-web/project-notes/app_flow.md`
- `../focama-web/src/assets/wordmark.PNG`
- `../focama-web/src/assets/logo_master_version.svg`
- `../focama-web/src/assets/logo_header_mark.svg`
- `../focama-web/src/components/home/HomeExperience.jsx`
- `../focama-web/src/components/home/results-components.jsx`
- `../focama-web/src/components/home/ProductDetailModal.jsx`

## 4. Most important assets to share with a designer

1. Primary PNG wordmark: `brand-assets/wordmark.png`
2. Vector master logo: `brand-assets/logo-master.svg`
3. Compact vector logo mark: `brand-assets/logo-header-mark.svg`
4. App icon: `brand-assets/app-icon.png`
5. Adaptive icon foreground: `brand-assets/adaptive-icon-foreground.png`
6. Color, type, spacing, and surface specification: `brand-references/mobile-design-system.md`
7. A fresh high-resolution capture of the current Search screen.
8. A fresh capture of Results with six realistic picks and the selected-result panel visible.
9. A fresh capture of Product Detail showing both “Why this pick” and “Worth knowing.”
10. A fresh Refine-screen capture with meaningful preference chips and a realistic note.

The repository does not contain approved, current screenshots of those live screens. They should be captured from the running app and added to `fresh-screen-captures/`. Old mockups were intentionally not substituted.

## 5. Best screens for a Play Store feature graphic

### Primary: Results

This is the strongest proof of the product promise. It visibly demonstrates six focused picks, a ranked and manageable shortlist, real product imagery, a selected recommendation, short fit explanations, and a calm alternative to a marketplace grid.

Use the heading and selected-product area, plus enough of the ranked list to communicate “six,” rather than showing the entire long screen.

### Secondary: Product Detail

The detail screen contains Focamai's most distinctive value:

- “Why this pick”
- “Worth knowing”
- Price, rating, and product facts
- A clear path to Amazon without making Amazon the hero

A crop containing the product image, title, and the two explanation sections communicates more than a generic product card.

### Supporting: Search

The Search screen establishes the low-effort entry point: one natural-language input and “Find picks.” It works best as a smaller supporting phone or background layer rather than as the sole hero screen.

### Optional: Refine

Refine is useful when the creative concept emphasizes personalization. Show the question, three preference chips, and notes input. Avoid including all four stages in one graphic; that would recreate the complexity Focamai is meant to remove.

## 6. The two-second message

The user should immediately understand:

> **Describe what you need. Get 6 focused picks—with reasons.**

An equally strong, more emotional version is:

> **From shopping noise to 6 focused picks.**

The image should reinforce three things without requiring close reading:

- The user starts with ordinary language.
- Focamai narrows the field to six.
- The recommendations are explained, not merely displayed.

“AI shopping” by itself is too generic. “Six focused, explained picks” is the differentiator.

## 7. Three fresh creative directions

### Direction 1: From Noise to Six

A visual transformation from crowded, indistinct shopping clutter on one side into six calm, ordered recommendation rows on the other. The transition could follow the orange swoosh from the logo, acting as a funnel through the composition.

**Headline:** “From shopping noise to 6 focused picks.”

**Visual character:** Dynamic but controlled; ivory background, fading grey clutter, crisp teal shortlist.

**Best screen:** Results.

**Why it works:** It communicates the problem and solution before the viewer reads the small UI.

### Direction 2: Tell Us What Matters

Make the natural-language request the hero. A large query such as “A quiet coffee grinder under $150 for a small kitchen” flows through three compact preference chips into a phone displaying the shortlist.

**Headline:** “Tell us what matters.”

**Supporting line:** “Focamai narrows it to six.”

**Visual character:** Conversational, spacious, editorial; oversized typography with one clean device crop.

**Best screens:** Search or Refine leading into Results.

**Why it works:** It differentiates Focamai through guided understanding rather than product inventory.

### Direction 3: Reasons, Not Just Results

Center one beautifully cropped product-detail screen. Pull “Why this pick” and “Worth knowing” slightly outside the device as two balanced editorial callouts—teal for fit, restrained orange for the caveat.

**Headline:** “Picks with reasons. And caveats.”

**Visual character:** Confident, intelligent, trust-led; fewer elements and more negative space.

**Best screen:** Product Detail.

**Why it works:** It makes honesty the brand differentiator and avoids looking like another AI search or affiliate-shopping app.

## Suggested feature-graphic hierarchy

For the strongest first concept, begin with Direction 1:

1. Wordmark in a quiet upper corner.
2. Large headline: “From shopping noise to 6 focused picks.”
3. Results screen as the central proof.
4. A restrained visual transition from noise to order.
5. No Amazon logo, ratings explosion, discount badges, or marketplace collage.

The feature graphic should feel like a single confident idea, not a miniature app walkthrough.
