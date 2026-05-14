---
name: Backend API URL
description: The deployed Render backend URL for the Focama API (shared by web and mobile)
type: reference
---

Backend API base URL: https://focama-web.onrender.com

Key endpoints:
- `GET /api/health` — general health check
- `GET /api/health/supabase` — Supabase connection check
- `GET /api/search/rainforest-discover` — discovery step
- `GET /api/search/refine` — refinement step
- `POST /api/search/finalize` — finalize step

Use this as `EXPO_PUBLIC_API_BASE_URL` in mobile `.env` (or `.env.local` for web).
