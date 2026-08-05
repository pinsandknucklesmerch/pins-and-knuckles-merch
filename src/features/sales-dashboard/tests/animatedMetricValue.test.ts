import assert from "node:assert/strict";
import test from "node:test";
import { formatAnimatedMetricValue, getAccessibleMetricText, shouldAnimateMetricValue } from "../lib/animatedMetricValue.ts";

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

test("reduced motion disables count-up without changing the final value", () => {
  assert.equal(shouldAnimateMetricValue(10, 20, true), false);
  assert.equal(shouldAnimateMetricValue(10, 20, false), true);
  assert.equal(shouldAnimateMetricValue(null, 20, false), true);
  assert.equal(shouldAnimateMetricValue(10, null, false), false);
});
