# Phase 2 demo backbone

The Explorer can persist a complete run loop through `POST /api/runs`:

- `start` with `runnerName` and safe `zoneIds`
- `points` with a batch of GPS points (impossible jumps over 300 m/s are rejected)
- `observation` for structured vision/voice/fused evidence (blocked evidence is refused)
- `complete` with `accepted: true|false` (only accepted bounties earn simulated pence)
- `finish`, optionally with `handoff: true`

`GET /api/runs` returns the local demo ledger. It writes `.data/phase2.json` on the server and is intentionally easy to replace with the optional `docs/phase2-schema.sql` Supabase shape when credentials and auth are available.
