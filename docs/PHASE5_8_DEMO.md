# Phases 5–8 demo guide

These phases are intentionally demo-focused. Stored EyeEarn runs are real local demo records; city-scale external evidence is a small hardcoded fixture and is always labelled as derived demo data.

## Phase 5 — Authority Operations

Open `/operations`. Use **Live** for the incoming evidence ribbon or **Atlas** for status, severity, modality, source and time filtering. Select a signal in the map or ribbon, then switch between street/satellite and 2D/3D.

## Phase 6 — Buyer Intelligence

Open `/intelligence` and choose one of the three supported questions. Answers cite their evidence and disclose confidence, coverage and method. The Greenwich gap answer can create the proposed £8.20 mission in the shared bounty ledger.

## Phase 7 — Replay

Open `/replay`, select a stored run, then use play, scrub and speed controls. Route progress, observations, accepted coverage and payout appear from stored metrics; the narration does not invent events.

## Phase 8 — Public evidence surface

Open `/developers` or request:

```text
GET /api/public/v1/evidence?source=all
GET /api/public/v1/evidence?source=eyeearn
GET /api/public/v1/evidence?source=external
```

Responses are GeoJSON. They expose place/time/category/provenance/privacy state only. Raw frames, audio, device identity and direct identifiers stay private.

## Five-minute demo order

1. Fund the Greenwich gap in Intelligence.
2. Show the new £8.20 bounty in Explore.
3. Open Operations Atlas, filter a review state and tilt the satellite view.
4. Replay the accepted £7 run to its covered end state.
5. Finish on Developers and open the live privacy-safe response.
