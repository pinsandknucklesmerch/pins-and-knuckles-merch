import assert from "node:assert/strict";
import test from "node:test";
import { generateSql, memberKey, parseMonth, parseNumber, parseYear, readWorkbook, resolveMember, validateImport, type CompanyRow, type MemberRow } from "../lib/salesKpiHistoryImport.ts";

const company: CompanyRow = { organisation_id: null, year: 2024, month: 1, monthly_profit: 100, quotes_done: 10, orders_processed: null, sales_inbox_enquiries: 8, converted: 4, data_source: "historical_fixture", notes: null };
const member: MemberRow = { organisation_id: null, year: 2024, month: 1, team_member_key: "catherine", team_member_name: "Catherine", quotes_done: null, orders_processed: null, sales_inbox_enquiries: 3, converted: 2, profit: 50, data_source: "historical_fixture" };

test("parses workbook month, year, and currency-like numeric values", () => {
  assert.equal(parseMonth(" July "), 7); assert.equal(parseMonth("mock"), null);
  assert.equal(parseYear("Total Profit 24"), 2024); assert.equal(parseYear("profit 19"), null);
  assert.equal(parseNumber("R 1,234.50"), 1234.5); assert.equal(parseNumber("nope"), null);
});

test("resolves exact names before aliases and aliases into canonical keys", () => {
  assert.deepEqual(resolveMember("Catherine", { knownMembers: ["Catherine"] }), { name: "Catherine", key: "catherine", resolved: true });
  assert.deepEqual(resolveMember("CAT", { knownMembers: ["Catherine"], aliases: { CAT: "Catherine" } }), { name: "Catherine", key: "catherine", resolved: true });
  assert.equal(memberKey("Hardus van Wyk"), "hardus-van-wyk");
});

test("maps the workbook company and member source rows without importing derived rates", async () => {
  const workbook = await readWorkbook("docs/Monthly Compare.xlsx", { memberYear: 2024, knownMembers: ["Hardus", "Bux", "Bernie", "Catherine", "Johan"], aliases: { CAT: "Catherine" } });
  assert.equal(workbook.company.length, 59); assert.equal(workbook.members.length, 54);
  assert.deepEqual(workbook.company.find((row) => row.year === 2024 && row.month === 1), { ...company, monthly_profit: 109605, quotes_done: 341, sales_inbox_enquiries: 103, converted: 48 });
  assert.deepEqual(workbook.members.find((row) => row.month === 1 && row.team_member_key === "catherine"), { ...member, team_member_name: "Catherine", sales_inbox_enquiries: 29, converted: 11, profit: 5014 });
});

test("detects duplicate and unresolved rows as blocking validation failures", () => {
  const report = validateImport({ company: [company, { ...company, monthly_profit: 101 }], members: [member], unresolvedMembers: [{ name: "Unknown", key: "unknown", year: 2024, month: 1 }] });
  assert.equal(report.validCompanyRows.length, 0); assert.ok(report.errors.some((issue) => issue.code === "CONFLICTING_DUPLICATE")); assert.ok(report.errors.some((issue) => issue.code === "UNRESOLVED_MEMBER"));
});

test("plans existing rows safely and generates deterministic conflict-safe SQL", () => {
  const report = validateImport({ company: [company], members: [member], existing: { company: [company], members: [] }, policy: "skip-existing" });
  assert.equal(report.companyPlan["global:2024:1"], "skip-existing"); assert.equal(report.memberPlan["global:2024:1:catherine"], "insert");
  const sql = generateSql([company], [member], "skip-existing");
  assert.match(sql, /ON CONFLICT \(organisation_id, year, month\) DO NOTHING/); assert.match(sql, /sales_kpi_member_months/);
});

test("validation is local-only and does not expose a remote write operation", () => {
  const report = validateImport({ company: [company], members: [member] });
  assert.equal(report.errors.length, 0); assert.equal(report.companyPlan["global:2024:1"], "unknown-existing");
});
