import assert from "node:assert/strict";
import test from "node:test";
import { getFixtureCompanyMonth } from "../data/mappers.ts";
import { buildYearComparison, formatYearComparisonValue, yearComparisonValue } from "../data/yearComparison.ts";
import { historicalSalesDashboardFixture } from "../data/workbookFixture.ts";

function year(year: number) {
  return Array.from({ length: 12 }, (_, index) => getFixtureCompanyMonth(historicalSalesDashboardFixture, year, index + 1));
}

test("year comparison preserves Jan through Dec ordering for selected and previous years", () => {
  const comparison = buildYearComparison(2025, year(2025), year(2024));
  assert.deepEqual(comparison.selected.map((point) => point.label), ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);
  assert.equal(comparison.selectedYear, 2025);
  assert.equal(comparison.previousYear, 2024);
  assert.equal(comparison.selected[0].monthlyProfit, 131411);
  assert.equal(comparison.previous[0].monthlyProfit, 109605);
});

test("year comparison preserves null future and missing historical months", () => {
  const comparison = buildYearComparison(2025, year(2025), year(2021));
  assert.equal(comparison.selected[11].monthlyProfit, null);
  assert.equal(comparison.selected[10].salesInboxEnquiries, null);
  assert.equal(comparison.previous[0].salesInboxEnquiries, null);
});

test("trend metric mapping uses canonical fields without mixing conversion metrics", () => {
  const point = buildYearComparison(2025, year(2025), year(2024)).selected[6];
  assert.equal(yearComparisonValue(point, "MONTHLY_PROFIT"), point.monthlyProfit);
  assert.equal(yearComparisonValue(point, "QUOTES_DONE"), point.quotesDone);
  assert.equal(yearComparisonValue(point, "CONVERTED"), point.converted);
  assert.equal(yearComparisonValue(point, "CONVERSION_RATE"), point.conversionRate);
  assert.equal(yearComparisonValue(point, "SALES_INBOX_ENQUIRIES"), point.salesInboxEnquiries);
  assert.equal(yearComparisonValue(point, "SALES_INBOX_CONVERSION_RATE"), point.salesInboxConversionRate);
  assert.equal(yearComparisonValue(point, "LEADS"), null);
});

test("trend values format as GBP, integers, and percentage points", () => {
  assert.equal(formatYearComparisonValue(91571.84, "MONTHLY_PROFIT"), "£91,572");
  assert.equal(formatYearComparisonValue(44, "SALES_INBOX_ENQUIRIES"), "44");
  assert.equal(formatYearComparisonValue(25, "SALES_INBOX_CONVERSION_RATE"), "25.0%");
});
