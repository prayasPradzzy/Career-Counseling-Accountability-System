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

The interview question generator needs its two PromptTemplate documents
seeded once: `cd server && node src/database/seed-interview-prompts.js`
(upserts, safe to re-run).

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

   CORS gotcha: the API's allowlist comes from `CLIENT_URL` in `server/.env`.
   If you run the client on a port other than 3000, ADD that origin to
   `CLIENT_URL` (comma-separated) or the browser silently drops some API calls
   (dashboard stats render 0/blank). Currently set to
   `http://localhost:3000,http://localhost:3001`.

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

`server/scripts/testInterviewFlow.js` verifies the interview question
workflow end-to-end (priority mapping + full API flow) with fabricated
high-Neuroticism scores, then cleans up after itself.

`server/scripts/testInterviewPhase2.js` verifies Phase 2 (session
conduction + recording): consent gate, GridFS storage, real-duration
extraction, signed playback URL + range streaming, and the
approved → in_progress → recorded → completed flow. Both tests clean up
after themselves and require the API running on :5000.

`server/scripts/testInterviewFixes.js` verifies (A) duplicate-cluster
normalization — an LLM response listing the same cluster twice collapses to
ONE entry with the deterministic priority and merged questions — and (D) Groq
provider routing through the AI Services Layer (stubbed fetch, no real key).
`server/scripts/setupInterviewHighDemo.js` fabricates a demo student
(`interview.high.demo@example.com`) with High-priority cluster signals and a
fresh approved question set for visual verification.

`server/scripts/auditFinal.js` is the COMPREHENSIVE FINAL AUDIT: one clean
end-to-end scenario (fresh counselor + student through the REAL signup
flow) covering auth/access control, mutual-visibility scoping, all three
assessments (IPIP incomplete-block + auto-score, Interest-Profiler zero-box
submit, WIL forced-rank server-side enforcement + math spot-check), the
retake system, interview Phase 1+2 (incl. consent gate + GridFS + signed
URLs), student-friendly-only results, and Intake-Progress parity — then
self-cleans. Run it with the API on :5000: `node scripts/auditFinal.js`.
Exit 0 = 117 checks pass. (It also doubles as a regression net: it once
caught a live data leak and a 500-on-empty-scoring bug that are now fixed.)

## AI provider (Groq)

The AI Services Layer (`server/src/modules/ai/ai.service.js`) is the only
place that knows about providers. To use Groq (free tier, no card):

1. Get a key at console.groq.com → API Keys.
2. Set in `server/.env` (and on Render):
   `LLM_PROVIDER=groq`, `GROQ_API_KEY=...`, `LLM_MODEL=llama-3.3-70b-versatile`.
3. Nothing else changes — features call `aiService.generate()` and never see
   the provider. The key's absence falls back to the deterministic generator.
   (The same Groq account's Whisper endpoint can later serve Phase 3's
   Hinglish transcription.) Free-tier rate limits (~30 req/min) are
   org-wide, not per-key.

Phase 2 audio notes: recordings live in a GridFS bucket named
`audioAssets` (only a reference is stored in the `AudioAsset` collection);
the public signed-playback stream is mounted at `/api/v1/interview-audio`
(and `/api/interview-audio`) with NO auth — the HMAC-signed, expiring token
in the URL is the access control. It is mounted at its own namespace so the
counselor router's router-level `requireAuth` can never shadow it.

