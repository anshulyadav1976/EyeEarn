# Phase 1 data collection contract

EyeEarn collects only what is useful for coverage and evidence quality. Every field records its source and availability; unavailable browser APIs degrade cleanly.

| Group | Collected fields |
|---|---|
| Position | latitude, longitude, reported accuracy, altitude/altitude accuracy, heading, speed, recorded time |
| Device | user agent, browser platform, viewport, pixel ratio, language, timezone, touch points, memory/CPU hints where exposed, network type/effective type/downlink/RTT/save-data |
| Motion | acceleration, acceleration including gravity, rotation rate, device orientation and screen orientation when permission/API is available |
| Camera frame | dimensions, capture time, MIME type, compressed byte size, simple brightness/change quality signals, analysis status |
| Multimodal result | normalized category, factual description, severity, confidence, actionable flag, visible objects, scene conditions, privacy risk, face/plate flags |
| Sound | microphone permission/status and a short-lived level meter (RMS/peak); no continuous ambient recording |
| Run context | run ID, selected zone, itinerary, target value, elapsed time, route-point count, granted/denied sensor states |

The browser keeps the Phase 1 run snapshot locally so a refresh restores the selected itinerary. Server persistence arrives with the Phase 2 data backbone.
