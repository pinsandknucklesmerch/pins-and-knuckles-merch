import assert from "node:assert/strict";
import test from "node:test";

import { createMondaySalesSyncCronHandler } from "../server/mondaySalesCronHandler.ts";
import { mondaySalesWritePayload } from "../../../../scripts/lib/monday/salesDashboardSync.ts";
import { runMondaySalesCron, type MondayCronStore } from "../server/mondaySalesCron.ts";

const board = {
  id: "board-7", name: "JULY 2026", state: "active", board_kind: "public",
  groups: [{ id: "week", title: "WEEK 1" }],
  columns: [
    { id: "people", title: "Acc Manager", type: "people" },
    { id: "status_16", title: "Channel", type: "status", settings_str: '{"labels":{"1":"Sales Inbox"}}' },
    { id: "date8", title: "Date In Touch", type: "date" },
    { id: "status", title: "Converted", type: "status", settings_str: '{"labels":{"1":"Yes"}}' },
  ],
};
const item = (date = "2026-07-28") => ({ id: "lead", name: "Lead", group: { id: "week", title: "WEEK 1" }, created_at: "2026-07-28T10:00:00Z", column_values: [{ id: "people", text: "Alice", value: '{"personsAndTeams":[{"id":7,"kind":"person"}]}' }, { id: "status_16", text: "Sales Inbox" }, { id: "status", text: "Yes" }, { id: "date8", text: date }] });

function dependencies(existing: { quotes_done: number | null; orders_processed: number | null } | null = null, acquire = true, items = [item()]) {
  const writes: unknown[] = [];
  const store: MondayCronStore = {
    acquireLock: async () => acquire,
    releaseLock: async () => {},
    readMonth: async () => existing,
    write: async (snapshot) => { writes.push(snapshot); },
    writeMembers: async () => {},
  };
  return { store, writes, monday: { listAllBoards: async () => [board], inspectBoard: async () => board, collectItems: async () => ({ items, cursor: null, truncated: false }) } };
}

test("Monday cron rejects unauthorised calls and valid auth reaches the sync handler", async () => {
  let calls = 0;
  const handler = createMondaySalesSyncCronHandler(async () => { calls += 1; return { outcome: "unchanged", year: 2026, month: 7, quotesDone: 249, ordersProcessed: 141, changed: false }; }, (request) => request.headers.get("authorization") === "Bearer test-secret");
  assert.equal((await handler(new Request("https://example.test/api/cron/monday-sales-sync"))).status, 401);
  const response = await handler(new Request("https://example.test/api/cron/monday-sales-sync?year=2025&month=1", { headers: { authorization: "Bearer test-secret" } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { outcome: "unchanged", year: 2026, month: 7, quotesDone: 249, ordersProcessed: 141, changed: false });
  assert.equal(calls, 1);
});

test("Monday cron scopes itself to the UTC current month and skips overlapping runs", async () => {
  const deps = dependencies(null, false);
  const result = await runMondaySalesCron({ ...deps, now: new Date("2026-07-28T10:15:00Z") });
  assert.deepEqual(result, { outcome: "already-running", year: 2026, month: 7, quotesDone: null, ordersProcessed: null, changed: false });
  assert.equal(deps.writes.length, 0);
});

test("July cron payload isolates EPCC profit and unchanged reruns are idempotent", async () => {
  const deps = dependencies({ quotes_done: 0, orders_processed: 0 });
  const first = await runMondaySalesCron({ ...deps, now: new Date("2026-07-28T10:15:00Z") });
  const payload = mondaySalesWritePayload(deps.writes[0] as never);
  assert.deepEqual(first, { outcome: "updated", year: 2026, month: 7, quotesDone: 1, ordersProcessed: 1, changed: true });
  assert.equal("monthly_profit" in payload, false);
  assert.equal("monthly_profit_source" in payload, false);
  assert.deepEqual((deps.writes[0] as { monday_sync_metadata: { reportingPeriod: unknown; quotesDone: unknown; ordersProcessed: unknown; trigger: unknown } }).monday_sync_metadata.reportingPeriod, { year: 2026, month: 7 });
  assert.deepEqual([(deps.writes[0] as { monday_sync_metadata: { quotesDone: unknown; ordersProcessed: unknown } }).monday_sync_metadata.quotesDone, (deps.writes[0] as { monday_sync_metadata: { quotesDone: unknown; ordersProcessed: unknown } }).monday_sync_metadata.ordersProcessed], [1, 1]);
  assert.equal((deps.writes[0] as { monday_sync_metadata: { trigger: unknown } }).monday_sync_metadata.trigger, "cron");
  const unchanged = dependencies({ quotes_done: 1, orders_processed: 1 });
  const second = await runMondaySalesCron({ ...unchanged, now: new Date("2026-07-28T10:15:00Z") });
  assert.deepEqual(second, { outcome: "unchanged", year: 2026, month: 7, quotesDone: 1, ordersProcessed: 1, changed: false });
  assert.equal(unchanged.writes.length, 1);
});

test("malformed Date In Touch rejects the cron without a write", async () => {
  const deps = dependencies(null, true, [item("not-a-date")]);
  const result = await runMondaySalesCron({ ...deps, now: new Date("2026-07-28T10:15:00Z") });
  assert.equal(result.outcome, "rejected");
  assert.equal(deps.writes.length, 0);
});
