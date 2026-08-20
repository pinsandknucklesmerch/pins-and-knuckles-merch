import assert from "node:assert/strict";
import test from "node:test";
import { gaugeZoneRatios } from "../lib/gaugeZones.ts";

test("aligns a target of 250 with the green boundary on its 375 max scale", () => {
  assert.deepEqual(gaugeZoneRatios(250, 375), {
    redEnd: 1 / 3,
    orangeEnd: 2 / 3,
    greenStart: 2 / 3,
    targetRatio: 2 / 3,
  });
});

test("aligns a target of 150 with the green boundary on its 225 max scale", () => {
  assert.deepEqual(gaugeZoneRatios(150, 225), {
    redEnd: 1 / 3,
    orangeEnd: 2 / 3,
    greenStart: 2 / 3,
    targetRatio: 2 / 3,
  });
});

test("aligns a percentage target with the green boundary on its 150% max scale", () => {
  assert.deepEqual(gaugeZoneRatios(60, 90), {
    redEnd: 1 / 3,
    orangeEnd: 2 / 3,
    greenStart: 2 / 3,
    targetRatio: 2 / 3,
  });
});

test("keeps the target marker at the final edge when target equals max", () => {
  assert.deepEqual(gaugeZoneRatios(375, 375), {
    redEnd: 1 / 3,
    orangeEnd: 2 / 3,
    greenStart: 2 / 3,
    targetRatio: 1,
  });
});

test("clamps only the target marker when target exceeds max", () => {
  assert.deepEqual(gaugeZoneRatios(500, 375), {
    redEnd: 1 / 3,
    orangeEnd: 2 / 3,
    greenStart: 2 / 3,
    targetRatio: 1,
  });
});

test("keeps a zero target marker at the gauge start", () => {
  assert.deepEqual(gaugeZoneRatios(0, 375), {
    redEnd: 1 / 3,
    orangeEnd: 2 / 3,
    greenStart: 2 / 3,
    targetRatio: 0,
  });
});

test("keeps visual bands stable with invalid target or max values", () => {
  assert.deepEqual(gaugeZoneRatios(Number.NaN, 375), {
    redEnd: 1 / 3,
    orangeEnd: 2 / 3,
    greenStart: 2 / 3,
    targetRatio: 0,
  });
  assert.deepEqual(gaugeZoneRatios(250, 0), {
    redEnd: 1 / 3,
    orangeEnd: 2 / 3,
    greenStart: 2 / 3,
    targetRatio: 0,
  });
});
