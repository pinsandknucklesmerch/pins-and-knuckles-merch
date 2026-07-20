import assert from "node:assert/strict";
import test from "node:test";
import { salesLeadFixtures } from "../data/fixtures.ts";
import { historicalSalesDashboardFixture } from "../data/workbookFixture.ts";
import {
  calculateConversionRate,
  calculateHistoricalDashboardMetrics,
  calculateDashboardKpis,
  calculatePercentageChange,
  calculateProgress,
  calculateSalesDashboardKpis,
  filterLeadsByDateRange,
} from "../lib/calculateKpis.ts";
import type { DashboardPeriodFixture, SalesLead } from "../types.ts";

const period: DashboardPeriodFixture = {
  month: "2026-07",
  monthlyProfit: 155_000,
  previousYearMonthlyProfit: 125_000,
  quotesDone: 300,
  previousYearQuotesDone: 250,
  ordersProcessed: 200,
  previousYearOrdersProcessed: 0,
};

test("progress handles below, at, and above target", () => {
  assert.equal(calculateProgress(50, 100), 50);
  assert.equal(calculateProgress(100, 100), 100);
  assert.equal(calculateProgress(150, 100), 150);
  assert.equal(calculateProgress(100, 0), null);
});

test("previous-year increase and decrease are signed percentages", () => {
  assert.equal(calculatePercentageChange(120, 100), 20);
  assert.equal(calculatePercentageChange(80, 100), -20);
  assert.equal(calculatePercentageChange(10, 0), null);
});

test("dashboard KPI cards include confirmed targets and comparisons", () => {
  const kpis = calculateDashboardKpis(period);
  assert.deepEqual(kpis.map((kpi) => [kpi.label, kpi.target]), [
    ["Monthly Profit", 155000],
    ["Quotes Done", 300],
    ["Orders Processed", null],
  ]);
  assert.equal(kpis[0].comparison.difference, 30_000);
});

test("conversion rate and zero leads are safe", () => {
  assert.equal(calculateConversionRate(10, 3), 30);
  assert.equal(calculateConversionRate(0, 0), 0);
  assert.equal(calculateConversionRate(0, 4), 0);
});

test("date filtering includes both range boundaries", () => {
  const rows = filterLeadsByDateRange(salesLeadFixtures, { from: "2026-07-02", to: "2026-07-04" });
  assert.deepEqual(rows.map((row) => row.id), ["lead_002", "lead_003", "lead_004"]);
});

test("totals, salesperson rows, and source rows are calculated and stably sorted", () => {
  const leads: SalesLead[] = [
    { id: "b", createdAt: "2026-07-01", salespersonId: "2", salespersonName: "Zed", sourceCategory: "Website", status: "converted", convertedAt: null },
    { id: "a", createdAt: "2026-07-01", salespersonId: "1", salespersonName: "Amy", sourceCategory: "Repeat", status: "new", convertedAt: null },
    { id: "c", createdAt: "2026-07-01", salespersonId: null, salespersonName: "", sourceCategory: "", status: "converted", convertedAt: null },
  ];
  const result = calculateSalesDashboardKpis(leads, { from: "2026-07-01", to: "2026-07-01" }, period);
  assert.equal(result.summary.totalLeads, 3);
  assert.equal(result.summary.totalConversions, 2);
  assert.deepEqual(result.salespeople.map((row) => row.salespersonName), ["Amy", "Unassigned", "Zed"]);
  assert.deepEqual(result.sources.map((row) => row.sourceCategory), ["Repeat", "Unknown", "Website"]);
});

test("workbook fixture preserves historical nulls and normalized salesperson names", () => {
  const year2025 = historicalSalesDashboardFixture.years.find((year) => year.year === 2025);
  assert.deepEqual(year2025?.enquiries.slice(10), [null, null]);
  assert.deepEqual(year2025?.profit.slice(10), [193674, null]);
  const salesperson2024 = historicalSalesDashboardFixture.salespersonYears.find((year) => year.year === 2024);
  assert.equal(salesperson2024?.months.January?.[3].salespersonName, "Catherine");
  assert.equal(salesperson2024?.months.August?.[0].averageProfitPerJob, null);
  assert.equal(year2025?.profit[10], 193674);
});

test("salesperson sheets are only exposed for their conservatively mapped year", () => {
  const metrics2024 = calculateHistoricalDashboardMetrics(historicalSalesDashboardFixture, { year: 2024, month: "January" });
  const metrics2025 = calculateHistoricalDashboardMetrics(historicalSalesDashboardFixture, { year: 2025, month: "January" });
  assert.equal(metrics2024.salespeople.length, 5);
  assert.equal(metrics2025.salespeople.length, 0);
});

test("missing monthly cells remain null instead of becoming zero", () => {
  const metrics = calculateHistoricalDashboardMetrics(historicalSalesDashboardFixture, { year: 2025, month: "December" });
  assert.equal(metrics.summary.totalLeads, null);
  assert.equal(metrics.summary.totalConversions, null);
  assert.equal(metrics.summary.conversionRate, null);
  assert.equal(metrics.kpis[0].comparison.current, null);
});

test("historical selection uses workbook current and previous-year values", () => {
  const metrics = calculateHistoricalDashboardMetrics(historicalSalesDashboardFixture, { year: 2025, month: "October" });
  assert.equal(metrics.kpis[0].comparison.current, 364197);
  assert.equal(metrics.kpis[0].comparison.previousYear, 252641);
  assert.equal(metrics.kpis[1].comparison.current, 323);
  assert.equal(metrics.kpis[1].comparison.previousYear, 303);
  assert.equal(metrics.kpis[2].comparison.current, null);
  assert.equal(metrics.summary.conversionRate, 58.8);
});
