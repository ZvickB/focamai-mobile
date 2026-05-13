# Focama Mobile — Migration Roadmap

## Overview

This document is the working plan for porting the Focama web app (`../web`) to React Native using Expo.
Read it in order. Each phase has a clear goal, a file-by-file task list, and callouts for the hard parts.

**Current restart note:** on branch `restart/mobile-clean-slate`, this roadmap is a broad reference, not the active step-by-step instruction for rebuilding search. Read `project-notes/restart-strategy.md` first. The earlier attempt tried to port too much of Phase 3 at once; future work should rebuild one verified slice at a time.

**Backend stays unchanged.** The staged search endpoints serve both apps when mobile reconnects to search.
All migration work is frontend-only.

---

## Architectural Decisions (settled before writing a line of code)

| Decision | Choice | Why |
|---|---|---|
| Framework | **Expo (managed workflow)** | Removes Android/iOS build complexity. Eject later if needed. |
| Navigation | **React Navigation v7** | Standard for Expo apps; replaces React Router |
| Styling | **NativeWind v4** | Same Tailwind class syntax — minimizes relearning |
| Animations | **React Native Reanimated 3** | Replaces `motion/react`; Expo-compatible |
| Icons | **lucide-react-native** | Drop-in swap for `lucide-react` |
| Async storage | **@react-native-async-storage/async-storage** | Replaces `localStorage` (session ID persistence) |
| Random IDs | **expo-crypto** | Replaces `crypto.randomUUID()` |
| External links | **expo-linking** | Replaces `<a href target="_blank">` |
| Environment vars | **expo-constants + app.config.js** | Replaces `import.meta.env` |

---

## What Ports Cleanly vs What Gets Rewritten

### Ports with minor adaptation (~same code)
- `useGuidedSearch.js` — all state and API logic is pure JS; `fetch` works in RN
- `resultPresentation.js` — pure transformation functions, no DOM
- `analytics.js` — same logic; swap `localStorage` and `window` checks
- `SearchProgressContext.jsx` — context pattern is identical
- `validateSearchInput` (shared module) — pure JS, zero changes

### Gets rewritten but maps 1:1
- Every JSX component — HTML → RN primitives (`View`, `Text`, `Pressable`, `Image`, `TextInput`, `ScrollView`)
- Routing — React Router `<Routes>` → React Navigation stack
- `scrollIntoView` calls → `ScrollView` `ref.scrollTo()` or `FlatList` scroll
- `window.setTimeout` → `setTimeout` (global in RN, no `window.` prefix needed)
- `performance.now()` → `Date.now()` (sufficient precision for timing display)

### Genuinely new work
- Navigation stack + screen structure
- Expo project config (`app.json` / `app.config.js`)
- Keyboard-avoiding views and safe area handling
- Android back button behavior
- App icons, splash screen image
- EAS Build configuration (when ready to ship)

---

## File Mapping: web → mobile

```
web/src/                                    mobile/src/
  App.jsx                          →          navigation/RootNavigator.jsx (new)
  pages/HomePage.jsx               →          screens/HomeScreen.jsx
  pages/AboutPage.jsx              →          screens/AboutScreen.jsx
  pages/ContactPage.jsx            →          screens/ContactScreen.jsx
  pages/PrivacyPage.jsx            →          screens/PrivacyScreen.jsx
  pages/AffiliateDisclosurePage    →          screens/AffiliateDisclosureScreen.jsx
  components/home/HomeExperience   →          screens/HomeScreen.jsx (merged)
  components/home/HomeShared       →          components/home/HomeShared.jsx
  components/home/useGuidedSearch  →          components/home/useGuidedSearch.js (ported)
  components/home/resultPresentation→         components/home/resultPresentation.js (copied)
  components/ProductCard.jsx       →          components/ProductCard.jsx (rewritten)
  components/SiteLayout.jsx        →          navigation/RootNavigator.jsx (absorbed)
  contexts/SearchProgressContext   →          contexts/SearchProgressContext.jsx (ported)
  lib/analytics.js                 →          lib/analytics.js (ported)
  lib/utils.js                     →          lib/utils.js (review — may not be needed)
  assets/wordmark.PNG              →          assets/wordmark.png (same file)
  assets/logo_master_version.svg   →          assets/logo.svg (Expo supports SVG via transformer)
```

---

## Phase 1 — Scaffold the Expo App

**Goal:** Runnable hello-world on both iOS and Android simulators.

### Tasks

1. From `focama/mobile/`:
   ```bash
   npx create-expo-app . --template blank
   ```
   This writes `app.json`, `App.js`, `package.json`, etc. into the already-created `mobile/` folder.

2. Install core dependencies:
   ```bash
   npx expo install react-native-reanimated nativewind tailwindcss
   npx expo install @react-navigation/native @react-navigation/native-stack
   npx expo install react-native-screens react-native-safe-area-context
   npx expo install @tanstack/react-query
   npx expo install @react-native-async-storage/async-storage
   npx expo install expo-linking expo-constants expo-crypto
   npx expo install lucide-react-native react-native-svg
   ```

3. Configure NativeWind v4 — follow official Expo guide (requires `babel.config.js` plugin + `tailwind.config.js`).

4. Configure Reanimated — add `react-native-reanimated/plugin` to `babel.config.js`.

5. Set up `app.config.js` to expose env vars:
   ```js
   export default {
     extra: {
       apiBaseUrl: process.env.API_BASE_URL || 'https://focamai.com',
     },
   }
   ```

6. Verify: `npx expo start` opens in Expo Go on device or simulator.

### Checkpoint
- App boots, shows placeholder screen on iOS and Android.

---

## Phase 2 — Navigation Shell

**Goal:** All screens exist as stubs; you can navigate between them.

### Tasks

1. Create `src/navigation/RootNavigator.jsx`:
   - `NativeStackNavigator` with screens: `Home`, `About`, `Contact`, `Privacy`, `AffiliateDisclosure`
   - Wrap in `SafeAreaProvider`, `QueryClientProvider`, `SearchProgressProvider`

2. Create stub screens in `src/screens/`:
   - `HomeScreen.jsx` — renders `<Text>Home</Text>`
   - `AboutScreen.jsx`, `ContactScreen.jsx`, `PrivacyScreen.jsx`, `AffiliateDisclosureScreen.jsx`

3. Update `App.js` (Expo root) to render `<RootNavigator />`.

4. Add a simple header with a nav link to About so you can test navigation.

### Checkpoint
- Tapping a nav link on Home goes to About; Android back button returns.

---

## Phase 3 — Port the Logic Layer

**Goal:** `useGuidedSearch` runs in the mobile app and can make real API calls.

This phase is intentionally superseded by `project-notes/restart-strategy.md` for the clean-slate restart. Do not copy the full web hook into mobile in one pass. Rebuild discovery, refinement, finalize, enrichment, analytics, and rendering as separate verified slices.

The older checklist below is kept as reference for dependencies and RN replacements, not as the current execution plan.

### Tasks

1. Copy `web/src/lib/analytics.js` → `src/lib/analytics.js`, then adapt:
   - Remove all `typeof window === 'undefined'` guards — RN has no `window`, always assume non-browser
   - Replace `window.localStorage.getItem/setItem` → `AsyncStorage.getItem/setItem` (make async — see note below)
   - `crypto.randomUUID()` → `Crypto.randomUUID()` from `expo-crypto`
   - `import.meta.env.MODE === 'test'` → `process.env.NODE_ENV === 'test'`
   - Keep the fire-and-forget `fetch` call to `/api/analytics/track` as-is

   **Note on async session ID:** `getOrCreateAnalyticsSessionId` becomes async because AsyncStorage is async.
   Use a module-level cache variable so it only hits storage once per app session.

2. Copy `web/src/components/home/resultPresentation.js` → `src/components/home/resultPresentation.js` — **no changes needed**.

3. Copy `web/shared/search-input.js` → `src/shared/search-input.js` (or reference as a shared workspace dep — see Phase 9 note).

4. Copy `web/src/components/home/useGuidedSearch.js` → `src/components/home/useGuidedSearch.js`, then adapt:
   - Replace `window.setTimeout` → `setTimeout`, `window.clearTimeout` → `clearTimeout`
   - Replace `performance.now()` → `Date.now()` (returns ms, matches usage)
   - Remove `window.location` references (timing panel is dev-only anyway)
   - Remove `window.__FOCAMAI_DISABLE_*__` flags — replace with `__DEV__` where appropriate
   - API base URL: prefix all fetch paths (`/api/search/...`) with `Constants.expoConfig.extra.apiBaseUrl`
   - The `response.headers?.get?.('server-timing')` call works — RN's fetch exposes headers

5. Copy `web/src/contexts/SearchProgressContext.jsx` → `src/contexts/SearchProgressContext.jsx` — **no changes needed** (pure React context, no DOM).

6. Wire `QueryClientProvider` into `RootNavigator.jsx`.

### Test this phase
Write a quick test button in `HomeScreen` that calls `beginGuidedSearch` with a hardcoded query and `console.log`s the result. Confirm discovery and finalize return data before building any UI.

### Checkpoint
- Hook returns results on a real device/simulator with a hardcoded query.

---

## Phase 4 — Home Screen: Search Input + Refinement Step

**Goal:** The core search flow works end-to-end, even if it looks rough.

### Tasks

1. Port the search input area from `HomeExperience.jsx`:
   - `<form onSubmit>` → `<View>` + `<Pressable onPress>`
   - `<input>` → `<TextInput>` — add `returnKeyType="search"` and `onSubmitEditing`
   - `<textarea>` → `<TextInput multiline>` with min height
   - Add `<KeyboardAvoidingView>` wrapping the whole screen (`behavior="padding"` on iOS, `"height"` on Android)

2. Port the refinement step copy (`RefinementCopy` component):
   - The streaming helper text effect uses `setInterval` — works in RN unchanged
   - `AnimatePresence` / `motion.p` → `Animated.View` with opacity transitions, or `react-native-reanimated`

3. Port the step indicator ("Search · Refine · Get 6 picks"):
   - Simple `<Text>` row with conditional styles

4. Port the wordmark image:
   - `<img src={wordmark}>` → `<Image source={require('../assets/wordmark.png')} />`

5. Port the "loading" pulse indicator (animated dot):
   - Use Reanimated `useSharedValue` + `withRepeat(withTiming(...))` — direct replacement for CSS `animate-soft-pulse`

6. Port error message display.

### Hard parts to watch
- **No `scrollIntoView`**: Replace all scroll-on-state-change effects with a `ScrollView` `ref` and `scrollTo({ y: targetY, animated: true })`. You'll need to measure element positions with `onLayout` to find `targetY`.
- **Keyboard covers input**: `KeyboardAvoidingView` handles this on iOS. On Android, `android:windowSoftInputMode="adjustResize"` in `app.json` is also needed.
- **Shimmer animation** (the loading bar): `animate-shimmer` CSS animation → Reanimated `withRepeat(withSequence(...))` on `translateX`.

### Checkpoint
- Can type a query, submit, see the refinement step appear, type follow-up, tap "Show focused picks", see loading state.

---

## Phase 5 — Product Cards + Results Grid

**Goal:** Final results display correctly as a scrollable card grid.

### Tasks

1. Port `ProductCard.jsx`:
   - `<Card>` (shadcn) → `<View>` with border radius and shadow styles via NativeWind
   - `role="button"` + `onClick` → `<Pressable>` wrapping the card
   - `<img>` → `<Image>` with `resizeMode="contain"`; `onError` fallback works the same
   - Star rating: `lucide-react-native` has `Star` — import it directly
   - `<Badge>` → `<View>` with rounded styles + `<Text>`
   - `<a href>` retailer link → `<Pressable onPress={() => Linking.openURL(link)}>`
   - "Tap for details" / "Click for details" → just "Tap for details" (always; no pointer detection needed)
   - `hover:` classes from NativeWind don't apply on mobile — remove or replace with `Pressable`'s `onPressIn`/`onPressOut` scale effect

2. Port `ResultsSection` from `HomeShared.jsx`:
   - Results grid (`grid-cols-1 sm:grid-cols-2`) → `FlatList` with `numColumns={2}` on wider screens, `1` on phone
   - Use `Dimensions.get('window').width` to decide column count
   - `ResultSkeleton` → `<View>` with animated shimmer background

3. Port "previous results" and retry feedback UI from `HomeShared.jsx`.

4. Port `ProductDetailModal`:
   - Web: absolute overlay with `AnimatePresence`
   - Mobile: use a React Navigation modal screen (`presentation: 'modal'`) — cleaner than an overlay and handles Android back button automatically
   - Pass the selected product as a navigation param

### Checkpoint
- 6 product cards render in a scrollable grid after finalize; tapping a card opens the detail modal.

---

## Phase 6 — Supplementary Screens

**Goal:** About, Contact, Privacy, and Affiliate Disclosure screens render their content.

### Tasks

1. These are mostly static text. Port each page's content to a `ScrollView` with `<Text>` and `<View>` layout.
2. Affiliate Disclosure and Privacy: these may have `<a>` links → `Linking.openURL()`.
3. Contact page: if it has a `mailto:` link → `Linking.openURL('mailto:...')`.
4. Add these screens to the navigator (accessible from a settings/menu button in the header).

### Checkpoint
- All supplementary screens are reachable and readable on both platforms.

---

## Phase 7 — Polish: Animations, Safe Areas, Platform Behavior

**Goal:** The app feels like a native product, not a web page in a frame.

### Tasks

1. **Safe area insets**: Wrap all screen content in `<SafeAreaView>` from `react-native-safe-area-context`. Check notch/island on iPhone and status bar on Android.

2. **Badge reveal animation** (the delayed badge pop-in after results load):
   - `window.setTimeout` → `setTimeout` (already done in Phase 3)
   - Animate badge opacity with Reanimated `withDelay(withTiming(...))` — direct port of the CSS delay

3. **Enrichment polling**: Works as-is — `setTimeout` loop, same logic. Confirm it cancels correctly on unmount.

4. **Scroll behavior**:
   - Wrap the whole Home screen in a `ScrollView` (or use a `FlatList` for results with a `ListHeaderComponent` for the search form)
   - The `FlatList` approach is better for performance: search form lives in `ListHeaderComponent`, results are list items

5. **Android back button**: React Navigation handles this. The "New search" reset should also respond to Android back when in results state — add a `useFocusEffect` + `BackHandler` listener in `HomeScreen`.

6. **Haptics** (optional but high-value): Add `expo-haptics` — a light tap on "Show focused picks" and "Start search" makes the app feel more polished.

7. **Keyboard dismiss**: Tapping outside the input should dismiss the keyboard — wrap scroll area with `<Pressable onPress={Keyboard.dismiss}>` or use `ScrollView` with `keyboardShouldPersistTaps="handled"`.

### Checkpoint
- App feels smooth. No content hidden under notch or status bar. Android back works correctly.

---

## Phase 8 — Timing Panel + Dev Tools

**Goal:** The dev timing panel works in `__DEV__` mode.

### Tasks

1. `shouldShowTimingPanel()` — replace `import.meta.env.DEV` check with `__DEV__` (Expo global).
2. URL param check (`?timing=1`) doesn't apply in native — remove or replace with a dev-only long-press gesture on the wordmark.
3. Render `TimingPanel` at the bottom of the scroll view when `__DEV__` is true.

---

## Phase 9 — Shared Code Between Web and Mobile (optional, deferred)

The `shared/search-input.js` module is already shared between web frontend and backend. Extending this to mobile adds complexity (workspace symlinks or a monorepo tool like Turborepo).

**Recommended for now:** Copy the file into `mobile/src/shared/search-input.js` and manually keep them in sync. Set up a proper shared package only when the divergence becomes painful.

---

## Phase 10 — Build Prep (when ready to publish)

**Goal:** Submit to TestFlight and Google Play internal testing.

### Tasks

1. Install EAS CLI: `npm install -g eas-cli`
2. `eas build:configure` — generates `eas.json`
3. Add app icons (1024×1024 for iOS, adaptive icon for Android) to `assets/`
4. Configure splash screen image in `app.json`
5. Set up environment variables in EAS secrets (not in `app.config.js`)
6. First build: `eas build --platform all --profile preview`
7. Submit to stores: `eas submit`

### App store requirements (plan ahead)
- Privacy policy URL — already exists at `/privacy`
- Affiliate disclosure — already exists
- Amazon Associates disclosure in store listing description

---

## Dependency Reference

```json
{
  "expo": "~52.x",
  "react": "18.x",
  "react-native": "0.76.x",
  "@react-navigation/native": "^7.x",
  "@react-navigation/native-stack": "^7.x",
  "react-native-screens": "latest",
  "react-native-safe-area-context": "latest",
  "react-native-reanimated": "^3.x",
  "nativewind": "^4.x",
  "tailwindcss": "^3.x",
  "@tanstack/react-query": "^5.x",
  "@react-native-async-storage/async-storage": "latest",
  "expo-linking": "latest",
  "expo-constants": "latest",
  "expo-crypto": "latest",
  "expo-haptics": "latest",
  "lucide-react-native": "latest",
  "react-native-svg": "latest"
}
```

---

## Key Gotchas — Read These Before Starting Each Phase

| Gotcha | Detail |
|---|---|
| `window` doesn't exist | Any `typeof window === 'undefined'` guard in ported code should be removed. There is no window in RN. |
| `performance.now()` | Replace with `Date.now()`. Sufficient for timing display. |
| `crypto.randomUUID()` | Not available globally in RN — use `expo-crypto`'s `Crypto.randomUUID()`. |
| `import.meta.env` | Not available in RN/Expo — use `Constants.expoConfig.extra.*` or `__DEV__`. |
| `localStorage` | Not available — use `AsyncStorage`. Watch for sync vs async: `getItem` is a Promise. |
| Tailwind `hover:` classes | Have no effect on native. Use `Pressable` + `onPressIn`/`onPressOut` for press states. |
| `<a href>` | Use `Linking.openURL()` from `expo-linking`. |
| SVG imports | Need `react-native-svg` + `@svgr/rollup` or the Expo SVG transformer. |
| PNG imports | `require('./assets/wordmark.png')` not `import` — though Expo supports both. |
| Fonts | Custom fonts (Instrument Sans, Georgia) need `expo-font` + `useFonts` hook. Georgia may not exist on Android — test early. |
| `scrollIntoView` | Does not exist. Use `ScrollView` ref `.scrollTo()` after measuring target position with `onLayout`. |
| `FlatList` numColumns | Cannot change `numColumns` dynamically without unmounting the list — use a `key` prop to force remount on orientation change. |
| Reanimated setup | Must add the Babel plugin AND restart Metro bundler after install. Easy to forget. |

---

## Working Convention for This Migration

- **Read from `../web/src/`**, write to `./src/`
- One phase at a time — don't start Phase 5 until Phase 4's checkpoint passes
- Test on both iOS simulator and Android emulator at each checkpoint
- When in doubt about a RN API, check Expo docs first (they document what's available in managed workflow)
- The backend is the source of truth for data shapes — never change backend contracts to suit the mobile port
