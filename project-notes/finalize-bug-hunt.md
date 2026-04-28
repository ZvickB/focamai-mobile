# Finalize Bug Hunt Handoff

## Current symptom
- Expo Go can run the mobile app and the initial search/discovery path works.
- The problematic path is `Start search` -> wait for discovery/refinement -> tap `Show focused picks`.
- Finalize is not receiving anything — the request never arrives or fails silently before the backend sees it.

## What has already been fixed
- `amazonDomain` propagation was the first bug found and is now resolved:
  - `src/components/home/useGuidedSearch.js` stores `submittedAmazonDomain` after discovery.
  - Finalize requests, finalize probes, and enrichment polling now all include the stored domain.
  - `src/screens/HomeScreen.jsx` shows `Submitted domain` in the Phase 3 harness status snapshot.
  - `npx expo export --platform ios` passed after the patch.
- Prior hardening already in place:
  - Duplicate finalize attempts are blocked while `isFinalizing`.
  - Active finalize requests are abortable.
  - Reset/new search/unmount cancels active finalize and discovery requests.
  - Stale finalize success/error handlers are ignored via `requestId`.
  - Finalize/discovery result lists are normalized and capped before mobile rendering.
  - `candidatePool.candidates` is guarded with `Array.isArray(...)`.
  - Debug harness no longer stringifies full large finalize/framing/timing objects inline.

## Real problem — finalize not receiving anything
Even with `amazonDomain` fixed, finalize still does not complete. The request either never leaves the device, is silently dropped, or fails before the backend processes it. This needs to be isolated by layer:

1. **Network/fetch/runtime abort** — does the request leave the device at all?
2. **Response parsing failure** — does `response.text()` or `JSON.parse` blow up?
3. **State update failure** — does `applyFinalizePayload(...)` throw or silently exit?
4. **Render failure** — does the debug harness crash after `setResults(...)`?

## Debugging steps
Capture Metro logs from `[mobile-guided-search]` and note where they stop:

- `finalize started` — hook reached the call
- `finalize request sent` — fetch was called
- `finalize response received` — network round-trip completed
- `finalize payload received` — JSON parsed successfully
- `finalize failed` — error path hit

If logs stop **before** `finalize response received` → investigate network/fetch/runtime abort.
If logs stop **after** `finalize payload received` → investigate result processing or rendering.
If an error surfaces instead of a crash → fix that first and keep the app from closing.

## Suggested next-chat prompt
```text
We are in C:\Users\zvick\Desktop\udemy\my projects\focama\mobile. Read project-notes/session-handoff.md, project-notes/current-status.md, and project-notes/finalize-bug-hunt.md.

The amazonDomain fix is already in place. The active blocker is that finalize is still not receiving anything — the request appears to never arrive or fails silently. Use the Metro log checkpoints in finalize-bug-hunt.md to isolate which layer is failing. Do not start Phase 4 UI work. Keep focus on stabilizing Phase 3 finalize.
```
