import assert from "node:assert/strict";
import test from "node:test";
import { syncMondaySalesDashboard } from "../lib/monday/salesDashboardSync.ts";
import type { MondayItem } from "../lib/monday/salesHistoryAudit.ts";

const board = {
  id: "board-7",
  name: "JULY 2026",
  state: "active",
  board_kind: "public",
  groups: [{ id: "week", title: "WEEK 1" }],
  columns: [
    { id: "people", title: "Acc Manager", type: "people" },
    { id: "status_16", title: "Channel", type: "status", settings_str: '{"labels":{"1":"Sales Inbox","2":"Referral"}}' },
    { id: "date8", title: "Date In Touch", type: "date" },
    { id: "status", title: "Converted", type: "status", settings_str: '{"labels":{"1":"Yes","2":"No"}}' },
  ],
};

function item(id: string, name: string, channel: string | null, converted = "No", date = "2026-07-28"): MondayItem {
  return {
    id,
    name,
    created_at: "2026-07-28T10:00:00Z",
    group: { id: "week", title: "WEEK 1" },
    column_values: [
      { id: "people", text: "Alice", value: '{"personsAndTeams":[{"id":7,"kind":"person"}]}' },
      { id: "status_16", text: channel },
      { id: "status", text: converted },
      { id: "date8", text: date },
    ],
  };
}

async function sync(sourceItems: MondayItem[], apply = true) {
  const writes: unknown[] = [];
  const outcomes = await syncMondaySalesDashboard({
    year: 2026,
    months: [7],
    organisationId: "org-1",
    boards: [board],
    inspectBoard: async () => board,
    existingMonths: new Set<number>(),
    collectItems: async () => ({ items: sourceItems }),
    now: new Date("2026-07-28T10:15:00Z"),
    fetchedAt: "2026-07-28T10:15:00Z",
    force: false,
    apply,
    write: async (snapshot) => { writes.push(snapshot); },
    writeMembers: async () => {},
  });
  return { outcome: outcomes[0], writes };
}

test("one weekly item without Channel is skipped while valid rows persist", async () => {
  const { outcome, writes } = await sync([
    item("valid", "Valid lead", "Sales Inbox", "Yes"),
    item("13357521583", "Kila Kosa", null),
  ]);

  assert.equal(outcome.status, "inserted");
  assert.equal(writes.length, 1);
  assert.deepEqual([outcome.snapshot?.quotes_done, outcome.snapshot?.orders_processed], [1, 1]);
  assert.deepEqual(outcome.audit?.skippedItems, [
    { id: "13357521583", name: "Kila Kosa", reason: "missing-channel", message: "Channel is missing" },
  ]);
  assert.deepEqual(outcome.snapshot?.monday_sync_metadata.skippedItems, outcome.audit?.skippedItems);
  assert.equal(outcome.snapshot?.monday_sync_metadata.skippedItemCount, 1);
});

test("multiple weekly items without Channel are all skipped", async () => {
  const { outcome } = await sync([
    item("valid", "Valid referral", "Referral"),
    item("missing-1", "Missing one", null),
    item("missing-2", "Missing two", ""),
  ]);

  assert.equal(outcome.status, "inserted");
  assert.deepEqual([outcome.snapshot?.quotes_done, outcome.snapshot?.orders_processed], [1, 0]);
  assert.deepEqual(outcome.audit?.skippedItems.map(({ id }) => id), ["missing-1", "missing-2"]);
});

test("fatal import validation still rejects and writes no snapshot", async () => {
  const { outcome, writes } = await sync([
    item("invalid-date", "Invalid date", "Sales Inbox", "No", "not-a-date"),
    item("missing-channel", "Missing Channel", null),
  ]);

  assert.equal(outcome.status, "rejected");
  assert.match(outcome.reason ?? "", /no valid reporting date/i);
  assert.equal(writes.length, 0);
});

test("an import with no usable weekly rows remains fatal", async () => {
  const { outcome, writes } = await sync([item("missing-channel", "Missing Channel", null)]);

  assert.equal(outcome.status, "rejected");
  assert.match(outcome.reason ?? "", /No usable weekly items remain/);
  assert.equal(writes.length, 0);
});

test("all-valid data retains existing totals and has no skips", async () => {
  const { outcome } = await sync([
    item("lead-1", "Inbox lead", "Sales Inbox", "Yes"),
    item("lead-2", "Referral lead", "Referral", "No"),
  ]);

  assert.equal(outcome.status, "inserted");
  assert.deepEqual([outcome.snapshot?.quotes_done, outcome.snapshot?.orders_processed], [2, 1]);
  assert.deepEqual(outcome.audit?.skippedItems, []);
  assert.equal(outcome.snapshot?.monday_sync_metadata.skippedItemCount, 0);
});
