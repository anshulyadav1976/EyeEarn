import assert from "node:assert/strict";
import test from "node:test";
import { externalEvidence } from "../src/lib/external-evidence.ts";

test("external demo evidence is derived, identifiable and geographically valid", () => {
  assert.ok(externalEvidence.length >= 3);
  for (const item of externalEvidence) {
    assert.match(item.id, /^EXT-TFL-/);
    assert.equal(item.category, "traffic-flow");
    assert.ok(item.latitude > 51.2 && item.latitude < 51.8);
    assert.ok(item.longitude > -0.6 && item.longitude < 0.4);
  }
});
