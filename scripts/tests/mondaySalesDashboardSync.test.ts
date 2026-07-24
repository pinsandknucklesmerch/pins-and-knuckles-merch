import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

import { mondaySalesWritePayload, syncMondaySalesDashboard } from "../lib/monday/salesDashboardSync.ts";
import { parseArgs } from "../sync-monday-sales-dashboard.ts";

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
const items = [
  { id: "lead-1", name: "Inbox lead", group: { id: "week", title: "WEEK 1" }, column_values: [{ id: "people", text: "Alice", value: '{"personsAndTeams":[{"id":7,"kind":"person"}]}' }, { id: "status_16", text: "Sales Inbox" }, { id: "status", text: "Yes" }, { id: "date8", text: "2026-07-01" }] },
  { id: "lead-2", name: "Other lead", group: { id: "week", title: "WEEK 1" }, column_values: [{ id: "people", text: "Alice", value: '{"personsAndTeams":[{"id":7,"kind":"person"}]}' }, { id: "status_16", text: "Referral" }, { id: "status", text: "No" }, { id: "date8", text: "2026-07-02" }] },
];
const base = { year: 2026, months: [7], organisationId: null, boards: [board()], inspectBoard: async (id: string) => id === "board-1" ? board() : undefined, existingMonths: new Set<number>(), collectItems: async () => ({ items }), now: new Date("2026-07-21T00:00:00Z"), force: false, fetchedAt: "2026-07-21T10:00:00Z" };

test("dry-run plans a current-month insert and preserves audit metadata", async () => {
  const outcomes = await syncMondaySalesDashboard({ ...base, apply: false });
  assert.equal(outcomes[0].status, "planned-insert");
  assert.equal(outcomes[0].snapshot?.monday_sync_metadata.profitTracking.calculatedMonthlyTotal, null);
  assert.deepEqual(outcomes[0].profitPreview, { sourceBoardId: "board-1", resolvedProfitColumnId: null, includedRows: [], excludedRows: [], calculatedMonthlyTotal: null, fetchedAt: "2026-07-21T10:00:00Z", source: "epcc_email", willWrite: false, reason: "Monday profit skipped at the configured EPCC cutoff." });
  assert.equal(outcomes[0].snapshot?.monthly_profit, undefined);
  assert.equal(outcomes[0].snapshot?.monthly_profit_source, undefined);
  assert.deepEqual([outcomes[0].snapshot?.quotes_done, outcomes[0].snapshot?.orders_processed], [2, 1]);
  assert.deepEqual(outcomes[0].snapshot?.monday_sync_metadata.scopeA, { leads: 2, converted: 1, conversionRate: 50 });
  assert.deepEqual([outcomes[0].snapshot?.sales_inbox_enquiries, outcomes[0].snapshot?.converted], [1, 1]);
});

test("forced January through June syncs Monday profit without changing lead or conversion fields", async () => {
  const juneBoard = { ...board("JUNE 2026"), groups: [{ id: "week", title: "WEEK 1" }, { id: "profit", title: "Profit Tracking" }], columns: [...board().columns, { id: "profit_value", title: "Profit", type: "numbers" }] };
  const juneItems = [...items, { id: "profit-1", name: "Week 1", group: { id: "profit", title: "Profit Tracking" }, column_values: [{ id: "profit_value", text: "1234.56", value: "1234.56" }] }];
  const outcome = (await syncMondaySalesDashboard({ ...base, months: [6], boards: [juneBoard], inspectBoard: async () => juneBoard, collectItems: async () => ({ items: juneItems }), apply: false, force: true }))[0];
  assert.equal(outcome.snapshot?.monthly_profit, 1234.56);
  assert.equal(outcome.snapshot?.monthly_profit_source, "monday");
  assert.deepEqual([outcome.snapshot?.quotes_done, outcome.snapshot?.orders_processed, outcome.snapshot?.sales_inbox_enquiries, outcome.snapshot?.converted], [2, 1, 1, 1]);
  assert.equal(outcome.profitPreview?.willWrite, true);
});

test("missing Profit Tracking creates a metrics patch that preserves existing profit and source", async () => {
  const outcome = (await syncMondaySalesDashboard({ ...base, year: 2025, months: [1], boards: [board("JANUARY 2025")], inspectBoard: async () => board("JANUARY 2025"), now: new Date("2026-07-21T00:00:00Z"), force: true, apply: false }))[0];
  const payload = mondaySalesWritePayload(outcome.snapshot!);
  assert.equal("monthly_profit" in payload, false);
  assert.equal("monthly_profit_source" in payload, false);
  assert.deepEqual([payload.quotes_done, payload.orders_processed, payload.sales_inbox_enquiries, payload.converted], [2, 1, 1, 1]);
});

test("valid Profit Tracking includes both profit fields in the metrics patch", async () => {
  const juneBoard = { ...board("JUNE 2025"), groups: [{ id: "week", title: "WEEK 1" }, { id: "profit", title: "Profit Tracking" }], columns: [...board().columns, { id: "profit_value", title: "Profit", type: "numbers" }] };
  const juneItems = [...items, { id: "profit-1", name: "Week 1", group: { id: "profit", title: "Profit Tracking" }, column_values: [{ id: "profit_value", text: "1234.56", value: "1234.56" }] }];
  const outcome = (await syncMondaySalesDashboard({ ...base, year: 2025, months: [6], boards: [juneBoard], inspectBoard: async () => juneBoard, collectItems: async () => ({ items: juneItems }), now: new Date("2026-07-21T00:00:00Z"), force: true, apply: false }))[0];
  const payload = mondaySalesWritePayload(outcome.snapshot!);
  assert.deepEqual([payload.monthly_profit, payload.monthly_profit_source], [1234.56, "monday"]);
  assert.deepEqual([payload.quotes_done, payload.orders_processed, payload.sales_inbox_enquiries, payload.converted], [2, 1, 1, 1]);
});

test("January through July previews use the confirmed Scope A KPI mapping", async () => {
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY"];
  const boards = monthNames.map((name, index) => board(`${name} 2026`, `board-${index + 1}`));
  const outcomes = await syncMondaySalesDashboard({
    ...base,
    months: monthNames.map((_, index) => index + 1),
    boards,
    inspectBoard: async (id) => boards.find((candidate) => candidate.id === id),
    apply: false,
    force: true,
  });
  assert.deepEqual(outcomes.map((outcome) => outcome.status), Array(7).fill("planned-insert"));
  assert.deepEqual(outcomes.map((outcome) => [outcome.snapshot?.quotes_done, outcome.snapshot?.orders_processed]), Array(7).fill([2, 1]));
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

test("future months are reported without writes and invalid boards are rejected", async () => {
  const future = await syncMondaySalesDashboard({ ...base, months: [8], boards: [board("AUGUST 2026")], inspectBoard: async () => board("AUGUST 2026"), apply: true });
  assert.deepEqual(future[0], { month: 8, status: "future", reason: "Future month; no board expected." });
  const invalid = await syncMondaySalesDashboard({ ...base, boards: [{ ...board(), columns: [] }], inspectBoard: async () => ({ ...board(), columns: [] }), apply: false });
  assert.equal(invalid[0].status, "rejected");
});

test("July execution treats August through December as future rather than rejected", async () => {
  const outcomes = await syncMondaySalesDashboard({ ...base, months: [7, 8, 9, 10, 11, 12], apply: false });
  assert.equal(outcomes[0].status, "planned-insert");
  assert.deepEqual(outcomes.slice(1), [8, 9, 10, 11, 12].map((month) => ({ month, status: "future", reason: "Future month; no board expected." })));
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

test("2025 structures resolve semantic columns and include WEEK 5 without relying on 2026 IDs", async () => {
  const historicalBoard = {
    id: "2025-jan", name: "JANUARY 2025", state: "archived", board_kind: "public",
    groups: [1, 2, 3, 4, 5].map((week) => ({ id: `old-week-${week}`, title: `Week ${week}` })),
    columns: [
      { id: "old-owner", title: "Account Manager", type: "people" },
      { id: "old-source", title: "Lead Channel", type: "status", settings_str: '{"labels":{"1":"Sales Inbox"}}' },
      { id: "old-contacted", title: "Contact Date", type: "date" },
      { id: "old-won", title: "Conversion", type: "status", settings_str: '{"labels":{"1":"Yes"}}' },
    ],
  };
  const historicalItems = [{ id: "week-five", name: "Week five lead", group: { id: "old-week-5", title: "Week 5" }, column_values: [{ id: "old-owner", text: "Alice", value: '{"personsAndTeams":[{"id":7,"kind":"person"}]}' }, { id: "old-source", text: "Sales Inbox" }, { id: "old-contacted", text: "2025-01-31" }, { id: "old-won", text: "Yes" }] }];
  const outcome = (await syncMondaySalesDashboard({ ...base, year: 2025, months: [1], boards: [historicalBoard], inspectBoard: async () => historicalBoard, collectItems: async () => ({ items: historicalItems }), now: new Date("2026-07-21T00:00:00Z"), force: true, apply: false }))[0];
  assert.equal(outcome.status, "planned-insert");
  assert.deepEqual(outcome.audit?.resolvedWeeklyGroups, [1, 2, 3, 4, 5].map((week) => ({ id: `old-week-${week}`, title: `Week ${week}` })));
  assert.deepEqual(outcome.audit?.resolvedColumns, { people: "old-owner", channel: "old-source", dateInTouch: "old-contacted", converted: "old-won" });
  assert.deepEqual([outcome.snapshot?.quotes_done, outcome.snapshot?.orders_processed, outcome.snapshot?.sales_inbox_enquiries, outcome.snapshot?.converted], [1, 1, 1, 1]);
});

test("unsafe historical data remains previewable but cannot be applied", async () => {
  let writes = 0;
  const unsafeItems = [{ ...items[0], column_values: items[0].column_values.map((column) => column.id === "date8" ? { ...column, text: null } : column) }];
  const outcome = (await syncMondaySalesDashboard({ ...base, year: 2025, months: [1], boards: [board("JANUARY 2025")], inspectBoard: async () => board("JANUARY 2025"), collectItems: async () => ({ items: unsafeItems }), now: new Date("2026-07-21T00:00:00Z"), force: true, apply: true, write: async () => { writes += 1; } }))[0];
  assert.equal(outcome.status, "rejected");
  assert.equal(outcome.audit?.safety.safe, false);
  assert.match(outcome.reason ?? "", /Date In Touch/);
  assert.equal(writes, 0);
});

test("historical CLI apply requires the explicit 2025 month and force gate", () => {
  assert.throws(() => parseArgs(["--year", "2025", "--apply"]), /--month/);
  assert.throws(() => parseArgs(["--year", "2025", "--month", "1", "--apply"]), /--force/);
  assert.throws(() => parseArgs(["--year", "2026", "--month", "1", "--force", "--apply"]), /--year 2025/);
  assert.deepEqual(parseArgs(["--year", "2025", "--month", "1", "--force", "--apply"]).months, [1]);
});

test("the CLI imports under plain Node and keeps the Monday token out of client modules", async () => {
  const source = await readFile("scripts/sync-monday-sales-dashboard.ts", "utf8");
  assert.match(source, /process\.env\.MONDAY_API_TOKEN/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_MONDAY/);
  assert.doesNotMatch(source, /import "server-only"/);
  const result = await promisify(execFile)(process.execPath, ["--experimental-strip-types", "--input-type=module", "--eval", "await import('./scripts/sync-monday-sales-dashboard.ts')"], { cwd: process.cwd() });
  assert.equal(result.stderr, "");
});
