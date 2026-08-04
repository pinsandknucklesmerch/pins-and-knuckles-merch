import assert from "node:assert/strict";
import test from "node:test";
import { gaugeZoneRatios } from "../lib/gaugeZones.ts";

test("uses five target-driven boundaries for target 250 and max 280", () => {
  assert.deepEqual(gaugeZoneRatios(250, 280), {
    neutralEnd: 62.5 / 280,
    redEnd: 125 / 280,
    orangeEnd: 187.5 / 280,
    amberEnd: 250 / 280,
    greenStart: 250 / 280,
  });
});

test("calculates target-driven boundaries for target 150 and max 168", () => {
  assert.deepEqual(gaugeZoneRatios(150, 168), {
    neutralEnd: 37.5 / 168,
    redEnd: 75 / 168,
    orangeEnd: 112.5 / 168,
    amberEnd: 150 / 168,
    greenStart: 150 / 168,
  });
});

test("calculates target-driven boundaries for target 60 and max 67", () => {
  assert.deepEqual(gaugeZoneRatios(60, 67), {
    neutralEnd: 15 / 67,
    redEnd: 30 / 67,
    orangeEnd: 45 / 67,
    amberEnd: 60 / 67,
    greenStart: 60 / 67,
  });
});

test("starts green at the final edge when target equals max", () => {
  assert.deepEqual(gaugeZoneRatios(375, 375), {
    neutralEnd: 0.25,
    redEnd: 0.5,
    orangeEnd: 0.75,
    amberEnd: 1,
    greenStart: 1,
  });
});

test("clamps boundaries when target exceeds max", () => {
  assert.deepEqual(gaugeZoneRatios(500, 375), {
    neutralEnd: 125 / 375,
    redEnd: 250 / 375,
    orangeEnd: 1,
    amberEnd: 1,
    greenStart: 1,
  });
});

test("keeps a zero target at the gauge start without invalid ratios", () => {
  assert.deepEqual(gaugeZoneRatios(0, 375), {
    neutralEnd: 0,
    redEnd: 0,
    orangeEnd: 0,
    amberEnd: 0,
    greenStart: 0,
  });
});

test("falls back to safe zero ratios for invalid target or max values", () => {
  assert.deepEqual(gaugeZoneRatios(Number.NaN, 375), {
    neutralEnd: 0,
    redEnd: 0,
    orangeEnd: 0,
    amberEnd: 0,
    greenStart: 0,
  });
  assert.deepEqual(gaugeZoneRatios(250, 0), {
    neutralEnd: 0,
    redEnd: 0,
    orangeEnd: 0,
    amberEnd: 0,
    greenStart: 0,
  });
});
