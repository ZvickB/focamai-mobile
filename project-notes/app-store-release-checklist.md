# iOS App Store Release Checklist

## Scope

This is the release path for the current account-free production build. The
`production` EAS profile keeps account, Price Watch, and Deep Dive UI disabled
unless an EAS environment variable deliberately enables them. Do not enable an
account feature for this submission without completing
`project-notes/account-ui-release-roadmap.md` first.

## What is already configured

- iOS bundle ID: `com.focamai.app`
- Display name and release version: `Focamai` / `1.6.0`
- Portrait orientation, 1024px app icon, launch screen, and microphone usage
  explanation are configured in `app.config.js`.
- EAS remote versioning and production auto-increment are configured in
  `eas.json`; EAS will allocate the iOS build number for each production build.
- The production profile sets the Render API URL, enables first-party mobile
  analytics, and disables the internal Sentry verification screen.

## Before building

1. In App Store Connect, create the app record with bundle ID `com.focamai.app`,
   name `Focamai`, primary language, SKU, and the correct category. Do not
   create a second bundle ID if this one already exists.
2. Confirm the production EAS environment has the required Sentry values:
   `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, and
   `SENTRY_AUTH_TOKEN`. `app.config.js` intentionally stops an EAS build when
   any is missing.
3. Open the deployed privacy policy at `https://focamai.com/privacy` on a phone.
   It must be public, match the submitted build, and be entered as the App Store
   Connect privacy-policy URL.
4. Complete App Privacy using the actual production build, including first-party
   search handling, product-interaction analytics, optional microphone audio,
   crash data, and Sentry performance data. Mark no data as used for tracking
   unless its actual use meets Apple's tracking definition. Reconfirm the exact
   data categories, linkage, purposes, and retention with the backend/Sentry
   configuration owner before saving the answers.
5. Capture real, unaltered app screenshots from the release candidate. Supply
   one to ten PNG/JPEG screenshots for each required iPhone/iPad size. Because
   `supportsTablet` is currently true, include iPad media or turn off iPad
   support only after an intentional product decision and device verification.
6. Prepare App Review notes explaining that search works without an account,
   voice search is optional, results open Amazon in the browser, and no purchase
   happens in the app. Provide a working test account only if account UI is
   deliberately enabled.

## Build and TestFlight

Run these from the mobile repository after the release-candidate device checks:

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production --latest
```

Sign in to the Apple Developer and App Store Connect accounts when prompted.
The first command creates an App Store `.ipa`; the second uploads the completed
build to App Store Connect. Finish TestFlight processing, add internal testers,
and test the installed binary—not Expo Go—on an iPhone and iPad.

## Required release-candidate checks

- Cold and warm launch, including the native-to-React splash handoff.
- Typed search through refine, results, retry, product details, and Amazon
  outbound links using the production API.
- Deny microphone access, then verify typed search still works; grant it and
  verify one voice search works and the permission explanation is accurate.
- Network failure/recovery, background/foreground during a search, and a clean
  reinstall.
- Privacy, Contact, and Amazon links; then inspect the production Sentry test
  outcome without exposing query text or credentials.
- If account UI is ever enabled: sign-in, saved-search sync, preference
  persistence, and in-app account deletion.

## App Store Connect submission

After TestFlight QA, complete the store listing, age rating, export-compliance
answers, support URL, privacy policy URL, screenshots, and review contact. Add
the processed build to version `1.6.0`, then submit it for review. Keep the
account-free EAS environment unchanged for this release.

## References

- Apple requires App Privacy answers and a privacy-policy URL for App Store
  apps: <https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/>.
- Apple describes the data categories, linkage, and tracking definition here:
  <https://developer.apple.com/app-store/app-privacy-details/>.
- App Store screenshots accept one to ten PNG/JPEG images per device size:
  <https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/>.
- If accounts are enabled, Apple requires account deletion to be initiated in
  the app: <https://developer.apple.com/support/offering-account-deletion-in-your-app/>.
