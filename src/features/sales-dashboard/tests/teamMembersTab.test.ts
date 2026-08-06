import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getVisibleTeamMembers } from "../lib/teamMembersTab.ts";
import { normalDashboardMembers } from "../domain/memberVisibility.ts";
import { calculateMemberConversionRate, formatMemberKpiValue, getMemberKpiHistory, getMemberKpiMetrics, getMemberKpiSnapshot } from "../domain/memberKpis.ts";
import type { MemberDashboardRow, TeamMemberKpiMonth } from "../domain/types.ts";

const rows: MemberDashboardRow[] = [
  { teamMemberKey: "hardus", teamMemberName: "Hardus", memberClassification: "dashboard_account_manager", year: 2026, month: 7, quotesDone: 4, ordersProcessed: 1, salesInboxEnquiries: null, converted: null, profit: 1250, pkTax: 0, snuggleProfit: 9, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday", conversionRate: 25, previousYear: null },
  { teamMemberKey: "shannon", teamMemberName: "Shannon", memberClassification: "admin_hidden", year: 2026, month: 7, quotesDone: 2, ordersProcessed: 1, salesInboxEnquiries: null, converted: null, profit: 10, pkTax: 1, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday", conversionRate: 50, previousYear: null },
];

test("Team Members remains a dashboard tab and uses the selected dashboard period", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const component = readFileSync(new URL("../components/TeamMembersTab.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /Team Members/);
  assert.match(dashboard, /<TeamMembersTab data=\{data\} year=\{year\} month=\{month\}/);
  assert.match(component, /<MemberKpiCards rows=\{data\.memberHistory\}/);
  assert.match(component, /<MemberKpiHistoryTable rows=\{data\.memberHistory\}/);
  assert.match(component, /year=\{year\} month=\{month\}/);
});

test("Team Members visibility includes only normal account managers", () => {
  assert.deepEqual(getVisibleTeamMembers(rows).map((row) => row.teamMemberKey), ["hardus"]);
  assert.deepEqual(normalDashboardMembers(rows).map((row) => row.teamMemberKey), ["hardus"]);
});

test("selected member KPI mapping preserves source-owned values and derives conversion", () => {
  const snapshot = getMemberKpiSnapshot(rows, "hardus", 2026, 7);
  assert.deepEqual(snapshot, { year: 2026, month: 7, memberKey: "hardus", memberName: "Hardus", profit: 1250, quotesDone: 4, ordersProcessed: 1, conversionRate: 25 });
  assert.deepEqual(getMemberKpiMetrics(snapshot).map((metric) => metric.label), ["Profit", "Quotes Done", "Orders Processed", "Conversion Rate"]);
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

test("member history is ordered oldest to newest for the selected year and month", () => {
  const history: TeamMemberKpiMonth[] = [
    { ...rows[0], month: 8 },
    { ...rows[0], month: 1, profit: 10 },
    { ...rows[0], month: 9 },
  ];
  assert.deepEqual(getMemberKpiHistory(history, "hardus", 2026, 8).map((row) => row.month), [1, 8]);
});

test("Team Members presentation excludes Snuggle Profit and PK Tax", () => {
  const component = readFileSync(new URL("../components/TeamMembersTab.tsx", import.meta.url), "utf8");
  const presentation = readFileSync(new URL("../components/MemberKpiPresentation.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(component, /Snuggle Profit|PK Tax/);
  assert.doesNotMatch(presentation, /Snuggle Profit|PK Tax/);
  assert.match(presentation, /Conversion Rate/);
});
