# Deployment Guide — CareerPath

This project is a monorepo with two deployable apps:

| App | Folder | Platform (free tier) |
|---|---|---|
| Backend (Express + MongoDB) | `server/` | Render |
| Frontend (Next.js) | `client/` | Vercel |

Both deploy from the same GitHub repository — each platform points at its subfolder.

---

## Pre-Deployment Audit Summary (run 2026-08-10)

Issues found and already fixed in code:

1. **Cross-site auth cookie (deploy blocker).** The app authenticates with an HttpOnly cookie (`withCredentials: true`). In production the frontend (Vercel) and backend (Render) are different sites, and the old `SameSite=Lax` cookie would never be attached to API calls — every request would 401. `server/src/modules/auth/auth.controller.js` now sets `SameSite=None` in production (with `Secure`, which it already had). Verified live: `Set-Cookie: ... HttpOnly; Secure; SameSite=None`.
2. **Graceful shutdown crash.** `server/src/server.js` called `mongoose.connection.close()` without importing `mongoose` — a `ReferenceError` the moment Render sends SIGTERM on restart. Import added.
3. **Undefined `Button` in `DialogFooter`.** `client/src/components/ui/dialog.jsx` rendered `<Button>` in a never-used `showCloseButton` path without importing it — a latent crash. Import added.
4. **Unused dependency removed.** `express-rate-limit` had zero references — `npm uninstall`'d. `depcheck` now reports no issues on the server; all client-side flags were false positives (CSS `@import`s of `tw-animate-css`, `tailwindcss`, `@tailwindcss/postcss`, `shadcn`).
5. **Repo hygiene.** Freebuff tool state (`.freebuff/desktop-v2.db*`, preview `.log`) was committed — untracked via `git rm --cached` and excluded in a new root `.gitignore`. `node_modules` is ignored on both sides and never committed. Created `server/.env.example` (client already had one).
6. **Secrets history: clean.** No `.env` files tracked; `mongodb+srv://` appears nowhere in git history; the only `JWT_SECRET` history hits are `process.env.JWT_SECRET` code references.

Known non-blocking lint state: ESLint reports 22 errors / 10 warnings across the client, all React-Compiler style rules (components created during render, `setState` in effects, unescaped entities, impure `Date` formatting) — none break running functionality. The two latent bugs above were the only ones with runtime impact.

---

## Environment Variables (the exact list you need)

### Backend (set on Render)

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | Long random string, e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` (used for CORS + redirect links). Accepts a **comma-separated list** of origins — Vercel regenerates project URLs on rename, so add every Vercel URL you use, e.g. `https://app.vercel.app,https://preview.vercel.app` |
| `NODE_ENV` | `production` |
| `PORT` | Render sets this automatically — the code reads `process.env.PORT` |

### Frontend (set on Vercel)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Render URL **including `/api/v1`**, e.g. `https://your-app.onrender.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` (canonical/OG URLs) |
| `NEXT_PUBLIC_APP_NAME` | `CareerPath` |

> `NEXT_PUBLIC_*` vars are inlined into the client bundle at **build time** — set them in Vercel before/at deploy.

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a repo at github.com → New Repository, then:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

`client/` and `server/` both live in this one repo — fine, Render and Vercel each point at a subfolder.

## Step 2 — MongoDB Atlas

1. Atlas → your cluster → **Network Access** → Add IP → **Allow Access from Anywhere** (`0.0.0.0/0`). Render's free tier uses dynamic IPs, so this + a strong DB password is the practical free-tier setup.
2. **Database Access** → confirm a strong password.
3. **Connect → Drivers** → copy the `mongodb+srv://...` string → this is `MONGODB_URI`.

> The app currently connects to the `auth-db` database name in your existing cluster.

## Step 3 — Deploy the backend to Render

1. render.com → **New → Web Service** → connect GitHub → pick the repo.
2. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (runs `node src/server.js`)
   - **Instance Type:** Free
3. Add the backend env vars from the table above (`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `NODE_ENV`).
4. **Create Web Service.** First deploy takes a few minutes.
5. Copy your backend URL (e.g. `https://your-app.onrender.com`).

**Free-tier gotcha:** Render free services spin down after ~15 min idle and take 30–50 s to cold-start — the first request after inactivity looks like a hang. Not a bug.

## Step 4 — Deploy the frontend to Vercel

1. vercel.com → **Add New → Project** → import the repo.
2. Configure:
   - **Root Directory:** `client`
   - **Framework Preset:** Next.js (auto-detected)
3. Add the frontend env vars from the table above (especially `NEXT_PUBLIC_API_URL` = Render URL + `/api/v1`).
4. **Deploy.** Copy your frontend URL (e.g. `https://your-app.vercel.app`).

## Step 5 — Connect the two

1. Back on Render → your service → **Environment** → set `CLIENT_URL` to the real Vercel URL from Step 4. It accepts a comma-separated list of origins, so include every Vercel URL you use (e.g. `https://your-app.vercel.app,https://your-old-app.vercel.app`). The CORS config in `server/src/app.js` reads `process.env.CLIENT_URL` and allows each origin listed.
2. Render redeploys automatically on env change. Then re-deploy the Vercel side if you changed any `NEXT_PUBLIC_*` var (Vercel rebuilds on env change too).

The cross-site cookie is already handled — the backend sends `SameSite=None; Secure` in production, which modern browsers accept over HTTPS.

## Step 6 — Test end-to-end on the live URLs

- Sign up as a counselor → confirm an invite code is generated.
- Sign up as a student with that code → confirm the counselor link works.
- Assign and complete an assessment (Likert, checklist, and WIL) → confirm scoring + results render.
- Test on desktop and mobile.

## Step 7 — Optional (skip for launch)

- UptimeRobot (free) to ping the Render URL every 5 min — keeps it warm and avoids most cold starts.
- Custom domain later — same-site (`app.yourdomain.com` + `api.yourdomain.com`) would even let you relax the cookie back to `SameSite=Lax`.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| CORS block: "Access-Control-Allow-Origin ... not equal to the supplied origin" | `CLIENT_URL` on Render doesn't list the Vercel origin you're actually on (Vercel URL changed on rename/recreate) — update it to the current URL, or add it to the comma-separated list |
| Frontend loads, API calls fail (401/CORS) | `NEXT_PUBLIC_API_URL` wrong (must include `/api/v1`), or `CLIENT_URL` not the exact Vercel origin |
| First request after idle hangs 30–50 s | Render free-tier cold start — normal |
| "Cannot connect to database" | Atlas Network Access not open (`0.0.0.0/0`), wrong `MONGODB_URI`, or DB user password |
| Logged out on every reload | Cookie not sent — verify the API's `Set-Cookie` header shows `SameSite=None; Secure` in production |
| Works locally, fails deployed | Hardcoded `localhost` missed — re-grep: `client/src/lib/api.js`, `client/src/app/layout.js`, `server/src/app.js`, `server/src/modules/auth/signupStrategies.js`, `server/src/modules/counselors/counselorInvite.service.js` (all read env with localhost fallbacks) |
