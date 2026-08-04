import assert from "node:assert/strict";
import test from "node:test";
import { formatSnuggleChartMonth, getSnuggleBarHeight, getSnuggleChartMaxMagnitude, sortSnuggleMonthsChronologically } from "../lib/snuggleChart.ts";

const months = [
  { year: 2026, month: 3, total: 30 },
  { year: 2025, month: 12, total: -20 },
  { year: 2026, month: 1, total: 10 },
];

test("Snuggle chart sorts only available months chronologically", () => {
  assert.deepEqual(sortSnuggleMonthsChronologically(months).map(({ year, month }) => `${year}-${month}`), ["2025-12", "2026-1", "2026-3"]);
});

test("Snuggle chart scales by profit magnitude and preserves month labels", () => {
  const max = getSnuggleChartMaxMagnitude(months);
  assert.equal(max, 30);
  assert.ok(Math.abs(getSnuggleBarHeight(-20, max) - 200 / 3) < 1e-9);
  assert.equal(formatSnuggleChartMonth(months[2]), "Jan 2026");
});
