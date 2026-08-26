import assert from "node:assert/strict";
import test from "node:test";
import { compareTraffic, parseTrafficInvestigationRange, rankPositiveContributors } from "../lib/trafficInvestigation.ts";

test("single-day investigations use the preceding seven complete days", () => {
  assert.deepEqual(parseTrafficInvestigationRange("2026-08-17", "2026-08-17"), { startDate: "2026-08-17", endDate: "2026-08-17", baselineStartDate: "2026-08-10", baselineEndDate: "2026-08-16", baselineDays: 7, isSingleDay: true });
});

test("90-day aggregated buckets use the immediately preceding equivalent range", () => {
  assert.deepEqual(parseTrafficInvestigationRange("2026-08-15", "2026-08-17"), { startDate: "2026-08-15", endDate: "2026-08-17", baselineStartDate: "2026-08-12", baselineEndDate: "2026-08-14", baselineDays: 3, isSingleDay: false });
  assert.equal(parseTrafficInvestigationRange("2026-08-14", "2026-08-17"), null);
  assert.equal(parseTrafficInvestigationRange("2026-08-17", "2026-08-10"), null);
  assert.equal(parseTrafficInvestigationRange("invalid", "2026-08-17"), null);
  assert.equal(parseTrafficInvestigationRange("2099-08-17", "2099-08-17"), null);
});

test("traffic comparison and contributors handle zero baselines and rank positive changes", () => {
  assert.deepEqual(compareTraffic(214, 854, 7), { selected: 214, baselineAverage: 122, difference: 92, percentageChange: 75.40983606557377 });
  assert.deepEqual(compareTraffic(50, 700, 7), { selected: 50, baselineAverage: 100, difference: -50, percentageChange: -50 });
  assert.equal(compareTraffic(10, 0, 7).percentageChange, null);
  const rows = ["Direct", "Organic Search", "Paid Search"].map((label, index) => ({ label, sessions: compareTraffic([18, 91, 43][index], 0, 1) }));
  assert.deepEqual(rankPositiveContributors(rows).map((row) => row.label), ["Organic Search", "Paid Search", "Direct"]);
});
