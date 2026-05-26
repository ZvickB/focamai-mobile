# Codebase Efficiency Audit — 2026-05-25

Covers: component reuse, controller bloat, dead weight, test gaps, prop contract clarity,
layout consistency, and navigation contract. No code was changed for this audit.

---

## 1. Component reuse / MobileUI usage

**Overall: good.** Every screen and most search components import from `MobileUI.jsx` for
the surfaces, buttons, containers, and image frames. No foreign component library is in play.

**Exceptions worth noting:**

- **`SettingsIconButton` in `SearchScreen.jsx` (line 58–70)** duplicates `IconButton` from
  `MobileUI.jsx`. It's a hand-rolled `Pressable` with the same `h-11 w-11 items-center
  justify-center rounded-full` shape. `FollowUpScreen.jsx` correctly uses `IconButton` for
  the equivalent Settings button. The two screens are inconsistent.

- **Inline card surface in `SearchEntrySection.jsx` (lines 30–45) and `SearchRefineSection.jsx`
  (lines 147–158)** both build the same elevated search-input card shape from scratch:
  `rounded-[22px] border border-line bg-white shadow-sm` plus a hardcoded `style` block for
  `elevation/shadowColor/shadowOffset/shadowOpacity/shadowRadius`. This is the same shape in
  both files. It's not extracted into `MobileUI`. If the card shadow ever needs to change, it
  has to be updated in two places.

- **`RegionScreen.jsx` (line 60–68)** builds its own selected/unselected marketplace pill
  with inline string-interpolated class names rather than using the `Pill` component from
  `MobileUI`. Minor—`Pill` doesn't have an unselected text variant that's ink-colored—but
  worth knowing.

- **`ResultsScreen.jsx` – `ResultsTopBar` "New" button (lines 25–36)** is a one-off inline
  `Pressable` with its own shape. Not a blocking issue but it diverges from `Button`/`IconButton`.

- **`FollowUpScreen.jsx` – "Skip for now" divider row (lines 94–115)** is entirely inline
  (the ember accent lines flanking the skip action). Cosmetic-only; no extraction needed.

---

## 2. Controller bloat / responsibility split

**`useMobileSearchController.js` is 1,313 lines.** It is the single largest file in the codebase
by a wide margin (next is `SearchResultDetailMetadata.jsx` at 311 lines).

What lives in the controller:

| Concern | Lines (approx) | Assessment |
|---|---|---|
| State declarations (useState + useRef) | 1–200 | Appropriate for a hook |
| Pure helpers (createSearchSession, buildDiscoverySummary, etc.) | 30–165 | Could be module-level utils but no real gain |
| Enrichment merge + normalize helpers | 112–167 | These belong here — they operate on in-flight state |
| `startQueryQualityPolling` | 257–382 | ~125 lines. Could be extracted to a module but it's tightly coupled to refs |
| `startEnrichmentPolling` | 384–481 | ~97 lines. Same situation |
| `runDiscoverySearch` | 529–748 | ~220 lines. Largest single function; complex but coherent |
| `refreshDiscoveryForHardConstraints` | 776–902 | ~126 lines. Could theoretically extract but depends on session refs |
| `finalizeFocusedPicks` | 904–1056 | ~152 lines. Core finalize path |
| `requestRetryAdvice` | 1058–1141 | ~83 lines |
| Marketplace state management | 1191–1275 | ~84 lines |

**Verdict:** The file is long but not tangled. The functions are sequentially coherent — each
does one thing. The ref-heavy session-guarding pattern means most functions can't be moved out
without also moving the refs they depend on. This is a valid design trade-off. The length is a
maintenance signal, not a refactoring emergency.

**One genuine issue:** The `isStale` check in `requestRetryAdvice` is copy-pasted identically
between the try block (lines 1100–1106) and the catch block (lines 1118–1125). This is dead
duplication—the catch block checks the exact same staleness conditions and does the same early
return. If the staleness logic ever changes, both copies need updating.

**`searchApi.js` split is clean.** Network calls, normalization, and validation helpers are all
appropriate for this module. No controller logic leaked in.

---

## 3. Duplicated logic across files

Three variations of "coerce to string or return fallback" exist independently:

| Name | File | Behavior |
|---|---|---|
| `normalizeEnrichmentText(value)` | `useMobileSearchController.js:155` | Returns `""` for non-primitives |
| `detailValue(value, fallback)` | `SearchResultDetailMetadata.jsx:5` | Returns `fallback` for non-primitives |
| `normalizePrimitive(value)` | `SearchResultDetailScreen.jsx:122` | Returns `""` for non-primitives |
| `coerceDisplayText(value, fallback)` | `searchApi.js:148` | Most complete version, also handles object field lookup |

These four functions solve the same core problem with slightly different fallback behavior.
None of them import from each other. If a new edge case is found in one, the others won't
benefit.

**Rating logic is also duplicated:**

| Name | File | Returns |
|---|---|---|
| `formatRatingLabel(rating)` | `SearchResultRows.jsx:5` | `"X.X rating"` or `"Rating not shown"` |
| `formatRating(value)` | `SearchResultDetailMetadata.jsx:19` | `"X.X"` or `"Rating not shown"` |
| `getRatingValue(rating)` | `ResultsScreen.jsx:59` | `number` or `null` |
| `getRatingValue(value)` | `SearchResultDetailMetadata.jsx:57` | `number` or `null` |

The two `getRatingValue` functions are identical in behavior but defined in separate files.

**Review count logic is duplicated:**

| Name | File |
|---|---|
| `formatReviewLabel(reviewCount)` | `SearchResultRows.jsx:25` |
| `formatReviews(value)` | `SearchResultDetailMetadata.jsx:33` |

Similar logic, different output format ("X reviews" vs "X reviews"; same string result, different
null fallback — `""` vs `"Reviews not shown"`).

**"Pick reason" fallback logic appears in two components:**

- `SearchResultRows.jsx:43` — `getPickReason(item, featureBullets)`
- `ResultsScreen.jsx:128–132` — `SelectedResultImagePanel` inline: `item.fit_reason || item.caveat || featureBullets[0] || "A focused match for this search."`

Same logic, one is extracted, one is inline.

**`getFeatureBullets` exists in two modules:**

- `searchApi.js:300` — used during normalization
- `SearchResultDetailMetadata.jsx:51` — used during rendering

---

## 4. Dead weight

**TanStack Query is installed and completely unused.**

`App.js` imports `QueryClient` and `QueryClientProvider` and wraps the app in a provider.
No file in `src/` contains a `useQuery`, `useMutation`, or `useInfiniteQuery` call.
The dependency is dead overhead in the bundle. Until search logic is actually migrated to
TanStack Query, this is pure cost. Session notes acknowledge this explicitly.

**`HomeScreen.jsx` is a 3-line re-export of `SearchScreen`.**

It exists only for backwards-compatibility. The `Home` route in `RootNavigator.jsx` points to it.
As long as no external deep-link or navigation call uses the `Home` route name, this is risk-free
to keep, but it's worth knowing it's vestigial.

**Maestro smoke test (`maestro/smoke-shell.yaml`) asserts `search.queryInput` as a testID.**

`search.queryInput` does exist in `SearchEntrySection.jsx` (line 59). The testID match is valid.
However, Maestro is not part of the current practical workflow (no Android device, emulator not
practical), so these files are scaffolding for a future workflow, not current coverage.

---

## 5. Test coverage gaps

Files with **no corresponding test file**:

| File | Risk level | Notes |
|---|---|---|
| `src/screens/ResultsScreen.jsx` | **High** | 379 lines, complex scroll-selection logic, sticky header |
| `src/screens/SearchScreen.jsx` | Medium | Navigation coordination, marketplace prompt integration |
| `src/search/useMobileSearchController.js` | **High** | 1,313 lines of core search state logic; currently tested only indirectly |
| `src/search/SearchResultRows.jsx` | Medium | `FocusedPickRow` rendering, rating/review formatting |
| `src/search/SearchFlowContext.jsx` | Low | Thin provider wrapper |
| `src/search/SearchFlowProgressCue.jsx` | Low | Simple visual component |
| `src/search/searchPhaseEvents.js` | Low | Tiny helpers |
| `src/search/AffiliateDisclosureNote.jsx` | Low | One-line text component |
| `src/screens/HomeScreen.jsx` | None needed | 3-line re-export |
| `src/screens/SettingsScreen.jsx` | Low | Navigation-only |
| `src/screens/RegionScreen.jsx` | Low | AsyncStorage + nav, covered by `amazonMarketplaces.test.js` for the data layer |
| `src/screens/About/Contact/Privacy/AffiliateDisclosureScreen.jsx` | None needed | Static content |
| `src/navigation/RootNavigator.jsx` | Low | Config-only |
| `src/theme/themeTokens.js` | None needed | Static constants |

The two highest-risk gaps: **ResultsScreen** (the scroll-selection coordination logic has no
automated coverage) and **useMobileSearchController** (the session-guarding, stale-response,
and enrichment-polling logic are only exercised by integration through the rendered screens).

---

## 6. Prop contract clarity

**`SearchRetrySection` receives 11 props.** This is the widest prop surface in the codebase.
The props are all used, but the component is doing both presentation (retry UI) and logic
(the `deriveConstraintTags` function and `CONSTRAINT_STOP_WORDS` set, lines 8–98). The
constraint-tag logic is purely presentational and is not shared with `searchConstraints.js`,
which handles the backend-facing hard-constraint detection. The names are similar enough to
cause confusion during future changes.

**`FollowUpScreen` passes `suggestedRefinements` from `refinementPrompt?.suggestedRefinements`
directly to `SearchRefineSection`.**

`refinementPrompt` can be `null`. The optional chaining handles it safely (`undefined` falls
back to `SearchRefineSection`'s default prop). Not a bug, but the prop flow is implicit.

**`ResultsScreen` prop-drills nothing.**

It reads everything from `useSearchFlow()` directly. This is the correct pattern—no prop
threading needed between Results and its sub-components because sub-components also import
from context.

**`SearchResultDetailScreen` passes `enrichmentStatus` into two separate components
(`SearchResultDetailMetadata` and `SearchResultFeatureHighlights`).**

Both components accept it. The status string (`"idle"`, `"running"`, `"complete"`, `"timeout"`)
is an informal enum—there's no shared type or constant for the valid values. A typo in a new
phase name would render silently as the `idle` fallback copy.

---

## 7. Layout consistency — compact breakpoint

The `isCompact = width < 400` pattern is used correctly and consistently across:

- `ScreenContainer` (MobileUI)
- `AppHeader` (MobileUI)
- `HeaderBackButton` (MobileUI)
- All five stack screens
- `SearchEntrySection`, `SearchRefineSection`, `FocusedPickRow`, `SearchResultDetailHero`

**One inconsistency:** `HeaderBackButton` uses `width < 360` as its compact threshold (to hide
the label text), while everywhere else uses `width < 400`. This is intentional—hiding the back
label needs a tighter breakpoint than collapsing gutters—but it's an undocumented exception.
A future developer editing the breakpoint value in one place won't know to update the other.

**NativeWind anti-patterns: none found.** No `hover:`, `focus:`, `transition-`, or `animate-`
classes appear anywhere in the source. Clean.

---

## 8. Navigation contract

**Each screen's expected route params:**

| Screen | Expected params | Safety |
|---|---|---|
| `SearchScreen` | `selectedAmazonDomain` (optional, from Settings) | Safe — optional chained |
| `FollowUpScreen` | None | Safe |
| `ResultsScreen` | None | Safe |
| `SearchResultDetailScreen` | `candidateId`, `item` (snapshot), `rank` | **Partial** — `candidateId` and `item` can both be absent if navigated to directly; screen handles this with `UnavailableDetailState` |
| `SettingsScreen` | None | Safe |
| `RegionScreen` | None | Safe |
| Static screens | None | Safe |

**No screen uses `route.params` without a null-safety guard**, so there's no crash risk from
a missing param.

**`HomeScreen` (`Home` route) is registered in `RootNavigator` but never navigated to from any
screen.** All navigation calls use `"Search"` as the target. `Home` only exists as a registered
route for backwards compatibility. It's noise in the navigator config.

---

## Summary — priority order

| Priority | Item |
|---|---|
| **Now** | `requestRetryAdvice` has a copy-pasted `isStale` block (try + catch) — one copy is redundant |
| **Now** | `SettingsIconButton` in `SearchScreen` should use `IconButton` from `MobileUI` |
| **Before ship** | TanStack Query: remove or migrate search logic to it — don't ship dead bundle weight |
| **Before ship** | `useMobileSearchController` needs at least smoke-level unit tests for session guarding and stale-response behavior |
| **Before ship** | `ResultsScreen` scroll-selection logic needs at least one test covering the index-update path |
| **Later** | Extract the elevated search-input card shape to a `MobileUI` primitive (used identically in `SearchEntrySection` and `SearchRefineSection`) |
| **Later** | Consolidate the four "coerce to string" helpers into one shared util |
| **Later** | Consolidate the two `getRatingValue` definitions |
| **Later** | Document the enrichment status enum values as named constants |
| **Awareness only** | `Home` route in `RootNavigator` is vestigial — safe to remove when confident nothing deep-links to it |
| **Awareness only** | `HeaderBackButton` compact threshold is `360`, not `400` — intentional but undocumented |
