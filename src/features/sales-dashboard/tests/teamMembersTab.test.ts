import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateConversionRate } from "../domain/calculateDashboardKpis.ts";
import { normalDashboardMembers } from "../domain/memberVisibility.ts";
import type { MemberDashboardRow } from "../domain/types.ts";
import type { SnuggleProfitData } from "../server/snuggleProfit.ts";
import { getMemberSnuggleProfit, getTeamMemberHistory, getVisibleTeamMembers } from "../lib/teamMembersTab.ts";

const rows: MemberDashboardRow[] = [
  { teamMemberKey: "hardus", teamMemberName: "Hardus", memberClassification: "dashboard_account_manager", year: 2026, month: 7, quotesDone: 0, ordersProcessed: 0, salesInboxEnquiries: null, converted: null, profit: 0, pkTax: 0, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday" as const, conversionRate: 0, previousYear: null },
  { teamMemberKey: "shannon", teamMemberName: "Shannon", memberClassification: "admin_hidden", year: 2026, month: 7, quotesDone: 2, ordersProcessed: 1, salesInboxEnquiries: null, converted: null, profit: 10, pkTax: 1, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday" as const, conversionRate: 50, previousYear: null },
  { teamMemberKey: "other_non_dashboard", teamMemberName: "Other / reconciliation", memberClassification: "other_non_dashboard", year: 2026, month: 7, quotesDone: 1, ordersProcessed: 1, salesInboxEnquiries: null, converted: null, profit: 5, pkTax: null, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday" as const, conversionRate: 100, previousYear: null },
];

test("Team Members visibility includes only normal account managers", () => {
  assert.deepEqual(getVisibleTeamMembers(rows).map((row) => row.teamMemberKey), ["hardus"]);
  assert.deepEqual(normalDashboardMembers(rows).map((row) => row.teamMemberKey), ["hardus"]);
});

test("Team Members history includes available months through the selected month only", () => {
  const history = [
    { ...rows[0], month: 8, profit: 80 },
    { ...rows[0], month: 1, profit: 10 },
    { ...rows[0], month: 9, profit: 90 },
  ];
  assert.deepEqual(getTeamMemberHistory(history, "hardus", 2026, 8).map((row) => row.month), [1, 8]);
  assert.equal(getTeamMemberHistory(history, "hardus", 2026, 8).find((row) => row.month === 1)?.profit, 10);
});

test("Team Members renders Snuggle Profit on cards, summary, and history", () => {
  const component = readFileSync(new URL("../components/TeamMembersTab.tsx", import.meta.url), "utf8");
  assert.match(component, /Snuggle Profit/);
  assert.match(component, /getMemberSnuggleProfit/);
  assert.match(component, /<th[^>]*>Snuggle<\/th>/);
});

test("Team Members Snuggle aggregation preserves zero and unavailable months", () => {
  const snuggle: SnuggleProfitData = {
    months: [],
    members: [{ memberKey: "hardus", total: 12, months: [{ year: 2026, month: 1, total: 0 }, { year: 2026, month: 8, total: 12 }] }],
    warnings: [],
    error: null,
  };
  assert.equal(getMemberSnuggleProfit(snuggle, "hardus", 2026, 1), 0);
  assert.equal(getMemberSnuggleProfit(snuggle, "hardus", 2026, 8), 12);
  assert.equal(getMemberSnuggleProfit(snuggle, "hardus", 2026, 7), null);
});

test("Team Members conversion rate safely handles missing and zero quotes", () => {
  assert.equal(calculateConversionRate(4, 0), 0);
  assert.equal(calculateConversionRate(null, null), 0);
});
