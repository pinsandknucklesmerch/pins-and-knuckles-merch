import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("Sales Inbox card uses the required semantic heading hierarchy", () => {
  const component = readFileSync(new URL("../components/SalesInboxKpi.tsx", import.meta.url), "utf8");
  assert.match(component, /<h2 className=\{styles\.heading\}>Sales Inbox<\/h2>/);
  assert.match(component, /<h3 id="sales-inbox-enquiries" className=\{styles\.label\}>Enquiries<\/h3>/);
  assert.match(component, /<h3 id="sales-inbox-conversion-rate" className=\{styles\.label\}>Conversion Rate<\/h3>/);
  assert.doesNotMatch(component, />Sales Inbox Enquiries</);
});

test("Overview renders the two top cards before the full-width performance card", () => {
  const component = readFileSync(new URL("../components/CompanyKpiView.tsx", import.meta.url), "utf8");
  const profitIndex = component.indexOf("<ProfitShirtKpi metric={profit}");
  const inboxIndex = component.indexOf("<SalesInboxKpi enquiries={inbox} conversionRate={inboxConversion}");
  const performanceIndex = component.indexOf("<CombinedKpiCard first={quotes} second={orders} third={conversion}");

  assert.match(component, /<MetricGrid columns=\{12\} gap=\{12\}>/);
  assert.ok(profitIndex >= 0 && profitIndex < inboxIndex);
  assert.ok(inboxIndex >= 0 && inboxIndex < performanceIndex);
  assert.match(component, /<MetricGrid\.Item span="full">\s*<CombinedKpiCard first=\{quotes\} second=\{orders\} third=\{conversion\}/);
  assert.doesNotMatch(component, /convertedMetric|Converted/);
});
