# EyeEarn build log

## Phase 0 — shared walking skeleton

- Created a fresh Next.js TypeScript application after the user started the build.
- Preserved the scaffold's first commit.
- Created the private `anshulyadav1976/EyeEarn` GitHub repository and pushed `main`.
- Added the EyeEarn visual system, three role surfaces, seeded-state labels, a health endpoint, and persistent build-status dashboard.

## Phase 1 — automated verification passed; actual-phone check ready

- Added three selectable payout bands plus a visibly locked restricted/private zone.
- Added a prepared MapLibre route with a deterministic overlay fallback for unavailable tiles/WebGL.
- Added duration, distance, optional earnings target and runner/device-owner label controls.
- Persisted the chosen itinerary through refresh and fixed an initial hydration overwrite found by browser testing.
- Added one-click camera, microphone and geolocation preflight with camera-only, voice-only/GPS and GPS-only degradation states.
- Collected GPS accuracy/altitude/heading/speed, motion/orientation, short-lived sound level, device/browser/network metadata and an anonymous device-session ID.
- Added sampled JPEG frames, dark/near-identical-frame rejection, one-request-at-a-time analysis and native face redaction where supported.
- Added a validated server-only `gpt-5.6-luna` medium-reasoning multimodal endpoint with a usable local fallback.
- Explicitly blocked privacy-risk output from buyer use unless required redaction has passed.

Verification passed: Node itinerary test, ESLint, production build, real Luna-medium analysis of a test frame, desktop/mobile Playwright flow, refresh persistence, restricted-zone exclusion, sensor denial degradation, GPS update, responsive overflow, console and Cloudflare checks. Manual confirmation on the actual phone is the remaining human gate.

## Phase 2 — real collection and earnings loop

- Added a persisted demo run ledger and optional RLS-enabled Supabase/Postgres schema.
- Wired runner start, batched GPS writes, accuracy preservation, impossible-jump rejection, visual/manual/voice observations, acceptance-only simulated earnings, and finish/handoff.
- Added a clearly labelled manual evidence path so camera, microphone, model, or GPS degradation cannot block the demo.

## Phase 3 — Buyer Location Dossier

- Added a coverage/freshness map, search, selectable dossiers, time range, modalities, sample cards, privacy/provenance labels, supported questions, gaps and indicative pricing.
- Added simulated report purchase and fresh-coverage funding.
- Buyer funding creates/increases the same safe Explorer bounty, which refreshes without a second map implementation and becomes the accepted runner payout.

## Phase 4 — rich evidence fusion

- Preserved one compressed frame every three seconds, one analysis in flight and manual fallback.
- Added short hold-to-speak/browser and typed observations, optional ElevenLabs Realtime Scribe token issuance, timestamp/runner/GPS attachment and visual/voice fusion.
- Scrubbed contact-shaped text, persisted only short structured notes, never continuous audio, and exposed derived/anonymized buyer status first.
- Faces are blurred with the native detector where available; Luna flags faces/plates and risky evidence is held when redaction cannot be confirmed.

## Phase 2–4 demo refinement — London map-first workflow

- Replaced diagram-like maps with London-wide Carto street tiles and an Esri satellite toggle.
- Simplified Explore to the bounty map, compact brief, camera preview and sticky live-run dock with elapsed time, distance, pace, earnings, observation, details and finish controls.
- Expanded safe bounties across London and made buyer-created public points persist as real shared runner bounties.
- Rebuilt Buyer around a clickable London coverage map, lightweight dossier and one short request form.
- Added the Operations submissions page with route/evidence review and flat/perspective map modes.
- Added local SQLite plus a portable JSON snapshot, export endpoint and explicit Vercel persistence boundaries.
- Upgraded multimodal inference to three privacy-processed frames over about one second, one Luna-medium temporal report every six seconds, and a safe local fallback.

Verification passed: live three-frame Luna-medium request, local SQLite and JSON writes, buyer-to-runner bounty sharing, GPS/manual-evidence run and handoff, Operations 2D/3D review, desktop/mobile visual review, responsive overflow, lint, TypeScript, tests and production build. The combined actual-phone permission/walking flow remains the final human test gate.
