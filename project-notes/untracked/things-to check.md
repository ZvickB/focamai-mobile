# Manual Expo Go Verification Checklist

Purpose: verify the polished V1 search path after the controller/data audit fixes, without changing backend contracts or adding new features.

## Setup
- Confirm `.env` points `EXPO_PUBLIC_API_BASE_URL` at the backend API, not the public frontend.
- Use `npx expo start --lan` for a normal run.
- Use `npx expo start --clear --lan` only after env/package/import changes or stale transform errors.
- On a physical phone, use the computer LAN IP for local backend testing; `localhost` means the phone.

## Search
- App opens on Search with the PNG wordmark, one input, example chips, Settings access, and no main-screen store picker unless first-run prompt is expected.
- First-run store prompt commits only after tapping `Use [store]`.
- Settings store changes apply to future searches and clear any active marketplace-scoped results while preserving the typed query.
- Example chip or fast typed query submits the exact visible query, not the previous query.
- Search starts discovery/refine and navigates to Follow-up without exposing diagnostics by default.

## Follow-up
- The refine question appears as the main prompt, with `Get focused picks` and `Skip and show results` both available when appropriate.
- Query-quality suggestion, when present, renders readable copy and never shows `[object Object]`.
- `Try suggested search` starts a fresh search lifecycle; `Keep these results` dismisses the prompt.
- Hard constraints in the answer, such as kosher, allergy, material safety, or compatibility exclusions, trigger a refreshed discovery before finalize.
- During hard-constraint refresh, stale query-quality suggestions from the pre-refresh token do not appear.

## Results
- Focused picks render as a ranked shortlist capped at 6.
- Missing price, rating, image, or review count states look intentional and do not show `0.0`, empty stars, or `[object Object]`.
- Fewer-than-six result copy appears only when fewer credible picks are returned.
- Shopping CTA labels may name Amazon when Amazon is the active source and that improves clarity, with the Amazon affiliate disclosure nearby.
- Retry advice shows rationale, editable suggested query, and `Keeping` tags as reassurance only.
- Same-session retry remains the fallback and replacement picks still cap at 6.

## Detail
- Tapping a result opens the matching detail via `candidateId`; the route snapshot fallback only appears if the live shortlist no longer has that item.
- Detail shows image/fallback, title, price, rating/reviews, rank/source context, `Why this pick`, `Worth knowing`, feature notes, pricing caveat, and retailer CTA/disclosure.
- Enrichment fallback copy distinguishes `still checking` from `finished or timed out without extra notes`.
- Late enrichment updates the detail naturally through the shared search flow lookup.
- The fixed footer appears only when a retailer link exists, stays above the bottom safe area, and opens the retailer URL.
- When no retailer link exists, the unavailable-link state appears and the fixed footer does not.

## Remaining Risks To Watch
- Live backend/provider timing can still affect query-quality, retry advice, and enrichment availability.
- Manual device verification is still needed for navigation, safe areas, keyboard behavior, external link opening, and real network timing.
- Maestro remains future Android E2E scaffolding; local repeatable coverage is Jest plus Android export for now.
