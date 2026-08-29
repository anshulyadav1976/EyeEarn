import test from "node:test";
import assert from "node:assert/strict";
import { appendRoutePoints, completeZone, createRun, finishRun, handoffRun } from "../src/lib/phase2-backbone.ts";
import { zones } from "../src/lib/eyeearn-data.ts";

test("route batches reject GPS jumps and accepted completions pay", () => {
  const run = createRun("Demo runner", ["zone-south-access"], "2026-01-01T00:00:00.000Z");
  const result = appendRoutePoints(run, [{ latitude: 51.5384, longitude: -0.0196, recordedAt: "2026-01-01T00:00:00.000Z" }, { latitude: 52, longitude: 0, recordedAt: "2026-01-01T00:00:01.000Z" }]);
  assert.equal(result.accepted.length, 1); assert.equal(result.rejected, 1);
  completeZone(run, zones[0], true, "2026-01-01T00:01:00.000Z"); assert.equal(run.earnedMinor, zones[0].rewardMinor);
  finishRun(run); handoffRun(run); assert.equal(run.status, "handed-off");
});
