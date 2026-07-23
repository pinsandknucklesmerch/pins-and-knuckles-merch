import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260722160000_remove_duplicate_monday_scope_a_fields.sql";

test("canonical Scope A migration copies values before dropping duplicate columns", async () => {
  const migration = await readFile(migrationPath, "utf8");
  const copyLeads = migration.indexOf("quotes_done = case");
  const copyConverted = migration.indexOf("orders_processed = case");
  const dropColumns = migration.indexOf("drop column monday_scope_a_leads");
  assert.ok(copyLeads >= 0 && copyConverted >= 0);
  assert.ok(copyLeads < dropColumns && copyConverted < dropColumns);
  assert.match(migration, /when monday_scope_a_leads is not null then monday_scope_a_leads/);
  assert.match(migration, /when monday_scope_a_converted is not null then monday_scope_a_converted/);
  assert.match(migration, /where monday_scope_a_leads is not null\s+or monday_scope_a_converted is not null/);
  assert.match(migration, /drop column monday_scope_a_conversion_rate/);
});

test("runtime sync and dashboard sources do not use the removed columns", async () => {
  const sources = await Promise.all([
    "scripts/lib/monday/salesDashboardSync.ts",
    "scripts/cleanup-sales-dashboard-2026-test-kpis.ts",
    "scripts/lib/salesDashboard2026Cleanup.ts",
    "src/features/sales-dashboard/data/mappers.ts",
    "src/features/sales-dashboard/data/salesDashboardRepository.ts",
    "src/features/sales-dashboard/domain/calculateDashboardKpis.ts",
  ].map((path) => readFile(path, "utf8")));
  for (const source of sources) {
    assert.doesNotMatch(source, /monday_scope_a_(leads|converted|conversion_rate)/);
  }
});
