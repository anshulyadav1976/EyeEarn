# EyeEarn

EyeEarn pays explorers to fill valuable real-world evidence gaps, then turns privacy-processed observations into cited place intelligence.

## Current scope

This repository is implemented through Phase 4 of the supplied hackathon plan. It includes a London-wide runner map, persistent run/earn loop, buyer coverage-request map, shared bounties, sampled visual/voice evidence fusion, and a submitted-run operations map with flat and perspective views.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and `http://localhost:3000/build-status.html`.

## Data and AI boundaries

- Continuous raw video and ambient audio are never uploaded.
- Three privacy-processed camera frames are sampled over about one second every six seconds; Luna turns the burst into one temporal report. Raw frames are not retained by the demo ledger.
- Face/plate detection and anonymization are explicit privacy gates before buyer-facing evidence.
- OpenAI inference uses `gpt-5.6-luna` with medium reasoning through a server route when `OPENAI_API_KEY` is configured.
- ElevenLabs Realtime Scribe token issuance is supported when `ELEVENLABS_API_KEY` is configured; browser speech or typed notes remain the zero-config demo path.
- Local development writes to `.data/phase2.sqlite` and refreshes the committed `.data/phase2.json` demo snapshot. Vercel can seed from that snapshot, but its runtime writes are ephemeral; use the documented optional database schema for durable deployed collection.
- The signed-in ChatGPT/Codex session is not copied into the app. OpenAI application APIs require server-side API credentials.

See [docs/DATA_COLLECTION.md](docs/DATA_COLLECTION.md), [docs/PRIVACY.md](docs/PRIVACY.md), and [docs/BUILD_LOG.md](docs/BUILD_LOG.md).
