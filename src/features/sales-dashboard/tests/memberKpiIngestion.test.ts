import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { mapEpccMember, mapMondayMember } from "../domain/memberIdentity.ts";
import { adminVisibleMembers, normalDashboardMembers, reconciliationMembers } from "../domain/memberVisibility.ts";
import { parseEpccProfitEmail } from "../lib/epccProfitEmail.ts";
import { buildEpccMemberSnapshots, epccMemberWritePayload, reconcileEpccMemberTotals, runEpccProfitIngestion } from "../server/epccProfitImporter.ts";
import { mondayMemberWritePayload } from "../../../../scripts/lib/monday/salesDashboardSync.ts";
import { summarizeMonthlySalesBoard } from "../../../../scripts/lib/monday/salesHistoryAudit.ts";

const epccFixture = () => readFile("scripts/tests/fixtures/epcc-member-profit-report.eml", "utf8");

const board = {
  id: "18420001220", name: "JULY 2026", state: "active", board_kind: "public",
  groups: [{ id: "week-1", title: "WEEK 1" }],
  columns: [
    { id: "people", title: "Acc Manager", type: "people" },
    { id: "status_16", title: "Channel", type: "status", settings_str: '{"labels":{"1":"Sales Inbox"}}' },
    { id: "date8", title: "Date In Touch", type: "date" },
    { id: "status", title: "Converted", type: "status", settings_str: '{"labels":{"1":"Yes"}}' },
  ],
};

function mondayItems(name: string, id: number, count: number, converted: number, offset = 0) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${name}-${index + offset}`, name: "Redacted", group: { id: "week-1", title: "WEEK 1" },
    column_values: [
      { id: "people", text: name, value: JSON.stringify({ personsAndTeams: [{ id, kind: "person" }] }) },
      { id: "status_16", text: "sales inbox" }, { id: "date8", text: "2026-07-01" },
      { id: "status", text: index < converted ? "Yes" : "No" },
    ],
  }));
}

const julyItems = [
  ...mondayItems("hardus", 29869326, 37, 23),
  ...mondayItems("Justin du Preez", 69507598, 109, 55),
  ...mondayItems("Bux", 26816626, 49, 30),
  ...mondayItems("Johan", 14589471, 93, 62),
  ...mondayItems("Anthony Strauss", 15773637, 7, 6),
  ...mondayItems("Catherine Strauss", 26567721, 1, 0),
];

function member(rows: ReturnType<typeof summarizeMonthlySalesBoard>["memberKpiRows"], key: string) {
  const result = rows.find((row) => row.teamMemberKey === key);
  assert.ok(result, `Expected ${key} member row`);
  return result;
}

test("central mapping uses Monday IDs first and EPCC name variants without exposing Seth", () => {
  assert.equal(mapMondayMember({ id: "29869326", name: "Wrong fallback" }).key, "hardus");
  assert.equal(mapMondayMember({ name: "JUSTIN DU PREEZ" }).key, "justin");
  assert.equal(mapEpccMember("Justin Du Preez").key, "justin");
  assert.equal(mapEpccMember("bUx").key, "bux");
  assert.equal(mapEpccMember("Shannon Wellby").classification, "admin_hidden");
  assert.equal(mapMondayMember({ name: "Johan" }).classification, "admin_hidden");
  assert.deepEqual(mapEpccMember("Seth"), { key: "other_non_dashboard", displayName: "Other / reconciliation", classification: "other_non_dashboard" });
});

test("July Monday member fixture produces the audited named totals and keeps other people reconcilable", () => {
  const summary = summarizeMonthlySalesBoard(board, julyItems);
  assert.equal(summary.fetch.includedWeeklyItems, 296);
  assert.deepEqual([member(summary.memberKpiRows, "hardus").quotesDone, member(summary.memberKpiRows, "hardus").ordersProcessed], [37, 23]);
  assert.deepEqual([member(summary.memberKpiRows, "justin").quotesDone, member(summary.memberKpiRows, "justin").ordersProcessed], [109, 55]);
  assert.deepEqual([member(summary.memberKpiRows, "bux").quotesDone, member(summary.memberKpiRows, "bux").ordersProcessed], [49, 30]);
  assert.deepEqual([member(summary.memberKpiRows, "johan").quotesDone, member(summary.memberKpiRows, "johan").ordersProcessed], [93, 62]);
  const other = member(summary.memberKpiRows, "other_non_dashboard");
  assert.deepEqual([other.quotesDone, other.ordersProcessed, other.unmappedItemCount], [8, 6, 8]);
  assert.equal(summary.memberKpiRows.some((row) => row.teamMemberKey === "seth" || row.teamMemberName === "Seth"), false);
});

test("unknown, deleted, blank, and multi-assignee Monday rows remain one reconciliation total without double-counting", () => {
  const unknown = mondayItems("Deleted member", 23738460, 1, 1)[0];
  const blank = { ...unknown, id: "blank", column_values: unknown.column_values.map((column) => column.id === "people" ? { id: "people", text: "", value: "" } : column) };
  const multi = { ...unknown, id: "multi", column_values: unknown.column_values.map((column) => column.id === "people" ? { id: "people", text: "Hardus, Bux", value: JSON.stringify({ personsAndTeams: [{ id: 29869326, kind: "person" }, { id: 26816626, kind: "person" }] }) } : column) };
  const summary = summarizeMonthlySalesBoard(board, [unknown, blank, multi]);
  const other = member(summary.memberKpiRows, "other_non_dashboard");
  assert.deepEqual([other.quotesDone, other.ordersProcessed, other.unmappedItemCount, other.unassignedItemCount, other.multiAssigneeItemCount], [3, 3, 1, 1, 1]);
  assert.equal(summary.memberKpiRows.some((row) => row.teamMemberKey === "hardus" || row.teamMemberKey === "bux"), false);
});

test("source-isolated partial updates preserve the other source and Snuggle fields across idempotent reruns", async () => {
  const monday = member(summarizeMonthlySalesBoard(board, mondayItems("hardus", 29869326, 1, 1)).memberKpiRows, "hardus");
  const report = parseEpccProfitEmail(await epccFixture());
  const epcc = buildEpccMemberSnapshots(report).find((row) => row.team_member_key === "hardus");
  assert.ok(epcc);
  const stored = { quotes_done: 0, orders_processed: 0, profit: 10, pk_tax: 2, snuggle_profit: 99, monday_source_metadata: null, epcc_source_metadata: null };
  Object.assign(stored, mondayMemberWritePayload({ organisation_id: null, year: 2026, month: 7, team_member_key: "hardus", team_member_name: "Hardus", member_classification: "dashboard_account_manager", quotes_done: monday.quotesDone, orders_processed: monday.ordersProcessed, monday_source_metadata: { sourceBoardId: "18420001220", reportingPeriod: { year: 2026, month: 7 }, includedItemCount: 1, dateInTouchCount: 1, createdAtFallbackCount: 0, excludedItemCount: 0, multiAssigneeItemCount: 0, unassignedItemCount: 0, unmappedItemCount: 0, sourcePeople: [{ id: "29869326", name: "hardus" }] } }));
  Object.assign(stored, mondayMemberWritePayload({ organisation_id: null, year: 2026, month: 7, team_member_key: "hardus", team_member_name: "Hardus", member_classification: "dashboard_account_manager", quotes_done: monday.quotesDone, orders_processed: monday.ordersProcessed, monday_source_metadata: { sourceBoardId: "18420001220", reportingPeriod: { year: 2026, month: 7 }, includedItemCount: 1, dateInTouchCount: 1, createdAtFallbackCount: 0, excludedItemCount: 0, multiAssigneeItemCount: 0, unassignedItemCount: 0, unmappedItemCount: 0, sourcePeople: [{ id: "29869326", name: "hardus" }] } }));
  assert.deepEqual([stored.quotes_done, stored.orders_processed, stored.profit, stored.pk_tax, stored.snuggle_profit], [1, 1, 10, 2, 99]);
  Object.assign(stored, epccMemberWritePayload(epcc));
  Object.assign(stored, epccMemberWritePayload(epcc));
  assert.deepEqual([stored.quotes_done, stored.orders_processed, stored.profit, stored.pk_tax, stored.snuggle_profit], [1, 1, 23113.92, 972, 99]);
});

test("latest EPCC fixture maps audited member totals, reconciles, and keeps Seth in the anonymous bucket", async () => {
  const report = parseEpccProfitEmail(await epccFixture());
  const reconciliation = reconcileEpccMemberTotals(report);
  assert.deepEqual(reconciliation, { ok: true, calculatedTotals: { profit: 136730.12, pkTax: 4935.3 }, differences: { profit: 0, pkTax: 0 } });
  const rows = buildEpccMemberSnapshots(report, reconciliation);
  assert.deepEqual([rows.find((row) => row.team_member_key === "hardus")?.profit, rows.find((row) => row.team_member_key === "justin")?.pk_tax, rows.find((row) => row.team_member_key === "bux")?.profit], [23113.92, 1172.7, 22785.97]);
  assert.deepEqual([rows.find((row) => row.team_member_key === "shannon")?.member_classification, rows.find((row) => row.team_member_key === "johan")?.member_classification], ["admin_hidden", "admin_hidden"]);
  assert.deepEqual(rows.find((row) => row.team_member_key === "other_non_dashboard")?.epcc_source_metadata.sourceDisplayedNames, ["Seth"]);
  assert.equal(rows.some((row) => row.team_member_key === "seth" || row.team_member_name === "Seth"), false);
});

test("an EPCC reconciliation mismatch blocks member rows while retaining company-level ingestion behaviour", async () => {
  const raw = (await epccFixture()).replace("136,730.12 4,935.30", "136,000.00 4,935.30");
  let writtenRows = -1;
  const result = await runEpccProfitIngestion({ apply: true }, {
    gmail: { findMessages: async () => [{ id: "mismatch", receivedAt: "2026-07-31T08:00:00.000Z", raw }] },
    store: { ingest: async (_report, rows) => { writtenRows = rows.length; return "applied"; } },
  });
  assert.equal(result.memberOutcome, "rejected");
  assert.equal(result.memberReconciliation.ok, false);
  assert.equal(writtenRows, 0);
});

test("a duplicate EPCC report backfills only missing source-isolated member fields and is idempotent", async () => {
  const raw = await epccFixture();
  const company = { monthlyProfit: 136730.12, ingestions: 1 };
  const members = new Map<string, Record<string, unknown>>([
    ["hardus", { quotes_done: 37, orders_processed: 23, snuggle_profit: 99 }],
  ]);
  const store = {
    async ingest(_report: unknown, snapshots: ReturnType<typeof buildEpccMemberSnapshots>) {
      if (!snapshots.length) return "duplicate_member_backfill_rejected" as const;
      const required = snapshots.some((snapshot) => !members.get(snapshot.team_member_key)?.epcc_source_metadata);
      if (!required) return "duplicate_member_backfill_not_needed" as const;
      for (const snapshot of snapshots) {
        const current = members.get(snapshot.team_member_key) ?? {};
        if (!current.epcc_source_metadata) {
          Object.assign(current, epccMemberWritePayload(snapshot));
          members.set(snapshot.team_member_key, current);
        }
      }
      return "duplicate_member_backfill_applied" as const;
    },
  };
  const dependencies = {
    gmail: { findMessages: async () => [{ id: "duplicate-member-backfill", receivedAt: "2026-07-31T08:00:00.000Z", raw }] },
    store,
  };

  const first = await runEpccProfitIngestion({ apply: true }, dependencies);
  const second = await runEpccProfitIngestion({ apply: true }, dependencies);
  const hardus = members.get("hardus")!;

  assert.equal(first.outcome, "duplicate_member_backfill_applied");
  assert.equal(second.outcome, "duplicate_member_backfill_not_needed");
  assert.equal(company.ingestions, 1);
  assert.equal(company.monthlyProfit, 136730.12);
  assert.deepEqual([hardus.quotes_done, hardus.orders_processed, hardus.snuggle_profit], [37, 23, 99]);
  assert.equal((hardus.epcc_source_metadata as { sourceHash: string }).sourceHash, first.report.sourceHash);
});

test("a duplicate EPCC reconciliation mismatch remains rejected before any member backfill", async () => {
  const raw = (await epccFixture()).replace("136,730.12 4,935.30", "136,000.00 4,935.30");
  let rowsPassed = -1;
  const result = await runEpccProfitIngestion({ apply: true }, {
    gmail: { findMessages: async () => [{ id: "duplicate-mismatch", receivedAt: "2026-07-31T08:00:00.000Z", raw }] },
    store: { ingest: async (_report, rows) => { rowsPassed = rows.length; return "duplicate_member_backfill_rejected"; } },
  });
  assert.equal(result.outcome, "duplicate_member_backfill_rejected");
  assert.equal(result.memberOutcome, "rejected");
  assert.equal(rowsPassed, 0);
});

test("the EPCC duplicate migration only patches missing matching-source member rows", async () => {
  const migration = await readFile("supabase/migrations/20260731110000_backfill_epcc_members_and_grant_monday_member_sync.sql", "utf8");
  assert.match(migration, /duplicate_member_backfill_applied/);
  assert.match(migration, /duplicate_member_backfill_not_needed/);
  assert.match(migration, /duplicate_member_backfill_rejected/);
  assert.match(migration, /duplicate_source_hash <> p_source_hash/);
  assert.match(migration, /coalesce\(public\.sales_kpi_member_months\.epcc_source_metadata->>'sourceHash', ''\) <> p_source_hash/);
  assert.doesNotMatch(migration.slice(migration.indexOf("if ingestion_id is null"), migration.indexOf("select max(received_at)")), /sales_kpi_months \(organisation_id/);
});

test("visibility helpers expose exactly the approved normal and administrative sets", () => {
  const rows = [
    { teamMemberKey: "hardus", memberClassification: "dashboard_account_manager" as const },
    { teamMemberKey: "justin", memberClassification: "dashboard_account_manager" as const },
    { teamMemberKey: "bux", memberClassification: "dashboard_account_manager" as const },
    { teamMemberKey: "shannon", memberClassification: "admin_hidden" as const },
    { teamMemberKey: "johan", memberClassification: "admin_hidden" as const },
    { teamMemberKey: "other_non_dashboard", memberClassification: "other_non_dashboard" as const },
  ];
  assert.deepEqual(normalDashboardMembers(rows).map((row) => row.teamMemberKey), ["hardus", "justin", "bux"]);
  assert.deepEqual(adminVisibleMembers(rows).map((row) => row.teamMemberKey), ["hardus", "justin", "bux", "shannon", "johan", "other_non_dashboard"]);
  assert.deepEqual(reconciliationMembers(rows).map((row) => row.teamMemberKey), ["other_non_dashboard"]);
});
