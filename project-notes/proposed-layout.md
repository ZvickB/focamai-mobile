# Proposed Mobile Layout

## Overview

The app has four screens connected in a simple stack. No bottom tabs, no side nav, no extra surfaces in v1.

```
Search → Follow-up → Results → Pick detail
            ↓ skip               ↓ back
          Results              Results
```

---

## Screen 1 — Search

**Mockup reference:** `ChatGPT Image May 13, 2026, 07_13_46 PM.png`

**One job:** get the user's query and submit it.

```
┌─────────────────────────┐
│  Focamai                │  ← wordmark, small
│                         │
│  What are you           │
│  looking for?           │  ← big headline
│                         │
│  ┌─────────────────┐    │
│  │ Type here...    │    │  ← TextInput, full width
│  └─────────────────┘    │
│                         │
│  [noise cancelling]     │
│  [laptop for students]  │  ← example chips, optional
│                         │
│        [ Search → ]     │  ← button
└─────────────────────────┘
```

Nothing else on this screen. No marketplace picker, no settings, no tabs. The user's only action is typing and submitting.

---

## Screen 2 — Follow-up question

**No dedicated mockup** — closest reference is the search screen mockup showing the refinement area.

**One job:** show the AI's one follow-up question and collect the user's answer.

```
┌─────────────────────────┐
│  ← Back                 │
│                         │
│  One quick question     │  ← small label
│                         │
│  "What's your budget,   │
│   and is this for home  │
│   or office use?"       │  ← AI question, prominent
│                         │
│  ┌─────────────────┐    │
│  │ Your answer...  │    │  ← TextInput
│  └─────────────────┘    │
│                         │
│  [ Get my picks → ]     │
│                         │
│  Skip — show results    │  ← small escape hatch
│  without refining       │
└─────────────────────────┘
```

This screen appears after the user submits a query. The AI's question comes from the refine endpoint. The skip link should still trigger finalize — it just sends without follow-up notes.

---

## Screen 3 — Results

**Mockup reference:** `ChatGPT Image May 13, 2026, 07_13_39 PM.png`

**One job:** show the 6 picks clearly enough that the user can choose one to look at.

```
┌─────────────────────────┐
│  Your 6 picks           │  ← headline
│  [budget] [office use]  │  ← chips reflecting their query
│                         │
│  ┌───────────────────┐  │
│  │ 1  Sony WH-CH720N │  │  ← first row, slightly larger
│  │    $149 · ★4.3    │  │
│  │    Fits your...   │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 2  Bose QC45      │  │  ← standard rows
│  │    $179 · ★4.5    │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 3  ...            │  │
│  └───────────────────┘  │
│         ...             │
│                         │
│  These don't feel right?│  ← retry, small, at bottom
└─────────────────────────┘
```

Use a `FlatList` of ranked rows. The first row can be slightly taller or show one line of fit reason — the others stay compact. Do not make rank 1 a large hero card; the mockup shows it as first among equals, not a definitive winner.

Confidence labels should use words ("Strong fit", "Good match"), not percentages. See `mobile-ui-ux-direction.md` for the reasoning.

---

## Screen 4 — Pick detail

**Mockup reference:** `ChatGPT Image May 13, 2026, 07_13_14 PM.png`

**One job:** give the user enough to decide whether to buy this pick.

```
┌─────────────────────────┐
│  ← Back                 │
│                         │
│  [product image]        │  ← large, graceful fallback
│                         │
│  Sony WH-CH720N         │  ← title
│  $149.99                │
│  ★ 4.3  (2,847 reviews) │
│                         │
│  Why this pick          │
│  "You asked for noise   │
│   cancellation under    │
│   $200 for office use.  │
│   This model hits..."   │
│                         │
│  Worth knowing          │
│  "Doesn't fold flat.    │
│   If portability is a   │
│   priority, see #3."    │
│                         │
│  Key features           │
│  • Dual sensor ANC      │
│  • 30hr battery         │
│  • ...                  │
│                         │
│  [ Check price → ]      │  ← CTA, prominent
│  Prices may vary.       │
│  [Affiliate disclosure] │
└─────────────────────────┘
```

This is a normal stack screen, not a modal or bottom sheet. "Why this pick" and "Worth knowing" come from the enrichment endpoint — show them when they arrive, show a placeholder until then. The retailer CTA and disclosure note stay together at the bottom.

---

## What to build first

The data layer already works. Build in this order:

1. **Screen 3 (Results)** — most important, real data available now
2. **Screen 4 (Pick detail)** — basic version already exists, needs real design
3. **Screen 1 (Search)** — straightforward input screen
4. **Screen 2 (Follow-up)** — needs refine endpoint data, build last

---

## What is explicitly deferred

- Bottom tab bar
- Compare feature
- Saved / profile / history
- Onboarding splash (mockup `ChatGPT Image May 13, 2026, 07_13_58 PM.png` is the reference when this is added — keep it 2-3 screens max, skippable)
- Marketplace/retailer picker (exists in controller but not in main UI yet)
- Percentage-based confidence scores

See `mobile-ui-ux-direction.md` for the full reasoning behind each deferral.
