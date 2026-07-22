import assert from "node:assert/strict";
import test from "node:test";

import {
  CLEANUP_ORGANISATION_ID,
  CLEANUP_UPDATE,
  planMondayKpiCleanup,
  type MondayKpiCleanupRow,
} from "../lib/salesDashboard2026Cleanup.ts";

const mondayRow: MondayKpiCleanupRow = {
  organisation_id: CLEANUP_ORGANISATION_ID,
  year: 2026,
  month: 7,
  monthly_profit: 666666,
  quotes_done: 666,
  orders_processed: 66666,
  monday_scope_a_leads: 194,
  monday_scope_a_converted: 106,
  monday_scope_a_conversion_rate: 54.6,
  sales_inbox_enquiries: 43,
  converted: 11,
  monday_sync_metadata: { sourceBoardId: "18420001220", fetchedAt: "2026-07-22T00:00:00Z" },
  data_source: "monday",
};

test("plans only the scoped Monday rows and preserves every Monday field", () => {
  const outsideScope = { ...mondayRow, month: 8 };
  const differentOrganisation = { ...mondayRow, organisation_id: "00000000-0000-0000-0000-000000000000" };
  const differentYear = { ...mondayRow, year: 2025 };
  const plan = planMondayKpiCleanup([mondayRow, outsideScope, differentOrganisation, differentYear]);
  assert.equal(plan.rowsAffected, 1);
  assert.deepEqual(CLEANUP_UPDATE, { monthly_profit: null, quotes_done: null, orders_processed: null });
  assert.deepEqual(plan.fieldsToClear, ["monthly_profit", "quotes_done", "orders_processed"]);
  assert.deepEqual(plan.mondayFieldsUnchanged, [{
    month: 7,
    monday_scope_a_leads: 194,
    monday_scope_a_converted: 106,
    monday_scope_a_conversion_rate: 54.6,
    sales_inbox_enquiries: 43,
    converted: 11,
    monday_sync_metadata: { sourceBoardId: "18420001220", fetchedAt: "2026-07-22T00:00:00Z" },
    data_source: "monday",
  }]);
});
