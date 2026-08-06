import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("feedback migration keeps submission metadata server-controlled and developer-only reads", async () => {
  const migration = await readFile("supabase/migrations/20260806130000_add_developer_feedback_reports.sql", "utf8");
  assert.match(migration, /enable row level security/);
  assert.match(migration, /Developers can read feedback reports/);
  assert.match(migration, /has_pins_hub_developer_access/);
  assert.match(migration, /insert into public\.hub_feedback_reports \(organisation_id, submitted_by, issue_type/);
  assert.match(migration, /resolved_at = case when p_status/);
  assert.doesNotMatch(migration, /for insert to authenticated/);
});

test("access hierarchy migration preserves developer as a first-class level", async () => {
  const migration = await readFile("supabase/migrations/20260806140000_extend_pins_hub_access_hierarchy.sql", "utf8");
  assert.match(migration, /required_access_level = 'admin' and aa\.access_level in \('admin', 'developer'\)/);
  assert.match(migration, /required_access_level = 'developer' and aa\.access_level = 'developer'/);
  assert.match(migration, /in \('read', 'write', 'admin', 'developer'\)/);
});
