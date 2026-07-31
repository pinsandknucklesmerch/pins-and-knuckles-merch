import assert from "node:assert/strict";
import test from "node:test";
import { calculateYearToDate } from "../domain/calculateYearToDate.ts";
import type { CompanyKpiMonth } from "../domain/types.ts";

function row(month: number, monthlyProfit: number | null): CompanyKpiMonth { return { year: 2026, month, monthlyProfit, monthlyProfitSource: "monday", quotesDone: null, ordersProcessed: null, salesInboxEnquiries: null, converted: null, mondaySyncMetadata: null, notes: null, source: "monday" }; }
const targets = Array.from({ length: 12 }, (_, index) => 100 + index * 10);

test("YTD uses the selected January, July, and December cutoffs with per-month targets", () => {
  assert.deepEqual(calculateYearToDate(2026, 1, [row(1, 110)], targets).includedMonths, [1]);
  const july = calculateYearToDate(2026, 7, Array.from({ length: 7 }, (_, index) => row(index + 1, 100)), targets);
  assert.deepEqual(july.includedMonths, [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual([july.ytdActual, july.ytdTarget, july.variance], [700, 910, -210]);
  assert.ok(Math.abs((july.achievementRate ?? 0) - (700 / 910) * 100) < 1e-10);
  assert.equal(calculateYearToDate(2026, 12, Array.from({ length: 12 }, (_, index) => row(index + 1, 100)), targets).includedMonths.length, 12);
});

test("YTD annualises available authoritative months and never fabricates future actuals", () => {
  const result = calculateYearToDate(2026, 3, [row(1, 0), row(2, 200), row(3, 100)], Array(12).fill(100));
  assert.deepEqual([result.ytdActual, result.projectedYearEnd, result.annualTarget, result.achievementRate], [300, 1200, 1200, 100]);
  assert.deepEqual(result.cumulativeActualByMonth.slice(0, 5), [0, 200, 300, null, null]);
  assert.deepEqual(result.cumulativeTargetByMonth.slice(0, 4), [100, 200, 300, 400]);
});

test("missing and null profit months remain incomplete rather than zero", () => {
  const result = calculateYearToDate(2026, 3, [row(1, 100), null, row(3, null)], Array(12).fill(100));
  assert.deepEqual([result.ytdActual, result.missingMonths, result.isComplete], [100, [2, 3], false]);
  assert.deepEqual(result.cumulativeActualByMonth.slice(0, 3), [100, null, null]);
});
