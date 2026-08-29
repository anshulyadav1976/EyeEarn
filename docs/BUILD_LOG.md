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
