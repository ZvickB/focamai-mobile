# Android Play Readiness Audit - 2026-05-26

## Summary

The mobile app is not ready for final Google Play submission yet, but it is ready to start a focused Android release-prep phase.

Local code-health checks are in good shape:
- `npm test -- --runInBand`: 16 suites passed, 85 tests passed after the first release-stability pass.
- `npx expo export --platform android --output-dir .expo-export-check`: passed.
- `npx expo-doctor`: 18/18 checks passed.

Those checks do not replace a signed production/internal-testing build, Play Console setup, policy declarations, or real installed-app verification.

## Current blockers

- Android package/application id is now set to `com.focamai.app`.
  - Treat this as durable once the Play Console app is created.
- Android `versionCode` is now set to `1`.
  - Keep `expo.version` as the user-facing version.
  - Increment `expo.android.versionCode` for each Android release upload, or let the EAS production profile auto-increment it.
- `eas.json` now exists.
  - The preview profile builds an Android APK for installable testing.
  - The production profile builds an Android App Bundle for Google Play.
  - EAS remote app-version management is enabled so production `autoIncrement` can manage Android version codes on EAS.
- Production API configuration is wired for EAS builds.
  - `src/search/searchApi.js` reads `EXPO_PUBLIC_API_BASE_URL`.
  - Both Android EAS profiles currently set it to `https://focama-web.onrender.com`.
  - Naming note: **Focamai** is the app/product name; `focama-web.onrender.com` is only the Render backend API host.
  - Do not point this at the public frontend site. It must be the backend API URL.
- Play Console app-content work is still required.
  - Privacy policy URL.
  - Data safety form.
  - Ads declaration.
  - Target audience and content rating.
  - Store listing copy, screenshots, app category, contact details, and release notes.
- A real installed-app verification pass is still required.
  - Expo export and Jest do not prove Play-installed release behavior.
  - Verify a signed internal-testing build from Google Play with the live backend.

## Notes from the audit

- In-app Privacy and Affiliate Disclosure screens exist and are reachable through Settings.
- The app does not appear to request location permission. Marketplace choice is explicit and saved, which matches the current mobile product direction.
- `RootNavigator.jsx` registers `DevLauncher` only under `__DEV__` and starts production users at `Search`, but this should still be verified in a production EAS build.
- `src/dev/` and `DevLauncherScreen.jsx` are acceptable only if they remain dev-gated and never surface in release builds.
- No high-risk permissions were found in the source scan.
- There are many pre-existing uncommitted working-tree changes. Treat the audit as applying to the current working state, not a clean committed release candidate.

## Recommended next phase

Use a checklist/plan for "Prepare Android Play internal testing":

1. Run a local Android export check again.
2. Log in to Expo/EAS with `npx eas login`.
3. Build an Android preview APK with `npx eas build --platform android --profile preview`.
4. Install the preview build and smoke-test it against the Render backend.
5. Create or configure the Play Console app with package name `com.focamai.app`.
6. Build a production Android App Bundle with `npx eas build --platform android --profile production`.
7. Upload to Play internal testing.
8. Complete App content declarations and store listing basics.
9. Install through Play internal testing and smoke-test:
    - Search -> Follow-up -> Results -> Detail.
    - First-run marketplace selection.
    - Settings region change.
    - Retry advice path.
    - Query-quality suggestion path.
    - Hard-constraint refresh path.
    - Enrichment fallback/fill-in copy.
    - Retailer outbound links.
    - Privacy and Affiliate Disclosure access.
    - Keyboard, safe area, Android back, and cold start behavior.

## Official references

- Google Play target API requirements: https://developer.android.com/google/play/requirements/target-sdk
- Google Play Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Prepare app for review: https://support.google.com/googleplay/android-developer/answer/9859455
- Prepare and roll out a release: https://support.google.com/googleplay/android-developer/answer/9859348
