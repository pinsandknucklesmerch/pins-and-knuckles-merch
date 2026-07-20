import assert from "node:assert/strict";
import test from "node:test";
import { historicalSalesDashboardFixture } from "../data/workbookFixture.ts";
import { buildDashboardData, getFixtureCompanyMonth, mergeCompanyMonth } from "../data/mappers.ts";
import {
  calculateCompanyMetrics,
  calculateConversionRate,
  calculatePreviousDifference,
  calculatePreviousPercentageChange,
  calculateTargetProgress,
  isTargetReached,
} from "../domain/calculateDashboardKpis.ts";
import { DEFAULT_SALES_KPI_TARGETS, type CompanyKpiMonth } from "../domain/types.ts";
import { normaliseTeamMemberKey, normaliseTeamMemberName, sortTeamMembers } from "../domain/normaliseTeamMember.ts";

const current: CompanyKpiMonth = { year: 2025, month: 10, monthlyProfit: 155000, quotesDone: 300, ordersProcessed: 200, salesInboxEnquiries: 100, converted: 65, notes: null, source: "manual" };

test("conversion rate uses converted divided by sales inbox enquiries", () => assert.equal(calculateConversionRate(13, 20), 65));
test("conversion rate returns zero for zero enquiries", () => assert.equal(calculateConversionRate(5, 0), 0));
test("calculates profit target progress", () => assert.equal(calculateTargetProgress(77500, 155000), 50));
test("calculates quotes target progress", () => assert.equal(calculateTargetProgress(150, 300), 50));
test("calculates orders target progress", () => assert.equal(calculateTargetProgress(100, 200), 50));
test("calculates conversion target progress", () => assert.equal(calculateTargetProgress(32.5, 65), 50));
test("calculates previous-year increase", () => { assert.equal(calculatePreviousDifference(120, 100), 20); assert.equal(calculatePreviousPercentageChange(120, 100), 20); });
test("calculates previous-year decrease", () => { assert.equal(calculatePreviousDifference(80, 100), -20); assert.equal(calculatePreviousPercentageChange(80, 100), -20); });
test("previous-year percentage is null when previous value is zero", () => assert.equal(calculatePreviousPercentageChange(10, 0), null));
test("missing values remain missing", () => { assert.equal(calculateTargetProgress(null, 100), null); assert.equal(calculatePreviousDifference(null, 10), null); });
test("historical fixture supplies a missing database month", () => { const fixture = getFixtureCompanyMonth(historicalSalesDashboardFixture, 2025, 10); assert.equal(mergeCompanyMonth(null, fixture).monthlyProfit, 364197); assert.equal(fixture.salesInboxEnquiries, 69); });
test("Supabase month overrides the historical fixture", () => { const fixture = getFixtureCompanyMonth(historicalSalesDashboardFixture, 2025, 10); assert.equal(mergeCompanyMonth(current, fixture), current); });
test("normalises inconsistent team-member casing and keys", () => { assert.equal(normaliseTeamMemberName("  cAtHerine  smith "), "Catherine Smith"); assert.equal(normaliseTeamMemberKey(" Catherine  Smith "), "catherine-smith"); });
test("sorts team members case-insensitively", () => assert.deepEqual(sortTeamMembers([{ teamMemberName: "zed", teamMemberKey: "zed" }, { teamMemberName: "Amy", teamMemberKey: "amy" }]).map((row) => row.teamMemberKey), ["amy", "zed"]));
test("target reached supports values at and above target", () => { assert.equal(isTargetReached(65, 65), true); assert.equal(isTargetReached(66, 65), true); assert.equal(isTargetReached(64, 65), false); });
test("company metrics expose all five definitions and seeded targets", () => { const metrics = calculateCompanyMetrics(current, null, DEFAULT_SALES_KPI_TARGETS); assert.deepEqual(metrics.map((item) => item.label), ["Monthly Profit", "Quotes Done", "Orders Processed", "Sales Inbox Enquiries", "Conversion Rate"]); assert.equal(metrics[4].value, 65); });
test("dashboard builder merges fixture members and previous year", () => { const result = buildDashboardData({ companyRow: null, previousCompanyRow: null, memberRows: [], previousMemberRows: [], fixture: historicalSalesDashboardFixture, year: 2024, month: 1, targets: DEFAULT_SALES_KPI_TARGETS, availableYears: [2024] }); assert.equal(result.members.length, 5); assert.equal(result.members[0].source, "historical_fixture"); });
