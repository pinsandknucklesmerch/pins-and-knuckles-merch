import assert from "node:assert/strict";
import test from "node:test";
import { gaugeZoneRatios } from "../lib/gaugeZones.ts";

test("uses target-driven red, amber, and green boundaries", () => {
  assert.deepEqual(gaugeZoneRatios(250, 375), {
    redEnd: 200 / 375,
    amberEnd: 250 / 375,
    greenStart: 250 / 375,
  });
});

test("starts green at the final edge when target equals max", () => {
  assert.deepEqual(gaugeZoneRatios(375, 375), {
    redEnd: 0.8,
    amberEnd: 1,
    greenStart: 1,
  });
});

test("clamps boundaries when target exceeds max", () => {
  assert.deepEqual(gaugeZoneRatios(500, 375), {
    redEnd: 1,
    amberEnd: 1,
    greenStart: 1,
  });
});

test("keeps a zero target at the gauge start without invalid ratios", () => {
  assert.deepEqual(gaugeZoneRatios(0, 375), {
    redEnd: 0,
    amberEnd: 0,
    greenStart: 0,
  });
});
