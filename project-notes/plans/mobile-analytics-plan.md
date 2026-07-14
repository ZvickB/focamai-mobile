# Focamai Mobile Analytics Plan

**Status:** Proposed for review — no SDKs, app code, configuration, database tables, or backend behavior were changed to create this document.
**Scope:** Expo React Native mobile app and its existing Focamai backend.
**Prepared:** 2026-07-13

## Decision summary

Start with a small, first-party, server-validated product-event pipeline for the mobile app. Keep Sentry exclusively for privacy-scrubbed reliability and performance monitoring. Do **not** send mobile events to the current web analytics endpoint until it has a new, strict mobile schema: its present contract accepts raw search queries, free-form details, and arbitrary event data.

This gives Focamai useful funnel, retention, and search-quality answers without sending search text, follow-up notes, product titles, retailer URLs, or user identity to an analytics vendor. If the team later needs self-serve cohorts, visual funnels, feature flags, or experimentation at meaningful scale, evaluate PostHog as the next-stage product analytics platform—with replay, autocapture, surveys, and error tracking explicitly disabled.

## 1. Current analytics capabilities

### What exists today

| Area | Current behavior | What it answers | Privacy / limitation |
| --- | --- | --- | --- |
| Mobile Sentry | `@sentry/react-native` 8.17.2 captures scrubbed crashes/errors; 10% production tracing and 100% internal-preview tracing; app-start, React Navigation route transitions, native frame/stall metrics. | Crashes, error rate, app start, slow screens/routes, native performance. | No Session Replay, profiling, app-hang tracking, auto session tracking, fetch/XHR spans, breadcrumbs, user identity, request payloads, or error messages. It is not a product funnel or retention system. |
| Mobile navigation | React Navigation v7 has routes for Search → FollowUp → Results → RetryUpdating plus detail/settings/history and other screens. Sentry registers the navigation container. | Technical route-transition performance only. | No semantic product events such as “search submitted” or “retailer link requested.” |
| Mobile search flow | `SearchFlowContext` and `useMobileSearchController` manage discover, refine, finalize, enrichment, query-quality suggestions, and retry/improve-picks state. `searchPhaseEvents.js` keeps a bounded in-memory UI diagnostic timeline. | Runtime UI state and debugging while a search is active. | These are not persisted analytics events and must not be repurposed to upload raw search content. |
| Mobile local history | AsyncStorage stores up to 50 raw searches locally; signed-in history can synchronize to `saved_searches`. | User-facing history. | This is product data, not analytics. Never export it to analytics or use it as an event source. |
| Existing backend diagnostics | The sibling Focamai web/backend project records operational search lifecycle diagnostics, including `search_attempts` and `search_events`; it also has backend Sentry safeguards. | Provider/search reliability and support investigation. | Treat as operational data, not a clean mobile product-funnel dataset. Audit its raw data retention separately. |
| Existing web analytics endpoint | `POST /api/analytics/track`, dashboard and storage for search runs, events, impressions, and clicks. The web client sends ordered events to it. | Web funnel and result interaction reporting. | Current implementation persists `productQuery`, free-form `details`/event data, result identifiers, and retailer URLs. It is not privacy-safe for this plan without a separate v2 contract. |

### What is missing on mobile

- No mobile product-event client, event schema, anonymous-install identifier, event de-duplication, or collection kill switch.
- No privacy-safe Search → Refine → Picks funnel, abandonment calculation, retention cohort, feature-adoption, retailer-intent, or search-quality reporting.
- No server-authoritative event joining a client search run to final result quality/outcome.
- No production/internal environment separation for product analytics, because product analytics has not yet been added.
- No schema validation that rejects accidental raw search text or arbitrary properties.

### Duplicated or conflicting telemetry to avoid

1. **Sentry vs product analytics:** Sentry already owns technical errors, app start, route timing, and native performance. Do not recreate those as high-volume product events. Product analytics should record only semantic outcomes such as `search_results_presented` and a coarse outcome/latency bucket.
2. **Client vs server outcomes:** The client may record that it displayed results; the backend should be authoritative for provider/finalization outcome and latency. Do not count both as two searches.
3. **History vs analytics:** `search_history`/`saved_searches` and the mobile AsyncStorage history contain user content. They must remain separate from analytics.
4. **Existing web analytics vs proposed mobile analytics:** Do not send the proposed mobile taxonomy to the existing raw-query endpoint. Introduce a versioned mobile/analytics-v2 API and separate storage/validation path first.

### Assessment boundary

This review inspected repository code, including the sibling backend and web implementation. It did not inspect a live Sentry organization, deployed logs, database contents, retention settings, or third-party provider contracts. Those operational settings need confirmation before launch.

## 2. Product questions and the minimum signals needed

| Question | Primary signal | Source of truth |
| --- | --- | --- |
| How many users start a search? | `search_submitted` | Client |
| How many reach/refine/complete clarification? | `refinement_presented`, `refinement_completed` | Client |
| How many reach picks? | `search_results_presented` | Client |
| How many use Improve Picks? | `improve_picks_opened`, `improve_picks_submitted`, `retry_results_presented` | Client |
| How many request a product/retailer link? | `retailer_link_requested` | Client; measures intent, not completed retailer conversion |
| Where do people leave the flow? | Derived terminal-state analysis after inactivity; not a client “abandoned” click | Server/warehouse |
| Which screens are slow? | Sentry app-start and navigation performance | Sentry |
| How often does search fail or return weak/no results? | `search_outcome_recorded` with allow-listed outcome codes | Server |
| How long does the flow take? | `time_to_results_bucket` on final outcome/display | Server, with client display confirmation |
| Who returns after 1, 7, or 30 days? | `app_opened` grouped by anonymous install ID | First-party aggregate |
| Which features matter? | Small set of named semantic feature events, only for released features | Client |

## 3. Data model and event taxonomy

### Event envelope (proposed)

Every accepted event should use a fixed envelope, not an open-ended object:

```text
event_id                 random UUID, generated once per attempted event
event_name               allow-listed stable snake_case name
schema_version           integer, initially 1
occurred_at_client       ISO timestamp (used for ordering only)
received_at_server       server timestamp (authoritative)
environment              internal | production
platform                 ios | android
app_version / build      release metadata only
anonymous_install_id     random app-install pseudonym; first-party only
search_run_id            random per submitted search; absent outside the search flow
properties               validated allow-list for that event name
```

Rules:

- `anonymous_install_id` is random, stored locally, and never derived from email, account ID, advertising ID, device serial, IP address, or hardware identifier.
- Do not attach an authenticated user ID by default. If account-level retention becomes necessary later, use a reviewed, deletion-capable mapping held separately from the event table; do not send that mapping to a third party.
- `search_run_id` expires with the flow. It is not the raw query, a product ID, or a stable user identifier.
- The server drops unknown fields and rejects an event that fails its schema. Client-side filtering is helpful; server-side validation is mandatory.

### Property conventions

- Buckets are preferred over precise values: `0`, `1_5`, `6_plus`; `under_5s`, `5_15s`, `15_30s`, `30_60s`, `over_60s`; `empty`, `1_20`, `21_100`, `101_plus`.
- Enum values are versioned and documented, for example `entry_point: search|history_retry` and `outcome: success|no_results|weak_results|provider_error|validation_error|cancelled`.
- All numeric values have a hard range and all strings have a short enum/length limit. Free-form strings are never accepted.
- The **prohibited properties** listed below supplement the universal prohibition: raw search text, clarifying notes, feedback text, product names/IDs, retailer URLs, chat content, API responses, request/response bodies, headers, tokens, credentials, precise timestamps that reveal behavior, IP address, location, advertising IDs, email, phone, account ID, and user-entered text.

### Proposed taxonomy

The following is the complete initial planning taxonomy. The first fifteen rows are also the recommended first 10–15 events to instrument; the remaining rows are later additions, not a request to instrument everything immediately.

| Event name | Fires when | Allowed properties | Prohibited properties (in addition to universal rules) | Source | Priority |
| --- | --- | --- | --- | --- | --- |
| `app_opened` | App foregrounds after a new process/session boundary, once per 30-minute inactivity window. | `launch_type: cold|warm`, `app_version`, `build`, `platform` | screen name, push payload, URL/deep-link path | Client | Required |
| `search_submitted` | A valid search request is committed, once per `search_run_id`. | `entry_point: search|history_retry`, `query_length_bucket`, `marketplace_selected: boolean`, `retry_round` | query, normalized query, keywords, local-history ID | Client | Required |
| `search_outcome_recorded` | Finalize/discovery request reaches a terminal backend outcome. This is the authoritative search outcome. | `stage: discovery|finalize|retry`, `outcome`, `result_count_bucket`, `candidate_count_bucket`, `latency_bucket`, `retry_round`, `weak_result_reason_codes` (short allow-list), `provider_status_category` | raw provider error, provider payload, query, product/result IDs, URL | Server | Required |
| `refinement_presented` | The clarification screen is visibly ready for a run, once per run. | `prompt_count_bucket`, `prompt_source: standard|fallback`, `retry_round` | prompt text, query, suggestions | Client | Required |
| `refinement_completed` | User proceeds from clarification, including an explicit skip/show-products path. | `completion_mode: notes_submitted|skipped|show_products_now`, `note_length_bucket`, `retry_round` | note text, prompts, query | Client | Required |
| `search_results_presented` | A final result set is visibly displayed, once per result set. | `result_set: initial|retry`, `result_count_bucket`, `time_to_results_bucket`, `retry_round`, `has_best_pick: boolean` | product list, names, identifiers, prices, badge text, URLs | Client | Required |
| `result_detail_opened` | User opens a product detail from a displayed result set. | `result_set`, `position_bucket: 1|2|3|4_6`, `retry_round` | product title/ID, category inferred from title, image URL, price | Client | Useful |
| `retailer_link_requested` | User asks the app to open the retailer/affiliate destination. It does not assert an external purchase or even a completed browser open. | `retailer: amazon`, `result_set`, `position_bucket`, `retry_round`, `link_open_result: opened|failed` | retailer URL, affiliate tag, product title/ID, purchase value | Client | Required |
| `improve_picks_opened` | Improve Picks UI is opened from results. | `result_count_bucket`, `retry_round` | products currently displayed, feedback text | Client | Useful |
| `improve_picks_submitted` | Valid Improve Picks feedback is submitted for a retry. | `feedback_length_bucket`, `retry_round`, `previous_result_count_bucket` | feedback text, suggested query, product names/IDs | Client | Useful |
| `retry_results_presented` | Retry result set becomes visible. Use instead of another `search_results_presented` only if reporting needs an explicit retry event; otherwise emit both only when documented as separate measures. | `result_count_bucket`, `time_to_results_bucket`, `retry_round`, `outcome: success|weak_results|no_results` | product data, feedback, query | Client | Useful |
| `query_quality_suggestion_presented` | An already-supported query-quality suggestion appears. | `classification`, `confidence_bucket`, `suggestion_type` | query, suggested query, model rationale, response text | Client | Useful |
| `query_quality_suggestion_actioned` | User accepts or dismisses that suggestion. | `action: accepted|dismissed`, `classification`, `suggestion_type` | query, suggested query, user reason | Client | Useful |
| `search_error_presented` | A recoverable search error state is shown to the user, once per stage/run/error class. | `stage`, `error_category: network|provider|validation|unknown`, `recoverable: boolean`, `retry_round` | error message, stack, request URL, response body | Client | Required |
| `feature_entry_opened` | User deliberately opens a released, named non-search feature (for example History or Price Watches). | `feature_name` from an allow-list, `entry_point` | screen params, copied content, account data | Client | Optional |
| `marketplace_selection_completed` | User explicitly completes or changes shopping region/marketplace. | `marketplace_code` from a fixed country/domain allow-list, `action: initial|changed` | precise location, postal code, address | Client | Optional |
| `premium_paywall_presented` | A future premium paywall is actually shown. | `offer_id` from an allow-list, `entry_point` | price/payment method, account identity, experiment assignment details | Client | Deferred |
| `premium_checkout_started` | A future user explicitly starts checkout. | `offer_id`, `entry_point` | receipt, payment data, email, store transaction ID | Client | Deferred |
| `premium_purchase_confirmed` | The backend/store verifies a future entitlement. | `offer_id`, `store: apple|google`, `outcome: confirmed|failed` | receipt, transaction ID, price, purchaser identity | Server | Deferred |

### Abandonment is derived, not emitted

Do not add a brittle `search_abandoned` client event. A server-side report should mark a run as abandoned when it has `search_submitted` but no terminal result/error/explicit cancellation within a documented inactivity window (initial proposal: 30 minutes). Report abandonment by the last completed stage. This avoids counting app crashes, offline behavior, and process termination as intentional abandonment.

## 4. Privacy rules and governance baseline

### Non-negotiable collection rules

1. Do not collect raw search text by default.
2. Do not collect chat messages, clarification notes, typed Improve Picks feedback, suggested queries, product queries, or user-entered notes unless a separate written approval changes this plan.
3. Do not collect passwords, tokens, API keys, headers, request bodies, response bodies, API responses, stack traces, full URLs, affiliate URLs, or retailer URL query parameters.
4. Do not enable Session Replay, screen recording, screenshots, touch/tap recording, input recording, autocapture, heatmaps, or user-input capture.
5. Do not collect precise location, contacts, advertising IDs, device serials, biometric data, or cross-app tracking IDs.
6. Avoid persistent cross-device identity. The baseline is an anonymous per-install pseudonym. Do not call an analytics-vendor identify API with a Focamai account ID, email, or hash of either.
7. Sentry remains as currently configured: privacy-scrubbed technical monitoring only, with Session Replay and profiling disabled.
8. Analytics events must be sent only over HTTPS to the approved first-party endpoint. No direct mobile writes to Supabase.

### Retention and deletion proposal

| Data | Proposed retention | Deletion handling |
| --- | --- | --- |
| Raw allow-listed product events | 90 days | Delete by anonymous-install ID only if the ID is retained and a user request can be matched; otherwise expire on schedule. |
| Daily/weekly aggregated metrics without identifiers | 13 months | Retain for trend reporting; no individual deletion necessary once irreversibly aggregated. |
| Sentry error/performance data | Use the configured Sentry project retention, minimized by current scrubbing. | Follow Sentry deletion/retention controls and the privacy policy. |
| Search history/account data | Existing product-data policy; separate from this plan. | Existing account-deletion workflow must include it. |

Before shipping, have privacy counsel/owner validate the applicable jurisdictional basis, user rights workflow, vendor DPAs, hosting region, and actual retention settings. This document is product/engineering guidance, not legal advice.

### Privacy policy and Google Play Data Safety implications

The privacy policy needs a clear mobile section before collection begins, describing: the purpose (product improvement, reliability, and aggregate usage), the categories actually collected (app interactions, coarse app/device/build information, pseudonymous install ID, and technical diagnostics), providers/first-party processing, retention, deletion/contact path, and the explicit exclusions above.

Google Play Data Safety must be reviewed against the final implementation—not guessed from this plan. Likely disclosure questions include collection/sharing of **App activity** (page/screen/app interactions) for first-party analytics, **App info and performance** (crash logs/performance diagnostics through Sentry), and any identifiers used to distinguish an install. Whether each is “collected,” “shared,” optional, or encrypted in transit depends on the final endpoint, vendor contracts, and Play’s current definitions. A third-party provider or account-linking changes the review materially.

## 5. Privacy-safe search-quality analytics

Search quality should be measurable through structure and outcomes, not user content.

| Measure | Privacy-safe calculation |
| --- | --- |
| Search success rate | Server `search_outcome_recorded.outcome = success` divided by terminal search runs. |
| No-result rate | Terminal outcome `no_results` divided by terminal runs. |
| Weak-result rate | Server assigns an allow-listed weak-result reason code from result count/quality rules; no raw query or results stored in analytics. |
| Time to results | Server duration bucket from accepted submit to terminal finalize; client display event checks that users actually saw it. |
| Clarification friction | `refinement_presented` → `refinement_completed` conversion; completion mode and note-length bucket only. |
| Improve Picks adoption | Share of result presentations followed by `improve_picks_opened` / `improve_picks_submitted`. |
| Retry effectiveness | Compare coarse outcome and result-count bucket before/after retry by `search_run_id` and retry round. |
| Product-interest rate | `result_detail_opened` and `retailer_link_requested` divided by `search_results_presented`, segmented only by position and initial/retry set. |
| Recommendation usefulness | A future explicit one-tap, non-free-text verdict such as `helpful|not_helpful|not_sure` can be added only after UI and privacy review. Do not infer sentiment from typed feedback. |
| Dissatisfaction | Improve Picks submitted, query suggestion dismissed, retry failure/no-result/weak-result outcomes, and recoverable error presentation—reported as aggregate signals, not individual profiles. |

Server-generated classifications must be a short controlled vocabulary (for example `too_broad`, `insufficient_constraints`, `provider_unavailable`, `no_candidate_match`). Never store the AI rationale, generated suggested query, or model response in the analytics event.

## 6. Technical architecture options

### Comparison

| Option | Expo React Native support | Privacy controls / ownership | Cost & setup | Querying, funnels, cohorts, mobile | Relationship to Sentry |
| --- | --- | --- | --- | --- | --- |
| **Sentry technical monitoring only** | Already working in this Expo/EAS app. | Current setup is deliberately scrubbed and minimizes data. Sentry is a vendor processor; retention is set in its project. | Already integrated; cost depends on Sentry plan/usage. Low incremental setup. | Strong errors, traces, mobile vitals; weak for product funnels/cohorts/retention. | Keep. It is the technical-monitoring layer, not the product analytics layer. |
| **PostHog Cloud or self-hosted** | Expo documents a React Native/EAS integration; product analytics works in Expo Go, while native extras require builds. | Controls include EU/US region choice and self-hosting option. Must explicitly disable replay, autocapture, surveys, error tracking, and any identity enrichment not approved. Cloud means vendor processing; self-hosting adds operations. | Event-based/cloud pricing and self-host operations vary; moderate SDK/config work. | Excellent product event querying, funnels, cohorts, dashboards, feature flags/experiments; strong mobile support. | Significant optional overlap (error tracking/session replay). Keep those PostHog features off and retain Sentry. |
| **Amplitude** | Official React Native SDK supports Expo-built apps, but its docs say Expo Go is not supported. | Supports EU server zone and opt-out/tracking options; vendor cloud processing. Disable ad ID, IP, carrier, device model, and other automatic properties if selected. | Event/MTU-style commercial tiers; moderate setup; typed tracking plans via Ampli are attractive. | Excellent funnels, cohorts, retention, governance, mobile analytics, and experiments. | Overlaps in high-level product analysis, not Sentry’s error triage. Do not add replay or duplicate error capture. |
| **Mixpanel** | Has a maintained React Native SDK; verify exact Expo native-build requirements at selection time. | Vendor cloud; ensure regional, DPA, identity, retention, and export controls meet policy. | Event-based tiers; moderate setup. | Excellent event analysis, funnels, retention, cohorts, and mobile reporting. | Product analytics overlap only; Sentry still owns reliability. |
| **Firebase Analytics / GA4** | Expo notes most native analytics SDKs need a custom development build; Firebase via React Native Firebase is not an Expo Go path. | Google-managed analytics with configurable data controls, but a different vendor/identity/privacy posture and less first-party control. | Often low direct cost; native configuration and GA4/BigQuery conventions add complexity. | Mobile-capable standard analytics and audiences; funnels/cohorts are less product-analytics-focused than dedicated tools. | Some performance/error complement through Firebase products, but do not add them when Sentry already covers the need. |
| **First-party event table behind Focamai backend/Supabase** | Works with Expo through a normal HTTPS API; no native analytics SDK required. | Best ownership/control. Store only the allow-listed schema in Focamai infrastructure. Supabase is the storage layer, not a mobile client endpoint. | Lowest vendor cost initially; highest reporting/maintenance work. Requires endpoint validation, storage, aggregates, dashboard/query work, and operational ownership. | SQL/materialized views can answer initial funnels/retention; cohorts and experiments are manual/limited until a BI/product tool is added. | Clean separation: first-party semantic events; Sentry technical telemetry. |

Provider pricing, retention, and contract terms change frequently. Reconfirm them at selection. Official integration references: [Expo analytics overview](https://docs.expo.dev/guides/using-analytics/), [Expo/PostHog integration](https://docs.expo.dev/guides/using-posthog/), [Amplitude React Native SDK](https://amplitude.com/docs/sdks/analytics/react-native/react-native-sdk), [Mixpanel React Native SDK](https://docs.mixpanel.com/docs/tracking-methods/sdks/react-native), [Firebase with Expo](https://docs.expo.dev/guides/using-firebase/), and [Supabase React Native quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/react-native).

### Recommendation

**Now: first-party analytics v2.** Build a small backend endpoint with a versioned, allow-listed schema and separate event table/aggregate views. It matches the app’s current stage, avoids adding a broad SDK, keeps the data model under Focamai’s control, and can answer the priority funnel/search questions. Do not permit direct Supabase writes from the app, and do not reuse the existing raw-query web analytics storage contract.

**Later: PostHog, if self-serve analysis or experimentation becomes a real bottleneck.** It has documented Expo support and combines funnels, cohorts, and flags, but it is a meaningful vendor/privacy decision. If adopted, configure only explicit `capture` calls from this taxonomy; turn off replay, autocapture, error tracking, surveys, and cross-device identity by default. Keep Sentry in place for technical monitoring.

## 7. Implementation phases

These phases describe future work only. No phase is implemented by this plan.

### Phase 1 — Minimum useful analytics

| Item | Plan |
| --- | --- |
| Objective | Establish a privacy-safe Search → Refine → Results → retailer-intent funnel and baseline D1/D7/D30 retention. |
| Likely mobile files | New `src/lib/analytics.js` (or similarly cohesive module), `App.js` for lifecycle initialization only, `src/search/useMobileSearchController.js`, Search/FollowUp/Results/RetryUpdating/SearchResultDetail screens, and a narrowly scoped runtime feature/config file. |
| Likely backend work | New `/api/analytics/v2/events` endpoint; server-side Zod/JSON-schema equivalent validation; event-id de-duplication; separate `analytics_events_v2` storage and first aggregate queries. Do not alter old web event semantics in place. |
| Events | `app_opened`, `search_submitted`, `search_outcome_recorded`, `refinement_presented`, `refinement_completed`, `search_results_presented`, `result_detail_opened`, `retailer_link_requested`, `improve_picks_opened`, `improve_picks_submitted`, `search_error_presented`. |
| Privacy review | Approve envelope, allowed enum values, retention, anonymous ID behavior, production/internal routing, policy text, and Play Data Safety answers. |
| Testing | Unit-test event schemas and redaction rejection; integration-test event ordering/deduplication; preview-build test run against an internal data environment; inspect stored rows for prohibited fields. |
| Expected value | Answers the core funnel, result engagement, retry usage, coarse failures, and return rate with little event volume. |

### Phase 2 — Funnels and retention

| Item | Plan |
| --- | --- |
| Objective | Make the data dependable for weekly product decisions. |
| Likely mobile files | Analytics module additions only; avoid scattering raw event calls through components. |
| Likely backend work | Daily aggregate jobs/views for funnel steps, abandoned-run derivation, D1/D7/D30 anonymous-install cohorts, internal dashboard/report access controls. |
| Events | Add `marketplace_selection_completed` and `feature_entry_opened` only for stable released features. No heartbeat event unless a specific analysis cannot be derived otherwise. |
| Privacy review | Confirm aggregate thresholds/small-cohort suppression and no accidental account identity joins. |
| Testing | Replayed synthetic event fixtures; expected funnel and cohort counts; internal and production data separation test. |
| Expected value | Reliable drop-off and retention reporting without individual behavior profiles. |

### Phase 3 — Search-quality analytics

| Item | Plan |
| --- | --- |
| Objective | Diagnose weak searches and whether refinement/retry improves outcomes without recording content. |
| Likely mobile files | Search controller and query-quality/retry UI instrumentation at existing state transitions. |
| Likely backend work | Controlled outcome/classification service, aggregate quality reports, review process for any new reason code. |
| Events | `retry_results_presented`, `query_quality_suggestion_presented`, `query_quality_suggestion_actioned`; extend server `search_outcome_recorded` only with approved enum fields. |
| Privacy review | Validate every classification is categorical, never raw model output or a query-derived label that exposes sensitive intent. |
| Testing | Property fuzzing with search-like text to prove it cannot enter accepted payloads; compare server outcome to UI outcome. |
| Expected value | Quantifies no/weak-result rate, clarification friction, retry effectiveness, and dissatisfaction signals. |

### Phase 4 — Experiments and premium conversion

| Item | Plan |
| --- | --- |
| Objective | Measure premium conversion and evaluate intentional product experiments only after the core flow is stable. |
| Likely mobile files | Explicit experiment-assignment and paywall instrumentation modules; no implicit autocapture. |
| Likely backend work | Server-controlled experiment assignment, exposure logging, purchase entitlement verification, strict access controls. |
| Events | Deferred `premium_paywall_presented`, `premium_checkout_started`, `premium_purchase_confirmed`, plus a reviewed `experiment_exposed` if needed. |
| Privacy review | New purchase/account data flow, experiment fairness, consent/notice, vendor assessment if PostHog/Amplitude/Mixpanel is introduced. |
| Testing | Holdout/assignment correctness, purchase sandbox verification, no receipt/payment data in telemetry, rollback test. |
| Expected value | Measures conversion honestly without mixing payment records into analytics. |

## 8. Verification and operating governance

### Preview-build verification

1. Give analytics its own explicit environment value: `internal` for preview/internal EAS builds and `production` for production builds. Do not infer it only from `__DEV__`.
2. Route internal events to a separate dataset/project or mark them with a server-controlled environment field that is excluded from production reports.
3. Add a temporary internal-only verification control only behind the same kind of preview feature gate already used for Sentry verification. It must be absent from production navigation and production bundles where feasible.
4. Verify one complete flow in preview: launch, submit a harmless dummy query, see refine, proceed, see results, open detail, request retailer link, and use Improve Picks. Inspect the stored payloads—not merely a success response.
5. Remove the temporary control after verification or keep it permanently gated, documented, and non-production.

### Schema, duplicates, and quality controls

- Keep one event registry in source control: name, owner, priority, schema version, allowed properties/enums, trigger, and dashboard consumer.
- Validate again on the server. Reject unknown event names/properties and log only a safe rejection code; never log rejected raw payloads.
- Send a UUID `event_id`; enforce unique insertion server-side. Use `search_run_id + event_name + result_set/retry_round` where appropriate to detect logical duplicate state transitions.
- Emit from named controller/state-transition functions, not arbitrary screen renders. Use refs/state guards for once-per-run events.
- Use server receipt time for reliability and client time only for ordering. Queue a small bounded number of events offline only if the queue itself contains no prohibited data; otherwise drop safely.
- Define exactly one owner for each metric and write the formula next to the dashboard. Product owns funnel definitions; engineering owns schema/availability; privacy/security approves collection changes.

### Audit and emergency stop

- Quarterly: sample raw event rows, review schema changes, compare provider/endpoint configuration, confirm retention deletions, inspect who can query data, and update privacy disclosures.
- Before each new event: privacy review of properties, backend validation update, test fixture, and dashboard purpose.
- Add a remotely controllable, fail-closed collection kill switch enforced both in the client configuration and at the server endpoint. The server should reject events when disabled, so an old app build cannot continue collecting.
- Keep the kill switch independent of Sentry; turning off product analytics should not disable crash reporting.

## 9. Final recommendation

### Minimum setup to approve now

Implement **first-party analytics v2** behind the Focamai backend, with a single mobile analytics module, random anonymous-install and per-search-run IDs, strict server validation, 90-day raw-event retention, and aggregate reporting. Keep the current Sentry configuration unchanged as the technical monitoring layer.

### Exact first 15 events

1. `app_opened`
2. `search_submitted`
3. `search_outcome_recorded` (server)
4. `refinement_presented`
5. `refinement_completed`
6. `search_results_presented`
7. `result_detail_opened`
8. `retailer_link_requested`
9. `improve_picks_opened`
10. `improve_picks_submitted`
11. `retry_results_presented`
12. `query_quality_suggestion_presented`
13. `query_quality_suggestion_actioned`
14. `search_error_presented`
15. `feature_entry_opened` (only for a stable released feature)

Phase 1 may intentionally ship only the first eleven if query-quality and feature-use reporting are not yet a decision-making priority.

### Keep untracked

- Raw queries, prompts, AI responses, notes, typed feedback, product names, product IDs, images, prices, product lists, retailer/affiliate URLs, and purchase behavior outside the app.
- Screenshots, replay, screen recording, taps/input capture, heatmaps, autocapture, precise location, contacts, advertising IDs, device IDs, account email, passwords, tokens, headers, request/response bodies, and API payloads.
- Search history and saved searches as an analytics feed.

### Defer

- Third-party product analytics SDKs, session replay, user profiles/identify calls, cross-device retention, feature flags/experiments, premium/payment telemetry, free-text satisfaction collection, and any account-linked behavioral analytics.

### Required disclosures before release

Update the privacy policy and complete a fresh Google Play Data Safety review based on the deployed implementation. Include the first-party product-event categories, pseudonymous install identifier, retention/deletion approach, existing Sentry technical diagnostics, third-party processors if any, and the fact that the app does not collect replay, typed input, or raw search content for analytics.
