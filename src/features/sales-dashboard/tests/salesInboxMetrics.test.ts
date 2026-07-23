import assert from "node:assert/strict";
import test from "node:test";
import { calculateCompanyMetrics, calculateConversionRate } from "../domain/calculateDashboardKpis.ts";
import type { CompanyKpiMonth } from "../domain/types.ts";
import { comparisonArcFillPercent, comparisonArcRatio, formatPercentagePoints } from "../lib/metricDisplay.ts";

function month(overrides: Partial<CompanyKpiMonth> = {}): CompanyKpiMonth {
  return {
    year: 2026,
    month: 7,
    monthlyProfit: null,
    quotesDone: null,
    ordersProcessed: null,
    salesInboxEnquiries: 44,
    converted: 11,
    mondaySyncMetadata: null,
    notes: null,
    source: "monday",
    ...overrides,
  };
}

test("Sales Inbox conversion uses converted divided by current enquiries", () => {
  const metrics = calculateCompanyMetrics(month(), month({ year: 2025, salesInboxEnquiries: 67, converted: 20 }), {});
  const inboxConversion = metrics.find((metric) => metric.code === "SALES_INBOX_CONVERSION_RATE");
  assert.equal(inboxConversion?.value, 25);
  assert.equal(formatPercentagePoints(inboxConversion?.value ?? null), "25.0%");
});

test("Sales Inbox enquiries arc compares only current and last-year enquiries", () => {
  assert.equal(comparisonArcRatio(44, 67), 44 / 67);
  assert.equal(comparisonArcFillPercent(44, 67), (44 / 67) * 100);
});

test("enquiries comparison never overwrites the canonical conversion rate", () => {
  const rate = calculateConversionRate(11, 44);
  const enquiriesComparison = comparisonArcRatio(44, 67);
  assert.equal(rate, 25);
  assert.notEqual(rate, enquiriesComparison);
});

test("percentage-point formatting does not apply percentage conversion twice", () => {
  assert.equal(formatPercentagePoints(25), "25.0%");
  assert.equal(formatPercentagePoints(-2.5), "-2.5%");
});

test("null and zero enquiry denominators remain safe", () => {
  assert.equal(calculateConversionRate(11, null), 0);
  assert.equal(calculateConversionRate(11, 0), 0);
  assert.equal(formatPercentagePoints(calculateConversionRate(11, 0)), "0.0%");
  assert.equal(comparisonArcRatio(null, 67), null);
  assert.equal(comparisonArcRatio(44, 0), null);
});
