import assert from "node:assert/strict";
import test from "node:test";
import { buildSnuggleDetectedIssues } from "../server/syncSnuggleDiagnostics.ts";

test("Snuggle diagnostics use stable item keys and an aggregate exclusion issue", () => {
  const issues = buildSnuggleDetectedIssues([{ kind: "unassigned", itemId: "item-1", itemName: "Private name", group: "Completed Orders Jan 2026", resolvedYear: 2026, resolvedMonth: 1 }]);
  assert.equal(issues[0].issue_key, "snuggle:2026-01:unassigned:item-1");
  assert.equal(issues[0].summary.includes("Private name"), false);
  assert.equal(issues.some((issue) => issue.issue_type === "excluded_from_member_attribution" && issue.affected_item_id === null), true);
});

test("aggregate-only warnings do not fabricate item records", () => {
  const issues = buildSnuggleDetectedIssues([{ kind: "multi-assignee", itemId: "item-2", itemName: "Any", group: "Completed Orders Feb 2026", resolvedYear: 2026, resolvedMonth: 2 }]);
  const aggregate = issues.find((issue) => issue.issue_type === "excluded_from_member_attribution");
  assert.equal(aggregate?.affected_item_id, null);
  assert.equal(aggregate?.affected_member_key, null);
});
