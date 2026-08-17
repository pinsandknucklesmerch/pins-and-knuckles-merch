import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getVisibleTeamMembers } from "../lib/teamMembersTab.ts";
import { normalDashboardMembers } from "../domain/memberVisibility.ts";
import { calculateMemberConversionRate, formatMemberKpiValue, getMemberKpiMetrics, getMemberKpiSnapshot } from "../domain/memberKpis.ts";
import type { MemberDashboardRow } from "../domain/types.ts";

const rows: MemberDashboardRow[] = [
  { teamMemberKey: "hardus", teamMemberName: "Hardus", memberClassification: "dashboard_account_manager", year: 2026, month: 7, quotesDone: 4, ordersProcessed: 1, salesInboxEnquiries: null, converted: null, profit: 1250, pkTax: 0, snuggleProfit: 9, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday", conversionRate: 25, previousYear: null },
  { teamMemberKey: "bux", teamMemberName: "Bux", memberClassification: "dashboard_account_manager", year: 2026, month: 7, quotesDone: null, ordersProcessed: null, salesInboxEnquiries: null, converted: null, profit: null, pkTax: null, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday", conversionRate: 0, previousYear: null },
  { teamMemberKey: "shannon", teamMemberName: "Shannon", memberClassification: "admin_hidden", year: 2026, month: 7, quotesDone: 2, ordersProcessed: 1, salesInboxEnquiries: null, converted: null, profit: 10, pkTax: 1, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday", conversionRate: 50, previousYear: null },
  { teamMemberKey: "johan", teamMemberName: "Johan", memberClassification: "admin_hidden", year: 2026, month: 7, quotesDone: 3, ordersProcessed: 2, salesInboxEnquiries: null, converted: null, profit: 20, pkTax: 2, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday", conversionRate: 66.7, previousYear: null },
  { teamMemberKey: "reconciliation", teamMemberName: "Reconciliation", memberClassification: "other_non_dashboard", year: 2026, month: 7, quotesDone: 2, ordersProcessed: 1, salesInboxEnquiries: null, converted: null, profit: 10, pkTax: 1, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday", conversionRate: 50, previousYear: null },
];

test("Team Members remains a dashboard tab and uses the selected dashboard period", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const component = readFileSync(new URL("../components/TeamMembersTab.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /Team Members/);
  assert.match(dashboard, /<TeamMembersTab data=\{data\} year=\{year\} month=\{month\}/);
  assert.doesNotMatch(component, /Select|select|member dropdown|MemberKpiHistoryTable/);
  assert.match(component, /return <Panel/);
  assert.doesNotMatch(component, /Panel title="Team Members"/);
  assert.match(component, /visibleMembers\.map/);
  assert.match(component, /flex flex-col gap-5/);
  assert.doesNotMatch(component, /sm:grid-cols-2|xl:grid-cols-3/);
  assert.match(component, /year=\{year\} month=\{month\}/);
});

test("Team Members renders every visible account manager and excludes hidden members", () => {
  assert.deepEqual(getVisibleTeamMembers(rows).map((row) => row.teamMemberKey), ["hardus", "bux", "johan"]);
  assert.deepEqual(normalDashboardMembers(rows).map((row) => row.teamMemberKey), ["hardus", "bux", "johan"]);
  const component = readFileSync(new URL("../components/TeamMembersTab.tsx", import.meta.url), "utf8");
  assert.match(component, /<MemberSummaryCard/);
  const presentation = readFileSync(new URL("../components/MemberKpiPresentation.tsx", import.meta.url), "utf8");
  assert.match(presentation, /className="grid w-full gap-3 border-b border-border pb-5 text-left last:border-b-0 last:pb-0"/);
});

test("member summary KPI mapping preserves source-owned values and derives conversion", () => {
  const snapshot = getMemberKpiSnapshot(rows, "hardus", 2026, 7);
  assert.deepEqual(snapshot, { year: 2026, month: 7, memberKey: "hardus", memberName: "Hardus", profit: 1250, quotesDone: 4, ordersProcessed: 1, conversionRate: 25 });
  assert.deepEqual(getMemberKpiMetrics(snapshot).map((metric) => metric.label), ["Profit", "Quotes Done", "Orders Processed", "Conversion Rate"]);
  assert.deepEqual(getMemberKpiMetrics(snapshot).map((metric) => metric.target), [null, null, null, null]);
});

test("member conversion safely handles zero, missing, and finite quote values", () => {
  assert.equal(calculateMemberConversionRate(4, 0), 0);
  assert.equal(calculateMemberConversionRate(4, null), null);
  assert.equal(calculateMemberConversionRate(null, 4), null);
  assert.equal(calculateMemberConversionRate(1, 3), 33.3);
});

test("missing member values remain dashes rather than invented zeros", () => {
  assert.equal(formatMemberKpiValue(null, "currency"), "—");
  assert.equal(formatMemberKpiValue(null, "number"), "—");
  assert.equal(formatMemberKpiValue(null, "percent"), "—");
});

test("summary cards preserve missing KPI values as dashes", () => {
  const snapshot = getMemberKpiSnapshot(rows, "bux", 2026, 7);
  assert.deepEqual(getMemberKpiMetrics(snapshot).map((metric) => formatMemberKpiValue(metric.value, metric.format)), ["—", "—", "—", "—"]);
});

test("Team Members presentation reuses the four responsive User Profile MetricUI value panels", () => {
  const component = readFileSync(new URL("../components/TeamMembersTab.tsx", import.meta.url), "utf8");
  const presentation = readFileSync(new URL("../components/MemberKpiPresentation.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(component, /Monthly history|MemberKpiHistoryTable/);
  assert.match(presentation, /MemberSummaryCard/);
  assert.match(presentation, /Profit/);
  assert.match(presentation, /Quotes Done/);
  assert.match(presentation, /Orders Processed/);
  assert.match(presentation, /Conversion Rate/);
  assert.match(presentation, /<KpiCard/);
  assert.match(presentation, /data-testid="member-kpi-metric"/);
  assert.match(presentation, /grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4/);
  assert.doesNotMatch(presentation, /goal=/);
  assert.doesNotMatch(presentation, /RevGauge/);
});
