import test from "node:test";
import assert from "node:assert/strict";
import { buildItinerary } from "../src/lib/itinerary.ts";
import { zones } from "../src/lib/eyeearn-data.ts";

test("itinerary keeps the chosen safe zone and excludes restricted areas", () => {
  const result = buildItinerary(zones, "zone-south-access", 30, 2.5);
  assert.equal(result.zoneIds[0], "zone-south-access");
  assert.equal(result.zoneIds.includes("zone-service-yard"), false);
  assert.ok(result.estimatedRewardMinor > 0);
  assert.ok(result.estimatedDistanceKm <= 2.5);
});
