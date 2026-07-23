import assert from "node:assert/strict";
import test from "node:test";
import { comparisonArcFillPercent, comparisonArcRatio, MONTHLY_PROFIT_TARGET, metricComparison, profitProgress, shirtFillPercent } from "../lib/metricDisplay.ts";
import type { MetricResult } from "../domain/types.ts";

const metric: MetricResult = {
  code: "MONTHLY_PROFIT", label: "Monthly Profit", value: 91571.84, previousYear: 70000, difference: 21571.84, percentageChange: 30.8,
  target: MONTHLY_PROFIT_TARGET, targetProgress: 59.1, targetReached: false, format: "currency",
};

test("calculates a clamped shirt fill while retaining above-target progress", () => {
  assert.equal(profitProgress(91571.84, MONTHLY_PROFIT_TARGET), 91571.84 / MONTHLY_PROFIT_TARGET);
  assert.equal(shirtFillPercent(91571.84, MONTHLY_PROFIT_TARGET), 59.078606451612906);
  assert.equal(shirtFillPercent(200000, MONTHLY_PROFIT_TARGET), 100);
  assert.equal(profitProgress(200000, MONTHLY_PROFIT_TARGET), 200000 / MONTHLY_PROFIT_TARGET);
  assert.equal(shirtFillPercent(null, MONTHLY_PROFIT_TARGET), 0);
  assert.deepEqual(metricComparison(metric), { value: 70000, label: "Last year", mode: "both" });
});

test("calculates a safe comparison arc for below, equal, and above previous-year values", () => {
  assert.equal(comparisonArcRatio(50, 100), 0.5);
  assert.equal(comparisonArcFillPercent(50, 100), 50);
  assert.equal(comparisonArcRatio(100, 100), 1);
  assert.equal(comparisonArcFillPercent(100, 100), 100);
  assert.equal(comparisonArcRatio(125, 100), 1.25);
  assert.equal(comparisonArcFillPercent(125, 100), 100);
});

test("suppresses comparison-arc fill for zero, null, and missing current values", () => {
  assert.equal(comparisonArcRatio(20, 0), null);
  assert.equal(comparisonArcRatio(20, null), null);
  assert.equal(comparisonArcRatio(null, 20), null);
  assert.equal(comparisonArcFillPercent(20, 0), 0);
  assert.equal(comparisonArcFillPercent(20, null), 0);
  assert.equal(comparisonArcFillPercent(null, 20), 0);
});
