import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { YearComparisonPoint } from "../domain/types.ts";
import { chartValue } from "../lib/chartValue.ts";
import { sumYearComparisonMetric, ytdComparisonValue } from "../lib/ytdComparison.ts";

const component = readFileSync(new URL("../components/YearToDateView.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../components/YearToDateView.module.css", import.meta.url), "utf8");
const charts = readFileSync(new URL("../components/YtdComparisonCharts.tsx", import.meta.url), "utf8");
const chartStyles = readFileSync(new URL("../components/YtdComparisonCharts.module.css", import.meta.url), "utf8");

function point(values: Partial<YearComparisonPoint>): YearComparisonPoint {
  return {
    month: 1,
    label: "Jan",
    monthlyProfit: null,
    quotesDone: null,
    ordersProcessed: null,
    leads: null,
    converted: null,
    conversionRate: null,
    salesInboxEnquiries: null,
    salesInboxConversionRate: null,
    ...values,
  };
}

test("YTD uses dedicated reference-driven cards and metric-specific comparison charts", () => {
  for (const code of ["QUOTES_DONE", "ORDERS_PROCESSED", "CONVERTED", "CONVERSION_RATE", "SALES_INBOX_ENQUIRIES", "SALES_INBOX_CONVERSION_RATE"]) {
    assert.match(component, new RegExp(`code: "${code}"`));
  }
  assert.match(component, /YtdProfitSummary/);
  assert.match(component, /YtdMonthlyProfitChart/);
  assert.match(component, /YtdComparisonCard/);
  assert.match(component, /YtdBarComparisonChart/);
  assert.match(component, /YtdRateComparisonChart/);
  assert.doesNotMatch(component, /from "metricui"|<Surface|ComparisonBadge/);
  assert.match(styles, /grid-template-columns: minmax\(15rem, 27fr\) minmax\(0, 73fr\)/);
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-rows: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-columns: minmax\(8\.5rem, 38fr\) minmax\(0, 62fr\)/);
});

test("YTD charts reserve axis space and render full current and previous monthly series", () => {
  assert.match(charts, /YtdProfitAreaChart/);
  assert.match(charts, /YtdBarComparisonChart/);
  assert.match(charts, /YtdRateComparisonChart/);
  assert.match(charts, /bottom: 32/);
  assert.match(charts, /bottom: 24/);
  assert.match(charts, /points\.map\(\(point, index\)/);
  assert.match(charts, /currentLine/);
  assert.match(charts, /previousLine/);
  assert.match(charts, /previousBar/);
  assert.match(chartStyles, /overflow: visible/);
  assert.match(chartStyles, /stroke-dasharray: 6 5/);
  assert.doesNotMatch(chartStyles, /overflow: hidden/);
});

test("YTD comparison selectors retain aggregate rate and count calculations", () => {
  const points = [
    point({ month: 1, quotesDone: 100, ordersProcessed: 40, salesInboxEnquiries: 20, converted: 5 }),
    point({ month: 2, label: "Feb", quotesDone: 50, ordersProcessed: 35, salesInboxEnquiries: 30, converted: 10 }),
  ];
  assert.equal(sumYearComparisonMetric(points, "QUOTES_DONE"), 150);
  assert.equal(ytdComparisonValue(points, "CONVERSION_RATE"), 50);
  assert.equal(ytdComparisonValue(points, "SALES_INBOX_CONVERSION_RATE"), 30);
});

test("YTD chart values preserve finite zeroes and turn invalid values into gaps", () => {
  assert.equal(chartValue(0), 0);
  assert.equal(chartValue(12.5), 12.5);
  assert.equal(chartValue(null), null);
  assert.equal(chartValue(undefined), null);
  assert.equal(chartValue(Number.NaN), null);
  assert.equal(chartValue(Number.POSITIVE_INFINITY), null);
  assert.equal(chartValue(Number.NEGATIVE_INFINITY), null);
});

test("YTD panel owns its heading and distributes available desktop height", () => {
  assert.match(component, /<h2 id="year-to-date-title">Year to Date<\/h2>/);
  assert.match(component, /Data shown: YTD vs same period last year/);
  assert.match(component, /Through \{periodLabel\}/);
  assert.match(styles, /height: 100%/);
  assert.match(styles, /grid-template-rows: minmax\(13\.5rem, 0\.86fr\) minmax\(19rem, 1\.14fr\)/);
  assert.doesNotMatch(styles, /100vw|max-content|translateX|margin[^:]*:\s*-/);
  assert.match(styles, /@media \(max-width: 1199px\)/);
  assert.match(styles, /@media \(max-width: 899px\)/);
});
