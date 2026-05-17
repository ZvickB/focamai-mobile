# Maestro Smoke Tests

These flows are a small repeatable smoke layer for the Expo app. They do not replace manual Expo Go testing; they just make the stable shell path easy to rerun.

## Prerequisites

- Android emulator or Android device with Expo Go installed.
- Maestro CLI installed and available on `PATH`.
- Metro running for this app.

On Windows PowerShell, install Maestro from the official installer and restart the shell if `maestro --version` is not found.

## Run the stable shell smoke

Start Expo:

```powershell
npx expo start --clear --lan
```

Then run Maestro. Use the Expo URL shown by the Expo terminal. The default in the flow is `exp://127.0.0.1:8081`, but physical devices usually need the LAN URL.

```powershell
npm run maestro:smoke -- -e EXPO_GO_URL=exp://YOUR_LAN_IP:8081
```

What this currently automates:

- Opens the app in Expo Go.
- Verifies the Search screen renders.
- Opens Settings.
- Returns to Search with Android back.

## Optional live search flow

`search-live.yaml` is intentionally separate because it needs a reachable backend and live provider responses. It can fail because of network/provider latency, backend env, rate limits, or changing product data.

```powershell
npm run maestro:search:live -- -e EXPO_GO_URL=exp://YOUR_LAN_IP:8081
```

You can override the query and follow-up notes:

```powershell
npm run maestro:search:live -- -e EXPO_GO_URL=exp://YOUR_LAN_IP:8081 -e SEARCH_QUERY="office chair" -e FOLLOW_UP_NOTES="Good lumbar support, not too bulky"
```

Keep full product judgment, retailer CTA checks, enrichment hydration, retry advice, and marketplace behavior in manual smoke testing until a stable fixture/backend mode exists.
