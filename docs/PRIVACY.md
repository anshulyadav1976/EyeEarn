# Privacy and evidence integrity

- Do not identify, profile, or infer protected traits about people.
- Do not upload or store continuous raw video or ambient audio.
- Sample a three-frame compressed burst only while a run is active, create one structured temporal report, and do not persist raw frames in the demo ledger.
- Mark every observation with provenance, time, location accuracy, and privacy state.
- Detect/flag faces and number plates during analysis. Buyer-facing media must pass anonymization/redaction before delivery.
- Phase 4 applies native face blurring to every sampled frame where supported, uses AI face/plate flags everywhere, and holds risky output from buyers when redaction cannot be confirmed. Broader cross-browser anonymization remains a later hardening item.
- Buyer dossiers expose anonymized/derived findings first; raw media is not part of the demo purchase flow.
- Keep originals restricted and discard source media when there is no explicit permitted retention purpose.
- A blurred image is privacy-processed, not necessarily anonymous; product copy must preserve that distinction.
