# Google Play App Content — Answers for Focamai v1.0

Last updated: 2026-06-15

Answers for Play Console > App content sections: Data safety and Content rating.
Based on what the mobile app does today (no auth, no subscriptions).
Update this file when auth or subscriptions are added.

---

# Part 1: Data Safety Form

Play Console > App content > Data safety

---

## Overview questions

**Does your app collect or share any of the required user data types?**
Yes

**Is all of the user data collected by your app encrypted in transit?**
Yes — all API calls use HTTPS to the Render backend.

**Do you provide a way for users to request that their data be deleted?**
Yes — local search history can be deleted per-entry or cleared entirely from Settings > Search history. Server-side search logs do not have a self-service delete yet, but users can email support. Note this if Google asks for specifics.

---

## Data types — what to declare

### Audio
- **Collected:** Yes
- **Shared with third parties:** No
- **Purpose:** App functionality (voice search transcription)
- **Is processing ephemeral?** Yes — audio is sent to your own backend for transcription and is not stored on the server after processing
- **Is collection required or optional?** Optional — users can type instead of using voice

### Search history (under "App activity")
- **Collected:** Yes
- **Shared with third parties:** No (stays on your server)
- **Purpose:** App functionality, analytics
- **Is processing ephemeral?** No — search queries are logged in your Supabase `search_history` and `analytics_search_runs` tables
- **Is collection required or optional?** Required — the app needs the search query to function
- **Also stored locally:** Yes — completed searches are saved to on-device AsyncStorage. Users can delete them from Settings > Search history.

### Other app activity (app interactions)
- **Collected:** Yes
- **Shared with third parties:** No
- **Purpose:** Analytics
- **What specifically:** Which results were shown (impressions), which were tapped (clicks), funnel behavior (did user refine, skip, complete). Stored in `analytics_result_impressions`, `analytics_result_clicks`, `analytics_search_events` tables.
- **Is processing ephemeral?** No
- **Is collection required or optional?** Required (automatic as part of the search flow)

---

## Data types — what to answer "No" to

All of these: the app does not collect any of them.

- Location (no GPS, no IP-based location, marketplace is explicit user choice)
- Personal info (name, email, phone, address, date of birth, user IDs)
- Financial info (purchase history, credit card, payment info)
- Health and fitness
- Messages
- Photos and videos
- Contacts
- Calendar
- Device or other IDs (no advertising ID, no Android ID, no device fingerprinting)
- Web browsing history
- Files and docs

---

## Third-party services that process user data

These don't need to be declared as "sharing" in the data safety form because they are service providers processing data on your behalf, not receiving data for their own purposes. But be aware of them:

| Service | What receives user data | Data sent |
|---|---|---|
| Rainforest API | Product search provider | Search query text, Amazon domain |
| Oxylabs | Fallback product search provider | Search query text, Amazon domain |
| OpenAI | AI processing (refinement question, pick selection) | Search query, follow-up notes, product candidate data |
| Anthropic Claude | AI processing (primary or fallback) | Search query, follow-up notes, product candidate data |
| Sentry | Error monitoring (backend only) | Error messages/stack traces; PII disabled but query text could appear in error context |
| Supabase | Database hosting | All server-side stored data listed above |
| Render | Backend hosting | Server logs contain search queries in plaintext (retained per Render's log policy) |

**Note on AI providers:** Both OpenAI and Anthropic may retain API inputs under their default data policies unless you have opted out. Check your API agreements if Google or users ask about downstream retention.

---

## What changes when auth is added

Update the data safety form to add:

- **Email address** — collected for account creation, not shared with third parties
- **Account info / user IDs** — Supabase user ID used to scope saved searches

## What changes when subscriptions are added

Update the data safety form to add:

- **Purchase history** — collected for subscription management
- **Financial info** — depending on payment provider (Stripe, Google Play Billing, etc.)

---

## Privacy policy URL

https://focamai.com/privacy

This is already publicly hosted on the web app (Vercel). Use this URL in the Play Console store listing.

---

# Part 2: Content Rating Questionnaire

Play Console > App content > Content rating > Start questionnaire

## Step 1: Category

Select **"Utility, Productivity, Communication, or Other"** — Focamai is a product search/shopping utility, not a game or media app.

## Step 2: Questionnaire answers

| Question | Answer | Why |
|---|---|---|
| Does the app contain violence or references to violence? | No | Product search only |
| Does the app contain sexual content or nudity? | No | |
| Does the app allow or facilitate gambling? | No | |
| Does the app contain references to drugs, alcohol, or tobacco? | No | Product results could theoretically include these, but the app does not promote or feature them |
| Does the app contain crude humor or profanity? | No | |
| Does the app allow users to interact or exchange content with each other? | No | No social features, no chat, no forums, no user profiles |
| Does the app share the user's current location with other users? | No | No location features at all |
| Does the app allow users to purchase digital goods? | No | Not yet — update when subscriptions are added |
| Does the app contain unrestricted internet access or allow access to web content? | No | The app opens Amazon product links in the device browser, but does not contain an embedded web browser or unrestricted browsing |
| Does the app contain advertising? | No | |
| Does the app contain content generated by users or allow user-generated content to be shared? | No | The app shows AI-curated Amazon product results, not user-generated content. Users type search queries and follow-up notes, but these are never shared with or visible to other users. |

## Expected rating

**Everyone** (IARC "3+" equivalent). A product search tool with no objectionable content, no social features, and no in-app purchases should receive the lowest age rating.

## Notes

- If Google asks about "third-party content": the app shows Amazon product listings (titles, prices, images, ratings) retrieved through your backend. This is structured commerce data, not arbitrary user-generated content.
- The content rating will need updating when subscriptions are added (the "digital goods" answer changes to Yes).
- If voice search is flagged as "unrestricted audio input" — it is constrained to product search transcription only, not open communication.

---

# Part 3: Target Audience Declaration

Play Console > App content > Target audience and content

**Is this app designed for children under 13?**
No

**Select target age groups:**
Select **18 and over** only.

This keeps the app out of Google's "Designed for Families" program and avoids all COPPA / children's privacy requirements. The "Everyone" content rating still allows anyone to download it — target audience only controls whether Google applies children's policies to you.

Update when subscriptions are added: no change needed here unless the app starts targeting younger users.

---

# Part 4: Ads Declaration

Play Console > App content > Advertising

**Does your app contain ads?**
No

That's it. Update this if ads are ever added.

---

# Part 5: Store Listing

Play Console > Main store listing

## Required items — checklist

### Copy (Claude can draft these when you're ready)

- [ ] **App name** — "Focamai" (already set in app config)
- [ ] **Short description** — up to 80 characters. One sentence that shows before users tap "read more." Should say what the app does.
- [ ] **Full description** — up to 4000 characters. Explain what the app does, how it works, and why someone would use it. Google indexes this for Play Store search.
- [ ] **Release notes** — "What's new" text for v1.0. Can be short since it's the first release.

### Images (you need to create/capture these yourself)

- [ ] **App icon** — 512x512 PNG, 32-bit, no transparency. You already have `assets/app-icon.png` — verify it meets these specs and upload it.
- [ ] **Feature graphic** — 1024x500 PNG. This is the banner at the top of your store listing. Use Canva or similar. Should show the app name/brand and give a sense of what the app does. No screenshots inside it — Google discourages that.
- [ ] **Phone screenshots** — minimum 2, recommended 4-8. JPEG or 24-bit PNG, 16:9 or 9:16 aspect ratio, each side between 320px and 3840px. Take real screenshots from your phone running the app. Good candidates:
  1. Search screen (the entry experience)
  2. Follow-up/Refine screen (the AI question)
  3. Results screen (the 6 focused picks)
  4. Detail screen (a single pick with AI explanation)
  5. Settings or region picker (optional)

**Tip:** Use your real device with a clean search that produces good-looking results. Avoid searches that return ugly/broken data.

### Categorization

- [ ] **App category** — select **"Shopping"**
- [ ] **Tags** — Google lets you pick up to 5 tags. Good options: "Shopping," "Product search," "AI assistant," "Price comparison," "Smart shopping"

### Contact info

- [ ] **Contact email** — a public email shown on the listing. Use your support/business email, not a personal one if you prefer. Can be the same email linked in the Contact screen.
- [ ] **Contact website** — optional. Could use `https://focamai.com`
- [ ] **Contact phone** — optional. Can skip.

### Already done

- [x] **Privacy policy URL** — `https://focamai.com/privacy`

## Order of operations

1. Draft the copy (short description, full description, release notes) — ask Claude when ready
2. Take phone screenshots from a real device with a good-looking search
3. Create the feature graphic (Canva, Figma, or similar)
4. Upload everything to Play Console
5. Review the preview and submit
