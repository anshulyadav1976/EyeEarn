# EyeEarn demo storage

`src/lib/phase2-store.ts` uses Node 22's built-in `node:sqlite` (`.data/phase2.sqlite`) during local development when available. Runs, route points, observations, completions, and buyer-funded bounty totals are stored as JSON blobs/rows. Every write also updates `.data/phase2.json`, which is the portable snapshot.

Use `GET /api/storage/export` to download the current snapshot before deploying. The snapshot is intentionally allowed through `.gitignore` so it can be committed for a Vercel demo. Vercel's filesystem is ephemeral: writes during a deployed session are not durable and are not shared with future serverless instances. Vercel reads the committed snapshot and keeps new writes in memory for the lifetime of an instance. For production persistence, replace this adapter with a hosted database.

`GET /api/health` reports the selected backend, SQLite availability, writability, and snapshot location.

`POST /api/analyze-frame` remains compatible with the single `frame` JPEG field. New clients may send 2–3 JPEG files under repeated `frames` fields. Luna receives the complete short burst in one request and returns one temporal report with `reportType: "temporal-burst"` and `framesAnalyzed`.
