import test from "node:test";
import assert from "node:assert/strict";
import { answerIntelligence, isQuestion } from "../src/lib/intelligence.ts";

test("intelligence only accepts fixed safe questions and turns a gap into a mission", () => {
  assert.equal(isQuestion("DROP TABLE runs"), false);
  const gap = answerIntelligence("gap");
  assert.equal(gap.state, "gap");
  assert.ok(gap.mission?.reward);
  assert.ok(gap.citations.every((item) => item.id.startsWith("OBS-")));
});
