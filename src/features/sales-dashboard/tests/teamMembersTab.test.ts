import assert from "node:assert/strict";
import test from "node:test";
import { calculateConversionRate } from "../domain/calculateDashboardKpis.ts";
import { normalDashboardMembers } from "../domain/memberVisibility.ts";
import type { MemberDashboardRow } from "../domain/types.ts";
import type { SnuggleProfitData } from "../server/snuggleProfit.ts";
import { getMemberSnuggleProfit, getVisibleTeamMembers } from "../lib/teamMembersTab.ts";

const rows: MemberDashboardRow[] = [
  { teamMemberKey: "hardus", teamMemberName: "Hardus", memberClassification: "dashboard_account_manager", year: 2026, month: 7, quotesDone: 0, ordersProcessed: 0, salesInboxEnquiries: null, converted: null, profit: 0, pkTax: 0, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday" as const, conversionRate: 0, previousYear: null },
  { teamMemberKey: "shannon", teamMemberName: "Shannon", memberClassification: "admin_hidden", year: 2026, month: 7, quotesDone: 2, ordersProcessed: 1, salesInboxEnquiries: null, converted: null, profit: 10, pkTax: 1, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday" as const, conversionRate: 50, previousYear: null },
  { teamMemberKey: "other_non_dashboard", teamMemberName: "Other / reconciliation", memberClassification: "other_non_dashboard", year: 2026, month: 7, quotesDone: 1, ordersProcessed: 1, salesInboxEnquiries: null, converted: null, profit: 5, pkTax: null, snuggleProfit: null, mondaySourceMetadata: null, epccSourceMetadata: null, source: "monday" as const, conversionRate: 100, previousYear: null },
];

test("Team Members visibility includes only normal account managers", () => {
  assert.deepEqual(getVisibleTeamMembers(rows).map((row) => row.teamMemberKey), ["hardus"]);
  assert.deepEqual(normalDashboardMembers(rows).map((row) => row.teamMemberKey), ["hardus"]);
});

test("Team Members Snuggle values use the aggregated member month and preserve zero", () => {
  const snuggle: SnuggleProfitData = { months: [], members: [{ memberKey: "hardus", total: 12, months: [{ year: 2026, month: 7, total: 0 }] }], warnings: [], error: null };
  assert.equal(getMemberSnuggleProfit(snuggle, "hardus", 2026, 7), 0);
  assert.equal(getMemberSnuggleProfit(snuggle, "hardus", 2026, 6), null);
});

test("Team Members conversion rate safely handles missing and zero quotes", () => {
  assert.equal(calculateConversionRate(4, 0), 0);
  assert.equal(calculateConversionRate(null, null), 0);
});
