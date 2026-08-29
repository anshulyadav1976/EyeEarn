# EyeEarn

EyeEarn pays explorers to fill valuable real-world evidence gaps, then turns privacy-processed observations into cited place intelligence.

## Current scope

This repository is implemented through Phase 8 of the supplied hackathon plan. It includes a London-wide runner map, persistent run/earn loop, buyer coverage requests, shared bounties, sampled visual/voice evidence fusion, authority operations, cited buyer intelligence, recorded-run replay, and a privacy-safe public evidence API.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and `http://localhost:3000/build-status.html`.

The landing page exposes three clear entry points: Explore, Buyer and Public Evidence. Buyer then groups the specialist demo tools as subtabs.

Main demo routes:

- `/explore` — choose a bounty, run and film.
- `/buyer` — inspect or fund London coverage.
- `/operations` — Buyer → Authority Atlas, with seeded London signals and routes.
- `/intelligence` — grounded questions with evidence citations and gap-to-bounty funding.
- `/replay` — Buyer → Run Replay, defaulting to “Anshul Walk · Stratford”.
- `/developers` — inspect the public GeoJSON surface and labelled external fixtures.

## Data and AI boundaries

- Continuous raw video and ambient audio are never uploaded.
- Three privacy-processed camera frames are sampled over about one second every six seconds; Luna turns the burst into one temporal report. Raw frames are not retained by the demo ledger.
- Face/plate detection and anonymization are explicit privacy gates before buyer-facing evidence.
- OpenAI inference uses `gpt-5.6-luna` with medium reasoning through a server route when `OPENAI_API_KEY` is configured.
- ElevenLabs Realtime Scribe token issuance is supported when `ELEVENLABS_API_KEY` is configured; browser speech or typed notes remain the zero-config demo path.
- Local development writes to `.data/phase2.sqlite` and refreshes the committed `.data/phase2.json` demo snapshot. Vercel can seed from that snapshot, but its runtime writes are ephemeral; use the documented optional database schema for durable deployed collection.
- The signed-in ChatGPT/Codex session is not copied into the app. OpenAI application APIs require server-side API credentials.

See [docs/PHASE5_8_DEMO.md](docs/PHASE5_8_DEMO.md), [docs/DATA_COLLECTION.md](docs/DATA_COLLECTION.md), [docs/PRIVACY.md](docs/PRIVACY.md), and [docs/BUILD_LOG.md](docs/BUILD_LOG.md).

## Demo UI notes

- All product chrome uses the landing page’s light survey-grid language and `#ff1f6b` accent.
- The landing thesis rotates RUN / DRIVE / WALK / FLY / RIDE / SAIL with a clipped neon glitch-and-flap transition; reduced-motion users see the static RUN state.
- Saira Condensed carries display headlines while Roboto is the application reading and control face.
- Explore removes numbered route pins and shows a closed circuit, target pace, estimated finish and capture brief before the camera starts.
- Buyer coverage requests support a building point, circular area or rectangular area selected on the map, followed by name, requirement, bounty and demo payment method.
- Example field-footage links are clearly labelled as references rather than submitted EyeEarn evidence. The linked Pexels and Mixkit collections describe their clips as free-use stock video; review the source licence before repackaging assets.
- The home-page burning-wick canvas respects reduced-motion preferences.
