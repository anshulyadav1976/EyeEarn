# EyeEarn

EyeEarn pays explorers to fill valuable real-world evidence gaps, then turns privacy-processed observations into cited place intelligence.

## Current scope

This repository is being built through Phase 1 of the supplied hackathon plan. It includes the role-aware shell, build-status dashboard, seeded zones and observations, and the Explorer Run & Earn vertical slice.

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
- The signed-in ChatGPT/Codex session is not copied into the app. OpenAI application APIs require server-side API credentials.

See [docs/DATA_COLLECTION.md](docs/DATA_COLLECTION.md), [docs/PRIVACY.md](docs/PRIVACY.md), and [docs/BUILD_LOG.md](docs/BUILD_LOG.md).
