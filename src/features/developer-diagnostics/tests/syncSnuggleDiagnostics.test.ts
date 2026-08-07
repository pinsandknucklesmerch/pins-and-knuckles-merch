import assert from "node:assert/strict";
import test from "node:test";
import { buildSnuggleDetectedIssues, buildSnuggleSyncPayload } from "../server/syncSnuggleDiagnostics.ts";

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

test("diagnostic sync batches detected issues and preserves issue state", () => {
  const detected = buildSnuggleDetectedIssues([{ kind: "unassigned", itemId: "item-1", itemName: "Any", group: "Orders", resolvedYear: 2026, resolvedMonth: 2 }]);
  const payload = buildSnuggleSyncPayload("org-1", detected, [{
    id: "issue-1", issue_key: detected[0].issue_key, occurrence_count: 4, status: "investigating", developer_notes: "Keep watching",
    first_detected_at: "2026-02-01T00:00:00.000Z", resolved_at: null, resolved_by: null, no_longer_detected_at: null,
  }, {
    id: "issue-2", issue_key: "stale", occurrence_count: 2, status: "open", developer_notes: null,
    first_detected_at: "2026-01-01T00:00:00.000Z", resolved_at: null, resolved_by: null, no_longer_detected_at: null,
  }], "2026-02-02T00:00:00.000Z");

  assert.equal(payload.upserts.length, 2);
  const existingUpsert = payload.upserts.find((issue) => issue.issue_key === detected[0].issue_key);
  assert.equal(existingUpsert?.occurrence_count, 5);
  assert.equal(existingUpsert?.status, "investigating");
  assert.equal(existingUpsert?.developer_notes, "Keep watching");
  assert.deepEqual(payload.staleIds, ["issue-2"]);
});
