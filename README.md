# EyeEarn

EyeEarn pays explorers to fill valuable real-world evidence gaps, then turns privacy-processed observations into cited place intelligence.

## Current scope

This repository is implemented through Phase 4 of the supplied hackathon plan. It includes the role-aware shell, persistent demo run/earn loop, Buyer Data Map and Location Dossier, buyer-funded bounty feedback, and sampled visual/voice evidence fusion.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and `http://localhost:3000/build-status.html`.

## Data and AI boundaries

- Continuous raw video and ambient audio are never uploaded.
- Camera frames are sampled and compressed; useful structured observations are retained.
- Face/plate detection and anonymization are explicit privacy gates before buyer-facing evidence.
- OpenAI inference uses `gpt-5.6-luna` with medium reasoning through a server route when `OPENAI_API_KEY` is configured.
- ElevenLabs Realtime Scribe token issuance is supported when `ELEVENLABS_API_KEY` is configured; browser speech or typed notes remain the zero-config demo path.
- The zero-setup run ledger uses ignored local persistence and a serverless memory fallback. An RLS-enabled optional Supabase schema is documented for production.
- The signed-in ChatGPT/Codex session is not copied into the app. OpenAI application APIs require server-side API credentials.

See [docs/DATA_COLLECTION.md](docs/DATA_COLLECTION.md), [docs/PRIVACY.md](docs/PRIVACY.md), and [docs/BUILD_LOG.md](docs/BUILD_LOG.md).
