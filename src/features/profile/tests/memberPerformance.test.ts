import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getMemberKpiMetrics } from "../../sales-dashboard/domain/memberKpis.ts";

test("Profile reuses the shared member KPI presentation and owns local period state", () => {
  const section = readFileSync(new URL("../components/ProfilePerformanceSection.tsx", import.meta.url), "utf8");
  assert.match(section, /MemberKpiCards/);
  assert.match(section, /MemberKpiHistoryTable/);
  assert.match(section, /useState/);
  assert.doesNotMatch(section, /localStorage|sessionStorage/);
  assert.deepEqual(getMemberKpiMetrics({ year: 2026, month: 7, memberKey: "hardus", memberName: "Hardus", profit: null, quotesDone: null, ordersProcessed: null, conversionRate: null }).map((metric) => metric.label), ["Profit", "Quotes Done", "Orders Processed", "Conversion Rate"]);
});

test("Profile resolves its own identity server-side and does not accept a client member key", () => {
  const source = readFileSync(new URL("../data/memberPerformance.ts", import.meta.url), "utf8");
  assert.match(source, /eq\("user_id", access\.user\.id\)/);
  assert.match(source, /membership\.monday_member_id/);
  assert.doesNotMatch(source, /memberKey.*formData|searchParams.*member/);
});

test("admin profile viewing verifies admin access, organisation, and owner protection", () => {
  const source = readFileSync(new URL("../data/memberPerformance.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../../../app/(hub)/hub/team/[membershipId]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /access\.access\?\.access_level !== "admin"/);
  assert.match(source, /eq\("organisation_id", access\.membership\.organisation_id\)/);
  assert.match(source, /membership\.role === "owner"/);
  assert.match(route, /getAdminProfilePerformance/);
  assert.doesNotMatch(route, /monday\.com|MondayClient|fetch\(/);
});

test("User Access Management exposes a protected performance-view action", () => {
  const table = readFileSync(new URL("../../team/components/TeamMembersTable.tsx", import.meta.url), "utf8");
  assert.match(table, /View performance/);
  assert.match(table, /!member\.isOwner && member\.userId !== currentUserId/);
});

test("unlinked users receive the exact compact state without KPI cards or history", () => {
  const section = readFileSync(new URL("../components/ProfilePerformanceSection.tsx", import.meta.url), "utf8");
  assert.match(section, /Monday account not linked/);
  assert.match(section, /if \(!performance\)/);
  assert.ok(section.indexOf("Monday account not linked") < section.indexOf("<MemberKpiCards"));
});
