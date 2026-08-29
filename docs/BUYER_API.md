# Buyer funding contract

The buyer dossier calls `POST /api/fund` with `{ locationId, amountMinor, currency }` and expects a 2xx response. A live implementation can create a payment/funding intent and return a receipt. If the route is unavailable (the hackathon default), the UI records a clearly labelled local demo funding state and remains usable.

Evidence shown in the dossier is seeded/demo data until a persisted collection service is connected. Privacy states, freshness, source labels, and evidence gaps are intentionally visible to buyers.
