# Freebuff Run Doc — Career Counseling Platform (CC)

Two processes make the app viewable: an Express API (`server`, port 5000) and a
Next.js client (`client`, port 3000 by default). The API talks to MongoDB Atlas
(database `auth-db`) — no local Mongo needed.

## Reproduce the uncommitted artifacts

A fresh checkout needs these env files, which are gitignored and must be copied
from the main checkout (never symlinked — values such as ports may need adapting
per worktree):

1. Copy `server/.env` from the main checkout into `server/`.
   - It contains the `MONGODB_URI` (Atlas) and the API port (default 5000).
   - Do NOT commit or paste the values into this doc.
2. Copy `client/.env.local` from the main checkout into `client/`.
   - Optional; the client falls back to `http://localhost:5000/api/v1` when
     `NEXT_PUBLIC_API_URL` is unset. If you run the API on a different port,
     set `NEXT_PUBLIC_API_URL` accordingly.
3. Install dependencies:
   - `cd server && npm install`
   - `cd client && npm install`

The DB seed data (IPIP-NEO-120, O*NET Interest Profiler, O*NET WIL) already
lives in Atlas. To re-seed: `cd server && npm run seed:ipip` (plus the
interest-profiler / WIL seeders in `src/database/`).

## Run the server

1. API (detached, so it outlives the conversation):

   ```bash
   cd server && node src/server.js > /path/to/api.log 2>&1 &
   ```

   Health check: `curl http://localhost:5000/api/v1/health` → `200`.

2. Client dev server (detached, on a free port — 3000 is the default):

   ```bash
   cd client && npm run dev -- -p 3001 > /path/to/client.log 2>&1 &
   ```

   Gotcha: Next 16 refuses to start a SECOND dev server for the same project
   directory (it detects the `.next` lock and exits with “Another next dev
   server is already running”). If port 3000 is already serving this project,
   just reuse that server (it serves live source, so client edits show up
   immediately) or stop it first (`taskkill /PID <pid> /F`) before starting a
   new one. The client reads the same `.env.local` as the main checkout, so
   `NEXT_PUBLIC_API_URL` (default `http://localhost:5000/api/v1`) applies as-is.

3. Open the client URL (e.g. `http://localhost:3001`) and log in as a student.Note: the API on port 5000 is a plain `node src/server.js` process — restart it
 to pick up server code changes (it does not watch files). `npm run dev`
 (nodemon) is also available. The API port is env-overridable:
 `PORT=5001 node src/server.js`.

## Demo data (optional, for the counselor Assessments preview)

`server/scripts/setupPreviewDemo.js` idempotently creates a demo counselor
(`preview.counselor@example.com`), three demo students, and assignments across
IPIP-NEO-120 / Interest Profiler / WIL in completed, in-progress, and
not-started states — so the Assessment Library shows real aggregates:

```bash
cd server && node scripts/setupPreviewDemo.js
```
