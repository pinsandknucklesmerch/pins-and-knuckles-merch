import assert from "node:assert/strict";
import test from "node:test";
import type { WeeklyChecklist } from "./checklist.ts";
import { checklistTvLayoutKey, checklistTvPagePlan } from "./tvPagination.ts";

function checklist(dutyCount: number, staffCount: number): WeeklyChecklist {
  return {
    weekId: "week", isCurrent: true, weeks: [], entries: [],
    duties: Array.from({ length: dutyCount }, (_, index) => ({ id: `duty-${index}`, name: `Duty ${index}` })),
    staff: Array.from({ length: staffCount }, (_, index) => ({ id: `staff-${index}`, name: `Staff ${index}`, canEdit: false })),
  };
}

test("the initial checklist fits one page; an empty-duty week still displays scores", () => {
  assert.equal(checklistTvPagePlan(checklist(6, 4), 30).pageCount, 1);
  assert.equal(checklistTvPagePlan(checklist(0, 4), 30).pageCount, 1);
});

test("paging includes partial duty and staff groups without reducing minimum dwell", () => {
  const plan = checklistTvPagePlan(checklist(9, 5), 10);
  assert.equal(plan.dutyPages, 2);
  assert.equal(plan.pageCount, 4);
  assert.equal(plan.pageDurationMs, 2_000);
  const large = checklistTvPagePlan(checklist(100, 100), 10);
  assert.equal(large.pageCount, 325);
  assert.equal(large.pageDurationMs, 1_000);
  assert.ok(large.pageCount * large.pageDurationMs > 10_000, "rotation must wait beyond its configured timeout for this page pass");
});

test("saved status changes preserve playback, while layout and week changes restart it", () => {
  const original = checklist(9, 5);
  const originalKey = checklistTvLayoutKey(original);
  assert.equal(checklistTvLayoutKey({ ...original, entries: [{ id: "entry", dutyId: "duty-0", staffId: "staff-0", status: "complete" }] }), originalKey);
  assert.notEqual(checklistTvLayoutKey({ ...original, weekId: "next-week" }), originalKey);
  assert.notEqual(checklistTvLayoutKey({ ...original, duties: original.duties.slice(1) }), originalKey);
  assert.notEqual(checklistTvLayoutKey({ ...original, staff: [...original.staff].reverse() }), originalKey);
  assert.notEqual(checklistTvLayoutKey({ ...original, duties: [...original.duties, { id: "new-duty", name: "New duty" }] }), originalKey);
});
