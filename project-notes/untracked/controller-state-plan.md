# Controller State Sharing Across Screens

## Problem summary

`useMobileSearchController.js` currently works because `HomeScreen` owns the whole search journey in one mounted component: query entry, follow-up prompt, final results, enrichment, retry, and marketplace preference all live in one hook instance. Once the UI becomes `Search -> Follow-up -> Results -> Pick detail`, that hook cannot stay screen-local or state will reset as screens mount, unmount, and navigate.

The right split is not "put everything in global state" or "put everything in TanStack Query." The search flow has two kinds of state: query-shaped remote data that can be fetched, cached, and displayed, and session/coordination state that decides which request is current, which token/domain belongs to the active search, whether stale responses should be ignored, and what the user has typed into the flow.

## Option 1: React Context provider around the navigator

### What it would look like here

Create a small search-flow provider, likely near `src/search/SearchFlowContext.jsx`, that calls the existing `useMobileSearchController()` once and exposes its returned state/handlers through context:

```jsx
<SafeAreaProvider>
  <SearchFlowProvider>
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator>{/* Search, FollowUp, Results, Detail */}</Stack.Navigator>
    </NavigationContainer>
  </SearchFlowProvider>
</SafeAreaProvider>
```

Then `SearchScreen`, `FollowUpScreen`, and `ResultsScreen` consume the same controller instance through `useSearchFlow()`. `SearchResultDetailScreen` can keep accepting route params for now, or later receive a candidate id and read the selected result from the shared flow/query cache.

### Pros

- Fits the existing hook with the smallest rewrite. The current controller already exposes screen-ready state and handlers: `productQuery`, `startDiscoverySearch`, `refinementPrompt`, `followUpNotes`, `finalizeFocusedPicks`, `finalResults`, retry handlers, marketplace handlers, phase events, and loading flags.
- Keeps active-session refs alive across route changes. This matters for `activeSearchSessionRef`, `searchRequestIdRef`, `finalizingRequestIdRef`, and `enrichmentPollTimerRef`.
- Lets the split screens stay simple. Search owns the draft query UI, Follow-up owns follow-up answer/finalize/skip, Results owns shortlist/retry, and all of them talk to one flow controller.
- Preserves the current stale-response guards without needing to serialize controller internals through navigation.
- Leaves room to migrate remote data into TanStack Query later without changing the screen contract much.

### Cons

- Context re-renders can spread widely if every screen consumes one large object. This is manageable at this app size, but the provider should eventually split actions/state or memoize values once screens become richer.
- It can become a catch-all if product state keeps accumulating there. The provider should own the active search flow, not unrelated app settings, legal/static screen state, or future saved/history/profile features.
- It does not automatically provide caching, refetch policies, request dedupe, or query invalidation. Those are Query's job once the data layer is ready.

### Fit assessment

Best immediate fit. It handles the screen split without throwing away the current controller, and it respects the restart strategy: bounded mobile-native slices around the existing small controller instead of another broad rewrite.

## Option 2: Navigation params

### What it would look like here

Each route transition would pass the current data needed by the next screen:

- `Search -> FollowUp`: submitted query, selected marketplace domain, maybe request id, discovery token, refinement prompt.
- `FollowUp -> Results`: follow-up notes, discovery token, domain, finalized results, retry count.
- `Results -> Detail`: selected result and rank, which is already how `SearchResultDetailScreen` works today.

The screens would either keep their own local state or pass updates forward through `navigation.navigate(...)` and `navigation.setParams(...)`.

### Pros

- Works well for small, stable route facts like `rank`, `candidateId`, or a selected result snapshot.
- Keeps screens decoupled from a global provider for detail-only state.
- React Navigation already expects route params for "open this specific item" behavior, so the current detail route is a reasonable use of params.

### Cons

- Breaks down for active search coordination. Request ids, timer refs, in-flight finalize guards, enrichment polling, stale-response logic, and mutation handlers do not belong in route params.
- Params become stale easily. If enrichment updates `fit_reason` and `caveat` after Results opens, a detail screen that received an old item snapshot will not automatically hydrate unless extra synchronization is added.
- Large result arrays and changing prompt/result objects make navigation history heavy and awkward. Back navigation can reveal old route params that no longer match the active controller.
- It encourages pushing product state forward one screen at a time, but this flow needs shared state both forward and backward: Back from Results to Follow-up should keep notes/results/session context coherent.
- It does not fit TanStack Query well. Query keys and cached data should be derived from stable identifiers, not copied wholesale through route params.

### Fit assessment

Poor fit for the controller. Keep navigation params for route identity only: selected candidate id or current result snapshot for the detail screen, maybe lightweight display labels. Do not use params as the main state transport for search sessions.

## Option 3: TanStack Query as the cache layer

### What it would look like here

TanStack Query is already installed in this repo and `App.js` already wraps `RootNavigator` with `QueryClientProvider`; the current search logic simply has not moved into queries yet. The API helpers in `src/search/searchApi.js` are good candidates for query/mutation functions:

- `discoverProducts({ query, amazonDomain })`
- `getRefinementPrompt({ query })`
- `finalizeSearch({ query, amazonDomain, discoveryToken, followUpNotes, ...retry })`
- `pollEnrichment({ query, amazonDomain, token })`

The controller/context would become the coordinator that starts mutations, stores the active session id/token/domain, and writes/reads query cache entries. Discovery/refinement/finalize are better modeled as user-triggered mutations or disabled queries manually triggered by the flow; enrichment is the closest fit for an enabled polling query with a `refetchInterval` until ready.

### Pros

- Good home for remote data that can be keyed and reused across screens: discovery summary/preview, refinement prompt, finalized shortlist, and enrichment entries.
- Gives standard loading/error/retry/cache semantics instead of hand-rolled request state everywhere.
- Helps detail hydration later. Results and Detail can read the same cached shortlist/enrichment data by active session or candidate id instead of passing full item objects around.
- Fits the decided dependency direction without forcing all controller state into Query.

### Cons

- Not a replacement for the controller. Query cache does not know what the "current search session" means, which discovery token is active, whether a newer request superseded an older one, or when marketplace changes should invalidate a session.
- The current controller has important imperative coordination: stale response refs, finalize overlap guards, enrichment timer cleanup, marketplace preference persistence, retry counters, and UI input state. Moving all of that into query cache would make the flow harder to reason about.
- A full Query migration before the screen split would be a larger rewrite than needed. It risks changing two axes at once: navigation structure and data-fetching architecture.
- Finalize/retry are not simple "fetch on render" queries. They are commands initiated by user actions, with payloads based on session state and follow-up/retry notes.

### Fit assessment

Strong fit as the remote-data layer, weak fit as the sole state owner. Use it soon, but behind a provider/controller that still owns session coordination. Since Query is already installed and provided, the migration can be incremental rather than a prerequisite for splitting screens.

## Recommendation

Use a React Context search-flow provider now, wrapping the navigator or at least the search-flow stack, and keep the current controller instance alive across `Search`, `Follow-up`, and `Results`. Use navigation params only for route identity and detail selection. Then migrate query-shaped remote data into TanStack Query in a follow-up slice, while keeping session/coordination state in the provider.

This is the lowest-risk path because the current controller already works as the flow brain. The screen split primarily changes component lifetime, so the first architectural move should be to lift the controller lifetime above screen lifetime. TanStack Query should still be part of the plan, but it should not absorb ephemeral flow state that is not cache-shaped.

Also note the current repo state differs from the task background: `@tanstack/react-query` is already in `package.json`, and `App.js` already creates a `QueryClientProvider`. The accurate statement is that Query is installed and available, but search code has not been migrated to it yet.

## Proposed split: what moves where

### Search-flow context/provider

Keep or move these into the provider/controller because they define the active user journey:

- Active session identity: `activeSearchSession`, `requestId`, `submittedQuery`, `discoveryToken`, resolved/requested `amazonDomain`, phase statuses.
- Stale/overlap guards: `activeSearchSessionRef`, `searchRequestIdRef`, `finalizingRequestIdRef`.
- Cross-screen inputs: submitted query, current draft query if it should survive Back, `followUpNotes`.
- Flow actions: `startDiscoverySearch`, `finalizeFocusedPicks`, `submitRetry`, marketplace-confirm/change handlers.
- Flow status: `phaseEvents`, `errorMessage`, `isDiscovering`, `isGeneratingPrompt`, `isFinalizing`, `canFinalize`, `canRetry`, `hasStartedSearch`.
- Retry session state: `retryCount`, current shortlist exclusions, retry submission action.
- Marketplace preference coordination: selected domain, first-run prompt visibility, marketplace-change invalidation.

### TanStack Query/cache

Move these gradually because they are remote data results:

- Discovery payload/summary and `previewItems`, keyed by active search session or `{ query, amazonDomain, requestId }`.
- Refinement prompt, keyed by normalized query.
- Finalized results, keyed by active session and finalize attempt/retry count.
- Enrichment entries or enriched result data, keyed by `{ discoveryToken, query, amazonDomain }`, with polling semantics.
- Later query-quality and retry-advice responses, once those mobile slices are built.

Finalize and retry should likely use `useMutation` first, then write normalized results into query cache. Enrichment can become a polling `useQuery` enabled only after finalize succeeds and disabled once ready/timeout.

### Screen-local state

Keep these local when a screen can discard them without breaking the active session:

- Transient UI toggles such as diagnostics expanded/collapsed.
- Search example chip press state or input focus state.
- Results list scroll/focus state.
- Detail screen presentation-only state.
- Retry feedback draft can start local to Results, but the submitted retry count/current exclusions belong to the provider. If feedback should survive navigating away and back, lift only that draft into context.

### Navigation params

Use params for navigation identity, not controller state:

- Detail route: `candidateId` plus `rank` is the ideal eventual shape.
- Short-term detail route: passing `{ item, rank }` is acceptable because the existing screen already does this, but it should be treated as a snapshot fallback.
- Avoid passing discovery tokens, full result arrays, mutation handlers, loading flags, or refinement/finalize payloads through params.

## What files need to change and in what order

1. Add `src/search/SearchFlowContext.jsx`.
   - Wrap `useMobileSearchController()` in a provider.
   - Export `SearchFlowProvider` and `useSearchFlow()`.
   - Initially keep behavior identical; this is a lifetime/lift change only.

2. Update `src/navigation/RootNavigator.jsx`.
   - Add routes for `Search`, `FollowUp`, `Results`, and keep `SearchResultDetail`.
   - Wrap the search-flow routes, or the whole navigator, in `SearchFlowProvider`.
   - Keep Settings/static routes secondary and outside the core flow mentally, even if they are in the same stack.

3. Split `src/screens/HomeScreen.jsx`.
   - Convert the current Home composition into separate `SearchScreen.jsx`, `FollowUpScreen.jsx`, and `ResultsScreen.jsx`.
   - Each screen consumes `useSearchFlow()` instead of calling `useMobileSearchController()` directly.
   - Navigate after user actions: search submit goes to Follow-up when the refine step is expected; finalize/skip goes to Results.

4. Adjust existing search UI components only as needed.
   - `SearchEntrySection.jsx` belongs on Search.
   - `SearchRefineSection.jsx` belongs on Follow-up.
   - `SearchResultsSection.jsx` and `SearchRetrySection.jsx` belong on Results.
   - `SearchProgressStatus.jsx` may become per-screen status or a small shared progress component.

5. Keep `SearchResultDetailScreen.jsx` working with current params first.
   - Do not block the screen split on a detail data rewrite.
   - Later switch to `candidateId` + query/cache lookup once results/enrichment live in Query.

6. Migrate query-shaped data into TanStack Query in a separate slice.
   - Start with discovery/refinement as mutations or manually triggered disabled queries.
   - Move finalize into `useMutation` and cache normalized final results.
   - Move enrichment polling from the manual timer into an enabled polling query once finalize results exist.
   - Keep the provider as the orchestrator even after the remote data moves.

7. Update mobile notes after implementation, not during this planning task.
   - `project-notes/current-status.md` should mention the screen split and provider once code actually changes.
   - `project-notes/session-handoff.md` should be updated if the fresh-chat startup story would otherwise still imply one Home-owned controller.
