import assert from "node:assert/strict";
import test from "node:test";
import { comparisonArcFillPercent, comparisonArcRatio, MONTHLY_PROFIT_TARGET, metricComparison, previousYearComparisonState, profitProgress, shirtFillPercent, targetBullet, targetState } from "../lib/metricDisplay.ts";
import type { MetricResult } from "../domain/types.ts";
import { comparisonBadgeDetails } from "../lib/comparisonBadge.ts";

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

test("target state stays red below target and green at or above target", () => {
  assert.equal(targetState(154999.99, MONTHLY_PROFIT_TARGET), "below-target");
  assert.equal(targetState(MONTHLY_PROFIT_TARGET, MONTHLY_PROFIT_TARGET), "target-met");
  assert.equal(targetState(200000, MONTHLY_PROFIT_TARGET), "target-met");
  assert.equal(targetState(null, MONTHLY_PROFIT_TARGET), "below-target");
  assert.equal(targetState(200000, null), "no-target");
  assert.equal(targetState(200000, 0), "no-target");
  assert.equal(targetState(200000, Number.NaN), "no-target");
});

test("Orders previous-year comparison state is positive, negative, neutral, or unavailable", () => {
  assert.equal(previousYearComparisonState(90, 100), "negative");
  assert.equal(previousYearComparisonState(110, 100), "positive");
  assert.equal(previousYearComparisonState(100, 100), "neutral");
  assert.equal(previousYearComparisonState(100, null), "unavailable");
});

test("formats compact comparison badges with direction, absolute magnitudes, and accessible labels", () => {
  assert.deepEqual(comparisonBadgeDetails({ absoluteChange: -95, percentageChange: -32, state: "negative" }), { icon: "↓", values: ["95", "32.0%"], accessibleLabel: "Down 95, 32.0 percent versus last year" });
  assert.deepEqual(comparisonBadgeDetails({ absoluteChange: 23, percentageChange: 34.3, state: "positive" }), { icon: "↑", values: ["23", "34.3%"], accessibleLabel: "Up 23, 34.3 percent versus last year" });
  assert.deepEqual(comparisonBadgeDetails({ absoluteChange: 0, percentageChange: 0, state: "neutral" }), { icon: "−", values: ["0", "0.0%"], accessibleLabel: "No change 0, 0.0 percent versus last year" });
  assert.equal(comparisonBadgeDetails({ absoluteChange: null, percentageChange: null, state: "unavailable" }), null);
});

test("uses percentage points and keeps zero-denominator comparisons relative-free", () => {
  assert.deepEqual(comparisonBadgeDetails({ percentagePointChange: -9.3, percentageChange: -27.1, state: "negative" }), { icon: "↓", values: ["9.3 pts", "27.1%"], accessibleLabel: "Down 9.3 percentage points, 27.1 percent versus last year" });
  assert.deepEqual(comparisonBadgeDetails({ percentagePointChange: 56.9, percentageChange: null, state: "positive" }), { icon: "↑", values: ["56.9 pts"], accessibleLabel: "Up 56.9 percentage points versus last year" });
});

test("target bullet maps actuals, targets, and below/at/above colours", () => {
  assert.deepEqual(targetBullet(150, 300), { value: 150, target: 300, max: 336, measureColor: "#d9474b" });
  assert.equal(targetBullet(300, 300)?.measureColor, "#6fc49a");
  assert.equal(targetBullet(350, 300)?.measureColor, "#6fc49a");
  assert.equal(targetBullet(150, null), null);
  assert.equal(targetBullet(null, 300), null);
});
