import assert from "node:assert/strict";
import test from "node:test";
import { aggregateSnuggleProfit, parseCompletedSnuggleGroup } from "../server/snuggleProfit.ts";

const item = (id: string, group: string, profit: string | null, people: string[] = []) => ({ id, name: `Order ${id}`, group: { id: group, title: group }, column_values: [
  { id: "formula_mm008w45", type: "formula", display_value: profit },
  { id: "person", type: "people", persons_and_teams: people.map((personId) => ({ id: personId, kind: "person" })) },
] });
const board = { id: "18393924380", name: "Snuggle Orders", workspace: { id: "13775293" } };

test("normalizes completed group month names and excludes Orders groups", () => {
  assert.deepEqual(parseCompletedSnuggleGroup("Completed Orders - JULY 2026"), { year: 2026, month: 7 });
  assert.deepEqual(parseCompletedSnuggleGroup("Completed Orders - june 2026"), { year: 2026, month: 6 });
  assert.deepEqual(parseCompletedSnuggleGroup("Completed Orders JAN 2026"), { year: 2026, month: 1 });
  assert.deepEqual(parseCompletedSnuggleGroup("  completed   orders   -   Jul  2026 "), { year: 2026, month: 7 });
  assert.equal(parseCompletedSnuggleGroup("Orders"), null);
  assert.equal(parseCompletedSnuggleGroup("CANCELLED ORDERS"), null);
});

test("rejects duplicate groups resolving to the same month", () => {
  const result = aggregateSnuggleProfit({ board, items: [item("1", "Completed Orders JULY 2026", "10"), item("2", "Completed Orders - Jul 2026", "20")] });
  assert.match(result.error ?? "", /Multiple Snuggle groups/);
});

test("aggregates display_value only, keeps company unassigned profit, and filters members", () => {
  const result = aggregateSnuggleProfit({ board, items: [
    item("1", "Completed Orders - JULY 2026", "100", ["29869326"]),
    item("2", "Completed Orders - JULY 2026", "25"),
    item("3", "Completed Orders - JULY 2026", "30", ["unknown"]),
    item("4", "Completed Orders - JULY 2026", "40", ["29869326", "69507598"]),
    item("5", "Completed Orders - JULY 2026", "not-a-number"),
    { ...item("7", "Completed Orders - JULY 2026", null), column_values: [{ id: "formula_mm008w45", text: "999", value: "999" }] },
    { ...item("6", "Orders", "999"), column_values: [{ id: "formula_mm008w45", text: "999", value: "999" }] },
  ] });
  assert.deepEqual(result.months, [{ year: 2026, month: 7, total: 195 }]);
  assert.equal(result.members.find((member) => member.memberKey === "hardus")?.total, 100);
  assert.equal(result.warnings.filter((warning) => warning.kind === "invalid-profit").length, 2);
  assert.equal(result.warnings.filter((warning) => warning.kind === "unassigned").length, 3);
  assert.equal(result.warnings.filter((warning) => warning.kind === "unmapped").length, 1);
  assert.equal(result.warnings.filter((warning) => warning.kind === "multi-assignee").length, 1);
});

test("keeps months absent instead of inventing zero records", () => {
  const result = aggregateSnuggleProfit({ board, items: [item("1", "Completed Orders JAN 2026", "12")] });
  assert.deepEqual(result.months, [{ year: 2026, month: 1, total: 12 }]);
});
