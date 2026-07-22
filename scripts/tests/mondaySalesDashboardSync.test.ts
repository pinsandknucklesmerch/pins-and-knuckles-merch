import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

import { syncMondaySalesDashboard } from "../lib/monday/salesDashboardSync.ts";

const board = (name = "JULY 2026", id = "board-1") => ({
  id, name, state: "active", board_kind: "public",
  groups: [{ id: "week", title: "WEEK 1" }],
  columns: [
    { id: "people", title: "Acc Manager", type: "people" },
    { id: "status_16", title: "Channel", type: "status", settings_str: '{"labels":{"1":"Sales Inbox"}}' },
    { id: "date8", title: "Date In Touch", type: "date" },
    { id: "status", title: "Converted", type: "status", settings_str: '{"labels":{"1":"Yes"}}' },
  ],
});
const items = [{ id: "lead-1", name: "Lead", group: { id: "week", title: "WEEK 1" }, column_values: [{ id: "people", text: "Alice", value: '{"personsAndTeams":[{"id":7,"kind":"person"}]}' }, { id: "status_16", text: "Sales Inbox" }, { id: "status", text: "Yes" }, { id: "date8", text: "2026-07-01" }] }];
const base = { year: 2026, months: [7], organisationId: null, boards: [board()], inspectBoard: async (id: string) => id === "board-1" ? board() : undefined, existingMonths: new Set<number>(), collectItems: async () => ({ items }), now: new Date("2026-07-21T00:00:00Z"), force: false, fetchedAt: "2026-07-21T10:00:00Z" };

test("dry-run plans a current-month insert and preserves audit metadata", async () => {
  const outcomes = await syncMondaySalesDashboard({ ...base, apply: false });
  assert.equal(outcomes[0].status, "planned-insert");
  assert.deepEqual(outcomes[0].snapshot?.monday_sync_metadata, { sourceBoardId: "board-1", fetchedAt: "2026-07-21T10:00:00Z", validation: { missingDateCount: 0, mismatchedDateCount: 0, validDateInTouchMonthCount: 1, multiManagerItemCount: 0, multiManagerConvertedCount: 0, excludedFromMemberMetricsCount: 0, blankAccountManagerItemCount: 0 }, mismatchedDates: [] });
  assert.deepEqual([outcomes[0].snapshot?.monday_scope_a_leads, outcomes[0].snapshot?.sales_inbox_enquiries, outcomes[0].snapshot?.converted], [1, 1, 1]);
});

test("apply refreshes the current month and reports updates", async () => {
  const writes: unknown[] = [];
  const outcomes = await syncMondaySalesDashboard({ ...base, apply: true, existingMonths: new Set([7]), write: async (snapshot) => { writes.push(snapshot); } });
  assert.equal(outcomes[0].status, "updated");
  assert.equal(writes.length, 1);
});

test("historical periods are protected unless forced", async () => {
  const historical = { ...base, month: undefined, months: [6], boards: [board("JUNE 2026")], inspectBoard: async () => board("JUNE 2026"), apply: true, now: new Date("2026-07-21T00:00:00Z") };
  assert.equal((await syncMondaySalesDashboard(historical))[0].status, "skipped");
  let writes = 0;
  assert.equal((await syncMondaySalesDashboard({ ...historical, force: true, write: async () => { writes += 1; } }))[0].status, "inserted");
  assert.equal(writes, 1);
});

test("future and invalid boards are rejected without writes", async () => {
  const future = await syncMondaySalesDashboard({ ...base, months: [8], boards: [board("AUGUST 2026")], inspectBoard: async () => board("AUGUST 2026"), apply: true });
  assert.equal(future[0].status, "rejected");
  const invalid = await syncMondaySalesDashboard({ ...base, boards: [{ ...board(), columns: [] }], inspectBoard: async () => ({ ...board(), columns: [] }), apply: false });
  assert.equal(invalid[0].status, "rejected");
});

test("one failed month does not prevent a year preview from reporting later months", async () => {
  const outcomes = await syncMondaySalesDashboard({ ...base, months: [6, 7], boards: [board("JUNE 2026", "board-6"), board()], inspectBoard: async (id) => id === "board-6" ? board("JUNE 2026", "board-6") : board(), apply: false, force: true, collectItems: async (id) => { if (id === "board-1") throw new Error("unavailable"); return { items }; } });
  assert.deepEqual(outcomes.map(({ status }) => status), ["planned-insert", "rejected"]);
});

test("uses the canonical July duplicate decision and reports selected/rejected IDs", async () => {
  const july = { ...board("JULY 2026", "18420001220"), groups: [{ id: "week-1", title: "WEEK 1" }, { id: "week-2", title: "WEEK 2" }, { id: "week-3", title: "WEEK 3" }, { id: "week-4", title: "WEEK 4" }, { id: "profit", title: "Profit Tracking" }] };
  const alternate = { ...board("July 2026", "18419121579"), groups: [{ id: "sales", title: "July Sales" }] };
  const accepted = await syncMondaySalesDashboard({ ...base, boards: [july, alternate], inspectBoard: async (id) => id === "18420001220" ? july : alternate, apply: false });
  assert.equal(accepted[0].status, "planned-insert");
  assert.deepEqual(accepted[0].boardSelection, { selectedBoardId: "18420001220", rejectedBoardIds: ["18419121579"] });
  const rejected = await syncMondaySalesDashboard({ ...base, boards: [alternate], inspectBoard: async () => alternate, apply: false });
  assert.equal(rejected[0].status, "rejected");
  assert.match(rejected[0].reason ?? "", /NO_WEEK_GROUP/);
});

test("the CLI imports under plain Node and keeps the Monday token out of client modules", async () => {
  const source = await readFile("scripts/sync-monday-sales-dashboard.ts", "utf8");
  assert.match(source, /process\.env\.MONDAY_API_TOKEN/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_MONDAY/);
  assert.doesNotMatch(source, /import "server-only"/);
  const result = await promisify(execFile)(process.execPath, ["--experimental-strip-types", "--input-type=module", "--eval", "await import('./scripts/sync-monday-sales-dashboard.ts')"], { cwd: process.cwd() });
  assert.equal(result.stderr, "");
});
