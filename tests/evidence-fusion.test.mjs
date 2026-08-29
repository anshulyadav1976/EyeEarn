import test from "node:test";
import assert from "node:assert/strict";
import { fuseVoiceWithVisual, makeVoiceObservation, sanitizeVoiceText } from "../src/lib/evidence-fusion.ts";

test("voice notes remove direct contact details and remain short", () => {
  const note = makeVoiceObservation("Blocked ramp, call me at 07123 456789", "Runner 01", null);
  assert.ok(note);
  assert.match(note.text, /\[number removed\]/);
  assert.equal(note.modality, "voice");
  assert.ok(note.text.length <= 280);
});

test("nearby compatible visual evidence is fused, otherwise voice remains standalone", () => {
  const voice = makeVoiceObservation("Blocked ramp at the south access", "Runner 01", { latitude: 51.5, longitude: -0.01 });
  assert.ok(voice);
  const frame = { id: "OBS-FRAME", category: "access ramp", capturedAt: voice.capturedAt, metadata: { position: voice.position }, privacyState: "safe" };
  assert.equal(fuseVoiceWithVisual(voice, [frame]).modality, "fused");
  assert.equal(fuseVoiceWithVisual(voice, []).modality, "voice");
  assert.equal(sanitizeVoiceText(""), "");
});
