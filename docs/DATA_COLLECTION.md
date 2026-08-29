# Phase 1–4 data collection contract

EyeEarn collects only what is useful for coverage and evidence quality. Every field records its source and availability; unavailable browser APIs degrade cleanly.

| Group             | Collected fields                                                                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Position          | latitude, longitude, reported accuracy, altitude/altitude accuracy, heading, speed, recorded time                                                                                                                          |
| Device            | user agent, browser platform, viewport, pixel ratio, language, timezone, touch points, memory/CPU hints where exposed, network type/effective type/downlink/RTT/save-data                                                  |
| Motion            | acceleration, acceleration including gravity, rotation rate, device orientation and screen orientation when permission/API is available                                                                                    |
| Camera frame      | three JPEG samples over about one second, dimensions, capture time, compressed byte size, brightness/change quality signals and redaction state; no raw-frame retention in the run ledger                                  |
| Multimodal result | one Luna-medium temporal report per burst (about every six seconds): normalized category, factual description, severity, confidence, actionable flag, visible objects, scene conditions, privacy risk and face/plate flags |
| Sound             | microphone permission/status and a short-lived level meter (RMS/peak); no continuous ambient recording                                                                                                                     |
| Voice observation | short transcript or typed note, scrubbed text, timestamp, runner label, usable GPS point, voice/fused state; no continuous ambient recording                                                                               |
| Run context       | persisted run ID/status, selected zones, itinerary, target value, batched route points, accepted completions, simulated earnings, granted/denied sensor states                                                             |
| Buyer request     | public London coordinates, short evidence brief, safety confirmation, simulated GBP funding amount, updated/shared bounty and demo receipt; no real payment                                                                |

The browser keeps itinerary and short voice state locally. Local server state is persisted in `.data/phase2.sqlite`; every write also refreshes the portable `.data/phase2.json` snapshot. The committed snapshot carries test/demo data into a Vercel build, while later Vercel writes remain instance-local and ephemeral. `docs/phase2-schema.sql` supplies the optional Supabase/Postgres shape for durable authenticated production persistence.
