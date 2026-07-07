Bottom line
For the currently configured production Android build, the safest supportable Google Play declaration is:
Data collected: Yes
Data shared: Yes — conservatively, because product images load directly from Amazon’s CDN.
All data encrypted in transit: Yes
Data deletion request mechanism: Yes
Data types: seven listed below
No advertising or marketing use
Google defines “collected” as data transmitted off-device—even when sent through an SDK—and treats service providers processing under your instructions as an exception to “shared.” It also requires ephemeral data to be declared. Official Google Play guidance.
Data-type audit
Google data type	Collected	Shared	Required?	Ephemeral?	Purposes
In-app search history	Yes	No*	Required	No	App functionality; Personalization; Analytics; Fraud prevention/security/compliance
Other user-generated content	Yes	No*	Optional	No	App functionality; Personalization
Voice or sound recordings	Yes	No*	Optional	Yes	App functionality
App interactions	Yes	Yes†	Required	No	App functionality; Analytics
Other actions	Yes	No*	Required	No	App functionality; Personalization
Diagnostics	Yes	No*	Required	No	Analytics
Device or other IDs	Yes	Yes†	Required	No	Fraud prevention/security/compliance; Analytics; shared for App functionality

* “No” assumes Render, Supabase, OpenAI, Anthropic, Rainforest API and Sentry are acting as service providers under their applicable agreements.
† Conservative answer because result images are loaded directly from m.media-amazon.com. Amazon consequently receives the user’s IP/network metadata and the image URL identifying the product displayed. This transfer is automatic, not a user-initiated retailer click.
What causes each type
In-app search history: product query and voice transcript submitted through [searchApi.js (line 140)](/Users/zvibasser/Documents/Projects/focamai-mobile/src/search/searchApi.js:140). Queries are sent to Render, Rainforest, OpenAI and Anthropic and written to Supabase search cache/internal history through [search-cache-storage.js (line 117)](/Users/zvibasser/Documents/Projects/focama-web/backend/lib/storage/search-cache-storage.js:117) and [analytics-storage.js (line 17)](/Users/zvibasser/Documents/Projects/focama-web/backend/lib/storage/analytics-storage.js:17).
Other user-generated content: optional refinement notes and retry feedback, sent by [searchApi.js (line 176)](/Users/zvibasser/Documents/Projects/focamai-mobile/src/search/searchApi.js:176) and its retry-advice request. Refinement context can be retained inside cached candidate/selection data.
Voice recordings: expo-av records audio and uploads it in [useVoiceRecorder.js (line 12)](/Users/zvibasser/Documents/Projects/focamai-mobile/src/search/useVoiceRecorder.js:12). The backend holds it in Multer memory and forwards it to OpenAI Whisper in [express-server.js (line 149)](/Users/zvibasser/Documents/Projects/focama-web/backend/express-server.js:149). Focamai does not persist it. OpenAI currently documents no retention for /v1/audio/transcriptions, supporting “ephemeral.” OpenAI data controls.
App interactions: backend and Render logs reveal use of discovery, refinement, finalize, transcription and retry endpoints. Search-flow logging includes endpoint events, timing and result counts in [server-helpers.js (line 101)](/Users/zvibasser/Documents/Projects/focama-web/backend/lib/server-helpers.js:101). Amazon also receives automatic product-image requests from [MobileUI.jsx (line 443)](/Users/zvibasser/Documents/Projects/focamai-mobile/src/components/MobileUI.jsx:443).
Other actions: selected Amazon marketplace/domain is sent with searches and retained in cached search context.
Diagnostics: backend timing, errors, provider status, result counts and platform are logged; failed requests can be sent to backend Sentry through [observability.js (line 98)](/Users/zvibasser/Documents/Projects/focama-web/backend/lib/observability.js:98).
Device or other IDs: Render receives the connection IP. The backend extracts it and creates a salted SHA-256 rate-limit key in [rate-limit.js (line 83)](/Users/zvibasser/Documents/Projects/focama-web/backend/lib/rate-limit.js:83). Supabase-backed rate limiting is active on the deployed backend. Amazon’s image CDN also receives the IP directly.
Exact Play Console answers
Page: Data collection and security
Does your app collect or share any of the required user data types? Yes
Is all user data collected by your app encrypted in transit? Yes
Do you provide a way for users to request deletion of their data? YesURL: https://focamai.com/delete-account
Additional mechanism: contact@focamai.com

Google permits “Yes” when a deletion-request mechanism exists even if some fraud-prevention or anonymous operational records must remain. Official deletion guidance.
Page: Data types
Select:
App activityApp interactions
In-app search history
Other user-generated content
Other actions

Audio filesVoice or sound recordings

App info and performanceDiagnostics

Device or other IDsDevice or other IDs

Leave every other category unchecked, including:
Location
Name, email address and user IDs
Financial information and purchase history
Health and fitness
Messages
Photos and videos
Files and documents
Contacts and calendar
Web browsing history
Crash logs
Installed apps
Page: Data usage and handling
For each selected type, enter the values from the audit table above.
For the two shared types:
App interactionsShared: Yes
Sharing purpose: App functionality

Device or other IDsShared: Yes
Sharing purpose: App functionality

For all other selected types, answer Shared: No, subject to the service-provider qualification.
Build and SDK findings
The generated Expo Android manifest contains:
INTERNET
RECORD_AUDIO
MODIFY_AUDIO_SETTINGS
legacy external-storage permissions
VIBRATE
SYSTEM_ALERT_WINDOW
Permission presence alone does not require Data Safety disclosure unless data is actually collected. Google explicitly confirms that rule.
There is no Firebase, advertising, attribution, notification, location, maps, camera, mobile analytics or mobile crash-reporting SDK. Autolinked runtime modules are Expo core/assets/filesystem/font/AV/secure-store, AsyncStorage, Reanimated, Screens, Safe Area, SVG and related UI modules. Expo Updates is disabled.
The production EAS environment currently contains no remote variables. [eas.json (line 1)](/Users/zvibasser/Documents/Projects/focamai-mobile/eas.json:1) supplies only the HTTPS Render API URL. Consequently:
Account UI defaults off.
Price Watch UI defaults off.
Deep Dive UI defaults off.
Supabase authentication is not configured in the production build.
Do not declare Email address or User IDs for this build.
Remaining evidence gaps
Two external facts cannot be proven from source code:
Google Play considers all currently distributed artifacts together. Confirm that no older testing/production artifact enables accounts or embeds Supabase credentials. If one does, add optional Email address and User IDs for Account management.
The direct Amazon image request creates a defensible sharing concern. The conservative submission above declares App interactions and Device IDs as shared. If images are proxied through Focamai, or authoritative guidance confirms this CDN access is exempt, those sharing answers could become No.
Also, cache rows are marked to expire after 24 hours but are not automatically deleted; internal search logs, hosting logs and hashed rate-limit records have no reliable repository-defined deletion deadline. They must therefore be answered as retained, not ephemeral.