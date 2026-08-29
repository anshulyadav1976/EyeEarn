# Phase 1–4 data collection contract

EyeEarn collects only what is useful for coverage and evidence quality. Every field records its source and availability; unavailable browser APIs degrade cleanly.

| Group | Collected fields |
|---|---|
| Position | latitude, longitude, reported accuracy, altitude/altitude accuracy, heading, speed, recorded time |
| Device | user agent, browser platform, viewport, pixel ratio, language, timezone, touch points, memory/CPU hints where exposed, network type/effective type/downlink/RTT/save-data |
| Motion | acceleration, acceleration including gravity, rotation rate, device orientation and screen orientation when permission/API is available |
| Camera frame | dimensions, capture time, MIME type, compressed byte size, simple brightness/change quality signals, analysis status |
| Multimodal result | normalized category, factual description, severity, confidence, actionable flag, visible objects, scene conditions, privacy risk, face/plate flags |
| Sound | microphone permission/status and a short-lived level meter (RMS/peak); no continuous ambient recording |
| Voice observation | short transcript or typed note, scrubbed text, timestamp, runner label, usable GPS point, voice/fused state; no continuous ambient recording |
| Run context | persisted run ID/status, selected zones, itinerary, target value, batched route points, accepted completions, simulated earnings, granted/denied sensor states |
| Buyer request | safe zone, simulated GBP funding amount, updated bounty value and demo receipt; no real payment |

The browser keeps itinerary and short voice state locally. The Phase 2 server ledger persists demo runs to an ignored local file, with an in-memory serverless fallback. `docs/phase2-schema.sql` supplies the optional Supabase/Postgres shape for authenticated production persistence.
