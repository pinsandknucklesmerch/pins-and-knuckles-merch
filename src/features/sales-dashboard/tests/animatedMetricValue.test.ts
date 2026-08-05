import assert from "node:assert/strict";
import test from "node:test";
import { formatAnimatedMetricValue, getAccessibleMetricText, normalizeFractionDigits, shouldAnimateMetricValue } from "../lib/animatedMetricValue.ts";

test("animated metric formatting preserves currency, zero, percentages, and negatives", () => {
  assert.equal(formatAnimatedMetricValue(12.5, "currency"), "£12.50");
  assert.equal(formatAnimatedMetricValue(-12.5, "currency", 2), "-£12.50");
  assert.equal(formatAnimatedMetricValue(0, "currency"), "£0.00");
  assert.equal(formatAnimatedMetricValue(0, "number"), "0");
  assert.equal(formatAnimatedMetricValue(12.345, "percent"), "12.3%");
});

test("null metrics remain an accessible dash while valid zero remains visible", () => {
  assert.equal(getAccessibleMetricText(null, "currency"), "—");
  assert.equal(getAccessibleMetricText(0, "currency"), "£0.00");
});

test("normalizes fraction digits to safe finite integers", () => {
  assert.equal(normalizeFractionDigits("number", 0), 0);
  assert.equal(normalizeFractionDigits("percent", 1), 1);
  assert.equal(normalizeFractionDigits("currency", 2), 2);
  assert.equal(normalizeFractionDigits("currency"), 2);
  assert.equal(normalizeFractionDigits("number", -4), 0);
  assert.equal(normalizeFractionDigits("number", 25), 20);
  assert.equal(normalizeFractionDigits("number", 2.9), 2);
  assert.equal(normalizeFractionDigits("number", Number.NaN), 0);
  assert.equal(normalizeFractionDigits("number", Number.POSITIVE_INFINITY), 0);
});

test("malformed formatting options and metric values cannot throw", () => {
  assert.equal(formatAnimatedMetricValue(12.5, "currency", undefined), "£12.50");
  assert.equal(formatAnimatedMetricValue(12.5, "number", -1), "13");
  assert.equal(formatAnimatedMetricValue(12.5, "number", 30.75), "12.5");
  assert.equal(formatAnimatedMetricValue(12.5, "number", Number.NaN), "13");
  assert.equal(formatAnimatedMetricValue(12.5, "number", Number.POSITIVE_INFINITY), "13");
  assert.equal(formatAnimatedMetricValue(Number.NaN, "currency"), "—");
  assert.equal(formatAnimatedMetricValue(Number.POSITIVE_INFINITY, "percent"), "—");
  assert.equal(getAccessibleMetricText(Number.NEGATIVE_INFINITY, "currency"), "—");
});

test("Year to Date currency and percentage precision remain explicit and safe", () => {
  assert.equal(formatAnimatedMetricValue(700, "currency", 0), "£700");
  assert.equal(formatAnimatedMetricValue(58.333, "percent", 1), "58.3%");
});

test("reduced motion disables count-up without changing the final value", () => {
  assert.equal(shouldAnimateMetricValue(10, 20, true), false);
  assert.equal(shouldAnimateMetricValue(10, 20, false), true);
  assert.equal(shouldAnimateMetricValue(null, 20, false), true);
  assert.equal(shouldAnimateMetricValue(10, null, false), false);
});
