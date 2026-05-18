# Audit: AsyncStorage Error Handling & First-Run Marketplace Flow

Status: addressed in the mobile app. Marketplace persistence now saves the domain before marking the first-run prompt seen, Settings uses the ordered helper, startup has an outer storage-load fallback, and first-run marketplace pills are draft-only until the `Use [store]` button is pressed.

## Summary
This audit reviews marketplace preference persistence and the first-run store prompt.

Files examined:

- `src/search/amazonMarketplaces.js`
- `src/search/useMobileSearchController.js`
- `src/search/MarketplacePromptSection.jsx`
- `src/screens/SearchScreen.jsx`
- `src/screens/SettingsScreen.jsx`
- `src/search/SearchEntrySection.jsx`

Overall verdict: the app does not crash if AsyncStorage fails, but the write flow can create a silent bad state: the "prompt seen" flag can be saved even when the actual marketplace preference is not. The first-run prompt also treats a country pill tap as a permanent commit, which makes the confirm button less meaningful than the UI suggests.

## Startup Read Behavior

Startup reads happen in `useMobileSearchController.js`:

```js
Promise.all([
  loadAmazonMarketplacePreference(),
  hasSeenAmazonMarketplacePrompt(),
]).then(([preference, hasSeenPrompt]) => {
  if (isMounted && !selectedAmazonDomainTouchedRef.current) {
    setSelectedAmazonDomainState(preference.domain);
    setShowMarketplacePrompt(!preference.hasSavedPreference && !hasSeenPrompt);
  }
});
```

The helper functions catch AsyncStorage errors internally:

- `loadAmazonMarketplacePreference()` returns `{ domain: DEFAULT_AMAZON_DOMAIN, hasSavedPreference: false }`
- `hasSeenAmazonMarketplacePrompt()` returns `false`

If AsyncStorage throws on startup:

- the app does not crash
- the domain falls back to `amazon.com`
- the first-run prompt appears again

Assessment: this is acceptable degradation. If storage is unavailable, re-showing the prompt is better than silently assuming a saved preference.

Small hardening: add a `.catch()` on the outer `Promise.all` anyway. It should not normally fire because the inner helpers catch errors, but it protects against future helper changes.

## Broken State: Prompt Seen Without Saved Domain

Current write paths call both persistence helpers without checking whether the domain write succeeded:

```js
saveAmazonDomainPreference(normalizedDomain);
saveAmazonMarketplacePromptSeen();
setShowMarketplacePrompt(false);
```

This appears in:

- `setSelectedAmazonDomain()`
- `confirmSelectedAmazonDomain()`
- `SettingsScreen.chooseMarketplace()`, though Settings awaits the calls in order

The helpers currently swallow errors. Because the writes are not atomic, this bad state is possible:

1. Saving `focamai_marketplace` fails.
2. Saving `focamai_marketplace_asked` succeeds.
3. Next launch sees no saved domain, but sees the prompt as already asked.
4. The app defaults to `amazon.com` and hides the first-run prompt.

Severity: Medium. The probability is low, but the consequence is silent and persistent until the user visits Settings.

Recommended fix: make preference saving return a success signal and only mark the prompt as seen after the domain preference is confirmed saved.

Preferred helper shape:

```js
export async function saveAmazonDomainPreference(domain) {
  const normalizedDomain = normalizeAmazonDomain(domain) || DEFAULT_AMAZON_DOMAIN;

  try {
    await AsyncStorage.setItem(AMAZON_MARKETPLACE_STORAGE_KEY, normalizedDomain);
    return { domain: normalizedDomain, saved: true };
  } catch {
    return { domain: normalizedDomain, saved: false };
  }
}
```

Then call:

```js
const result = await saveAmazonDomainPreference(domain);

if (result.saved) {
  await saveAmazonMarketplacePromptSeen();
}
```

If the domain save fails, it is okay to use the selected domain for the current in-memory session, but do not permanently suppress the first-run prompt.

## First-Run Prompt: Pill Tap Commits Immediately

`MarketplacePromptSection.jsx` renders country pills and a confirm button:

```js
onPress={() => setSelectedAmazonDomain(marketplace.domain)}
```

But `setSelectedAmazonDomain()` currently does more than select:

- updates selected domain
- saves domain preference
- saves prompt-seen flag
- hides the prompt
- resets active marketplace-scoped search state if needed

This means tapping a country pill is already the commit action. The `Use [Country]` button becomes mostly redundant.

Severity: Low to Medium. The app still works, and users can fix the store in Settings, but the interaction is misleading.

Recommended fix: split first-run draft selection from committed selection.

Better first-run behavior:

- country pill tap updates a prompt-local draft domain
- confirm button commits the draft domain
- prompt hides only after confirmed save, or hides for this session while leaving prompt eligible to reappear if storage failed

This makes the UI match the user’s expectation: browsing options is not the same as committing a preference.

## Is The Prompt Dismissible Without Saving A Domain?

There is no explicit close/skip button in the first-run prompt.

Current behavior:

- If the user ignores the prompt and searches anyway, no storage flags are written.
- The prompt remains eligible to appear again because `showMarketplacePrompt` stays true in controller state.
- On next app launch, without stored values, the prompt appears again.

Assessment: this is acceptable if the product wants a deliberate store choice. It is not a broken no-domain dismiss path.

The only truly bad "dismissed without saved domain" path is the storage split-brain case: prompt-seen write succeeds while domain write fails.

## Settings Screen

`SettingsScreen.chooseMarketplace()` awaits the writes:

```js
await saveAmazonDomainPreference(domain);
await saveAmazonMarketplacePromptSeen();
navigation.navigate("Search", { selectedAmazonDomain: domain });
```

This is better than the first-run handler because it is ordered, but it still cannot tell whether the first write actually succeeded because `saveAmazonDomainPreference()` always returns the normalized domain even on failure.

Recommended fix: after changing the helper to return `{ domain, saved }`, Settings should only save the prompt-seen flag when `saved` is true.

Settings can still update the in-memory UI immediately, because the user explicitly chose a store. The important part is not permanently hiding first-run recovery if persistence failed.

## `selectedAmazonDomainTouchedRef` Race Guard

The startup effect avoids overwriting user-driven domain changes:

```js
if (isMounted && !selectedAmazonDomainTouchedRef.current) {
  setSelectedAmazonDomainState(preference.domain);
  setShowMarketplacePrompt(!preference.hasSavedPreference && !hasSeenPrompt);
}
```

Assessment: this is reasonable. If Settings passes a route param before startup storage resolves, the touched ref prevents stale storage values from overwriting the new selection. If storage resolves first, the route param still wins afterward.

No immediate change needed here.

## `SearchEntrySection.jsx`

`SearchEntrySection.jsx` has no AsyncStorage contact. It only handles query draft/input behavior and search submission.

No marketplace persistence issue there.

## Recommended Fix Shape

1. Change `saveAmazonDomainPreference()` to return `{ domain, saved }`.
2. Change `saveAmazonMarketplacePromptSeen()` to return `true`/`false`.
3. Add a small helper such as `saveAmazonMarketplaceSelection(domain)` that saves domain first and marks prompt seen only if domain save succeeds.
4. Use that helper from:
   - `confirmSelectedAmazonDomain()`
   - committed Settings selection
   - any route-param marketplace selection that should persist
5. Split prompt pill selection from persistence:
   - prompt pill updates a draft value
   - confirm button commits
6. Add an outer `.catch()` to the startup `Promise.all`.

## Recommended Priority

1. Fix ordered/conditional persistence so `focamai_marketplace_asked` cannot be saved without `focamai_marketplace`.
2. Make first-run pill taps draft-only and the confirm button the true commit action.
3. Add startup `.catch()` as defensive cleanup.
4. Keep no-skip behavior unless product direction changes; repeated prompting is acceptable when no preference was saved.
