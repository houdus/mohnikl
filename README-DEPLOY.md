# MovieBox International — Deployment Guide

Netflix-style promotional catalog for the **MovieBox Windows app**.
The website never plays movies — it teasers the catalog (trailers only)
and funnels every visitor to **Download App**.

## What's inside

| Feature | Where |
|---|---|
| Region switcher (15 regions, live TMDB ranking) | Navbar 🌍 |
| Netflix hover cards + Top 10 + search + My List | Home page |
| Download App CTA | Navbar · Hero · Modal · Footer · Floating bar |
| "Download starting… Thank you & enjoy the great movies!" popup | Every download |
| 20-second auto-redirect (idle visitors get the download) | Configurable in Admin |
| Platform blocking (Linux / Android / iOS / macOS / ChromeOS) | Server-enforced, configurable |
| Admin dashboard (views, devices, blocks, downloads, settings) | `/admin` |
| Analytics backend | Supabase (production) or local file store (demo) |

## Admin dashboard

Visit **`https://YOUR-DOMAIN/admin`** (there's also a discreet "Admin" link in
the footer).

- **Default password:** `moviebox-admin` — change it with the `ADMIN_PASSWORD`
  env var before going live.
- You get: page views, unique visitors, device/platform breakdown, how many
  visitors were **blocked** (per platform), **app downloads** (per source
  surface), 20s auto-redirect conversions, top regions, live event feed.
- **Funnel settings** let you edit — with no redeploy:
  - which platforms are blocked,
  - auto-redirect on/off + seconds,
  - the popup message text,
  - the real installer URL (`APP_DOWNLOAD_URL`).

## Where downloads go

Every "Download App" click hits `/api/download`, which:

1. logs the download event (counted in Admin), then
2. redirects to `APP_DOWNLOAD_URL` / the URL set in Admin, or
3. falls back to the bundled placeholder `public/downloads/MovieBox-Setup.zip`.

Replace the placeholder with your real installer, or just set the URL.

---

## Step 0 — Supabase (5 minutes, free)

The app works without Supabase (local file store) but on Vercel the file
system is read-only, so **analytics need Supabase in production**.

1. Create a project at [supabase.com](https://supabase.com) (free plan).
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**.
   This creates `analytics_events` + `app_settings` (RLS locked — server-only).
3. Copy from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`
     (⚠️ service role, not the anon key — the server writes analytics.)

Admin dashboard shows a green **"Supabase connected"** badge when wired.

## Option A — Vercel (free)

Vercel deploys Next.js natively (no Docker needed):

```bash
# 1. Push this folder to a GitHub repo (a .gitignore is included)
git init && git add -A && git commit -m "MovieBox International"
git remote add origin https://github.com/YOU/moviebox.git && git push -u origin main
```

2. [vercel.com/new](https://vercel.com/new) → Import the repo → Framework:
   **Next.js** (auto-detected) → add the env vars:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
   | `ADMIN_PASSWORD` | a strong password |
   | `APP_DOWNLOAD_URL` | your real installer link (optional) |
   | `TMDB_API_KEY` | your TMDB key (optional, demo key used otherwise) |

3. **Deploy**. Done.

> CLI alternative: `npm i -g vercel && vercel --prod`

## Option B — Render (free Docker plan)

1. Push to GitHub (same as above), or use the included `render.yaml`.
2. Render Dashboard → **New → Blueprint** → pick the repo (detects
   `render.yaml`), or **New → Web Service** → Runtime **Docker**.
3. Set the same env vars as above (`render.yaml` asks for them).
4. Health check path is `/api/health`.

## Option C — Railway

1. Railway → **New Project → Deploy from GitHub repo**.
2. Railway auto-detects `Dockerfile` + `railway.json`.
3. Add the env vars in **Variables**, deploy. Health check: `/api/health`.

## Option D — Any Docker host / VPS

```bash
docker build -t moviebox .
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e ADMIN_PASSWORD=change-me \
  -e APP_DOWNLOAD_URL=https://your-cdn.com/MovieBox-Setup.exe \
  moviebox
```

## Environment variables reference

| Var | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | prod | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | prod | Server-side analytics writes |
| `ADMIN_PASSWORD` | yes | `/admin` login (default `moviebox-admin`) |
| `ADMIN_SECRET` | no | Extra salt for the admin cookie |
| `APP_DOWNLOAD_URL` | no | Real installer link (else placeholder zip) |
| `TMDB_API_KEY` | no | TMDB content key (shared demo key fallback) |
| `BLOCKED_PLATFORMS` | no | JSON array override, e.g. `["mobile","mac","linux"]` |
| `DATA_DIR` | no | Local demo store location (default `./data`) |

## Platform blocking

Blocked platforms (default: **everything except Windows**) get a
"MovieBox is Windows-only" gate screen instead of the site — and each block
is counted in Admin. The blocklist is enforced server-side (blocked UAs never
receive the app bundle) and editable live in **Admin → Funnel settings**.

## Notes

- Content is live from **TMDB**; the shared demo key is rate-limited, so get
  your own free key for production.
- On Vercel the local file store can't persist (read-only FS) — that's why
  Supabase is step 0. On Render/Railway the local store works even without
  Supabase, but doesn't survive container restarts unless you mount `/app/data`.
- All times in the dashboard are UTC.
