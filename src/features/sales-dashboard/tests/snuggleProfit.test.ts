import assert from "node:assert/strict";
import test from "node:test";
import { aggregateSnuggleProfit, parseCompletedSnuggleGroup } from "../server/snuggleProfit.ts";
import { groupUnmappedSnuggleWarnings } from "../lib/snuggleDiagnostics.ts";

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

test("groups unmapped diagnostics by stable Monday person ID", () => {
  const result = aggregateSnuggleProfit({ board, items: [
    { ...item("1", "Completed Orders JAN 2026", "10", ["unknown-1"]), name: "A", column_values: [{ id: "formula_mm008w45", display_value: "10" }, { id: "person", persons_and_teams: [{ id: "unknown-1", kind: "person", name: "Same name" }] }] },
    { ...item("2", "Completed Orders FEB 2026", "10", ["unknown-1"]), name: "B", column_values: [{ id: "formula_mm008w45", display_value: "10" }, { id: "person", persons_and_teams: [{ id: "unknown-1", kind: "person", name: "Same name" }] }] },
    { ...item("3", "Completed Orders JAN 2026", "10", ["unknown-2"]), name: "C", column_values: [{ id: "formula_mm008w45", display_value: "10" }, { id: "person", persons_and_teams: [{ id: "unknown-2", kind: "person", name: "Same name" }] }] },
  ] });
  const groups = groupUnmappedSnuggleWarnings(result.warnings);
  assert.deepEqual(groups.map((group) => [group.personId, group.itemCount]), [["unknown-1", 2], ["unknown-2", 1]]);
  assert.deepEqual(groups[0]?.months, ["January 2026", "February 2026"]);
  assert.equal(groups[0]?.items[0]?.mondayPersonName, "Same name");
});

test("keeps unassigned and multi-assignee diagnostics separate", () => {
  const result = aggregateSnuggleProfit({ board, items: [item("1", "Completed Orders JAN 2026", "10"), item("2", "Completed Orders JAN 2026", "10", ["unknown-1", "unknown-2"])] });
  assert.equal(result.warnings.filter((warning) => warning.kind === "unassigned").length, 1);
  const multi = result.warnings.find((warning) => warning.kind === "multi-assignee");
  assert.deepEqual(multi?.assignedPeople?.map((person) => person.id), ["unknown-1", "unknown-2"]);
});
