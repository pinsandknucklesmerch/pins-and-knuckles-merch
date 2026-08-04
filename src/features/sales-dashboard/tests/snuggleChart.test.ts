import assert from "node:assert/strict";
import test from "node:test";
import { buildSnuggleChartData, formatSnuggleChartMonth, sortSnuggleMonthsChronologically } from "../lib/snuggleChart.ts";

const months = [
  { year: 2026, month: 3, total: 30 },
  { year: 2025, month: 12, total: -20 },
  { year: 2026, month: 1, total: 10 },
];

test("Snuggle chart sorts only available months chronologically", () => {
  assert.deepEqual(sortSnuggleMonthsChronologically(months).map(({ year, month }) => `${year}-${month}`), ["2025-12", "2026-1", "2026-3"]);
});

test("Snuggle chart preserves month labels", () => {
  assert.equal(formatSnuggleChartMonth(months[2]), "Jan 2026");
});

test("Snuggle MetricUI chart data preserves exact values and does not invent months", () => {
  assert.deepEqual(buildSnuggleChartData(months), [
    { month: "Dec 2025", profit: -20 },
    { month: "Jan 2026", profit: 10 },
    { month: "Mar 2026", profit: 30 },
  ]);
});
