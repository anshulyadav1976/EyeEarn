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

## Demo UX signoff

- Reduced Explore to a map-first bounty choice with green rounded price markers, a visible checkpoint itinerary, and only distance, time and payout above the main action.
- Made an active survey a true split view: live route and pace above, camera below, microphone enabled by default, plus pause/resume and finish controls.
- Fixed the Buyer map recreation bug that made selections disappear, kept map-mode changes stable, and made new/funded locations appear immediately.
- Reworked Operations into a high-resolution authority view with a selected trail, numbered evidence, start/finish points, recent-run selection, and 2D/3D plus street/aerial modes.
- Changed the normal basemap to high-resolution CARTO Voyager tiles after visual testing exposed throttled placeholder tiles from the prior provider.
- Prevented a no-evidence quick finish from making an avoidable rejected-completion request; the run still hands off cleanly with £0 accepted earnings.

Verification passed again: full desktop runner interaction, fake camera/microphone/geolocation flow, Buyer selection persistence, map-mode switching, mobile overflow checks, unit tests, ESLint, TypeScript and production build.

## Phase 5 — authority command view

- Rebuilt Operations as a live evidence ribbon plus a filterable London atlas.
- Added all five review states, severity/modality/source/time filters, selected-signal details, mapped run trails, counters, and synchronized map/feed selection.
- Added crisp street/satellite basemaps and 2D/3D perspectives suitable for the demo's city-level “god view.”

## Phase 6 — cited buyer intelligence

- Added a controlled intelligence workspace for accessibility, week-on-week comparison and evidence-gap questions.
- Every answer exposes cited evidence, confidence, coverage and method instead of inventing missing facts.
- An evidence gap proposes a priced Greenwich mission and funds the real shared runner bounty in one click.

## Phase 7 — evidence replay

- Added replay of stored completed runs with a progressive route, runner position, evidence reveals and bounty state.
- Added play/pause/restart, scrubbing, 0.5×/1×/2× speeds, factual narration, distance, accepted zones and earned payout.
- The default demo selection prioritizes a meaningful accepted run and has a safe empty-state fallback.

## Phase 8 — bounded public evidence

- Added a versioned public GeoJSON endpoint with `all`, `eyeearn` and `external` source filters.
- Excluded raw camera/audio, direct identity and blocked observations from the public surface.
- Added three clearly labelled derived-only TfL-shaped demo fixtures and a developer-facing evidence passport page.

Verification passed: owner-driven desktop interaction across Phases 5–8, Authority filtering and map-mode switching, intelligence gap funding, replay playback/scrubbing/end state, public API assertions, responsive checks at phone width, no local HTTP/console failures, unit tests, ESLint, TypeScript and production build.

## Landing-page reference refinement

- Adapted the supplied Claude export's strongest visual cues: a light London survey grid, oversized pink movement headline, condensed utility typography and a restrained animated edge signal.
- Preserved six direct demo destinations and added clear Earn/Buy calls to action instead of copying the export's heavier runtime and canvas implementation.
- Corrected the Git commit identity to the GitHub account's verified noreply address so connected Vercel deployments can resolve the author.

Verification passed: desktop and 390 px browser review, six-card navigation, Explore handoff, responsive overflow, console/network checks, ESLint, TypeScript and production build.

## Final demo navigation and visibility pass

- Reduced the landing page to Explore, Buyer and Public Evidence, and moved Ask the Street, Authority Atlas and Run Replay into a shared Buyer tool strip.
- Aligned the main application surfaces to the light EyeEarn shell and one pink accent.
- Replaced Intelligence’s fixed-choice layout with a freeform evidence-grounded Luna chat while preserving three deterministic demo prompts.
- Added the hardcoded “Anshul Walk · Stratford” replay with a high-contrast route, evidence timeline, accepted zones and payout.
- Kept four authority tracks and the complete signal layer visible while Atlas feed filters change or a signal is selected.
- Removed Explore’s numbered route markers; bounty selection now presents a closed loop, target pace, finish estimate, capture plan and clearly labelled example field-video links.
- Implemented the full-viewport eight-second burning-wick canvas with a reduced-motion fallback.

Verification passed: browser interaction and visual inspection of Home, Explore, Buyer, Intelligence, Authority Atlas and Replay; fresh console checks after MapLibre lifecycle fixes; ESLint, TypeScript, six unit tests and production build.

## Motion, typography and coverage-builder refinement

- Added the supplied six-word neon glitch/slot-flap hero treatment with animation cancellation between cycles and a reduced-motion static state.
- Adopted Saira Condensed for display type and Roboto for small copy, controls and navigation.
- Completed the Buyer request path: select building/circle/rectangle, click the map, name the location, size the area, describe the evidence, choose bounty and demo payment source, then publish.
- Aligned the Buyer primary navigation on one baseline and applied the landing survey-grid background to Buyer and Public Evidence.
- Removed the temporary map-synchronized SVG circuit overlay; native route data and itinerary guidance remain available without the extra presentation layer.

Verification passed: desktop and 390 px Playwright runs, rotating headline RUN→DRIVE, aligned Buyer header, complete unsent payment form, no horizontal overflow or console errors, ESLint, TypeScript, six unit tests and production build.
