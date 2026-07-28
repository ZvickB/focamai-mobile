# Focamai Activity Dashboard Roadmap

## Vision

This dashboard is **not** an analytics dashboard.

Its purpose is to answer:

> **What is happening in Focamai right now, how are people using it, and
> does anything need my attention?**

Historical trends, retention, growth and business analytics remain on
the existing **Analytics** tab.

------------------------------------------------------------------------

# Guiding Principles

-   Build small, review often.
-   Reuse existing tracking wherever possible.
-   Never rewrite working analytics.
-   Prefer placeholders over guessing.
-   Every stage should leave the dashboard usable.
-   Defer complexity until real users reveal what is valuable.

------------------------------------------------------------------------

# Stages to Build Now

## Stage 1 --- Activity Tab & Dashboard Shell

Create a new **Activity** tab beside the existing Analytics tab.

Add placeholder widgets:

-   Users Today
-   Recent User Journeys
-   Recent Searches
-   Retailer Activity
-   Possible Confusion
-   Errors

Add a **Customize Dashboard** button.

Sidebar features:

-   Show / Hide widgets
-   Move widgets up/down
-   Restore default layout

Persist layout in localStorage.

------------------------------------------------------------------------

## Stage 2 --- User Identity

Implement consistent identifiers:

-   Device ID
-   Session ID
-   Account ID (when signed in)

Use these to determine:

-   New users
-   Returning users
-   Web vs Mobile

------------------------------------------------------------------------

## Stage 3 --- Shared Activity Events

Create a consistent event model for web and mobile.

Examples:

-   Search started
-   Questions completed
-   Recommendations shown
-   Product opened
-   Retailer clicked
-   Improve Picks
-   Feedback
-   Errors
-   Payment completed

------------------------------------------------------------------------

## Stage 4 --- Populate Widgets

Replace placeholders with real data.

Widgets should display operational information only.

------------------------------------------------------------------------

# Defer Until Later

Do NOT implement yet:

-   Drag-and-drop widget layout
-   Widget resizing
-   Supabase realtime
-   Amazon purchase attribution beyond existing data
-   AI-written founder summaries
-   Advanced confusion detection
-   New analytics reports
-   Cohorts
-   Retention charts
-   A/B testing
-   Complex database redesign

------------------------------------------------------------------------

# Codex Implementation Strategy

Codex should think like an engineer improving an existing product, not
creating a new one.

Rules:

1.  Inspect before editing.
2.  Reuse existing dashboard code.
3.  Keep changes localized.
4.  Avoid unnecessary refactors.
5.  Explain assumptions.
6.  Make small commits.
7.  Preserve existing analytics.
8.  Prefer incremental improvements.

------------------------------------------------------------------------

# First Prompt for Codex

Inspect both the existing Focamai web and mobile projects before making
changes.

For this task, work ONLY on the existing web dashboard.

Goals:

-   Add an Activity tab beside Analytics.
-   Build the configurable dashboard shell.
-   Add placeholder widgets:
    -   Users Today
    -   Recent User Journeys
    -   Recent Searches
    -   Retailer Activity
    -   Possible Confusion
    -   Errors
-   Add a Customize Dashboard sidebar.
-   Allow:
    -   show/hide widgets
    -   move widgets up/down
    -   restore defaults
-   Save layout in localStorage.

Constraints:

-   Do NOT change existing analytics.
-   Do NOT add database tables.
-   Do NOT add mobile tracking.
-   Do NOT add realtime subscriptions.
-   Do NOT implement purchase attribution.
-   Do NOT refactor unrelated files.
-   Use JavaScript/JSX only.
-   Use functional React components.
-   Keep styling consistent with the existing dashboard.

Before making edits:

1.  Explain the current dashboard architecture.
2.  List every file that will change.
3.  Explain why each file needs to change.
4.  Identify any uncertainties.

After implementation provide:

-   files changed
-   screenshots or description
-   testing steps
-   deferred work
