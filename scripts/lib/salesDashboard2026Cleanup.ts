export const CLEANUP_ORGANISATION_ID = "5df4d50f-959e-4438-a026-df75d54fbbc2";
export const CLEANUP_YEAR = 2026;
export const CLEANUP_MONTHS = [1, 2, 3, 4, 5, 6, 7] as const;

export const FIELDS_TO_CLEAR = ["monthly_profit", "quotes_done", "orders_processed"] as const;
export const MONDAY_FIELDS_TO_PRESERVE = [
  "monday_scope_a_leads",
  "monday_scope_a_converted",
  "monday_scope_a_conversion_rate",
  "sales_inbox_enquiries",
  "converted",
  "monday_sync_metadata",
  "data_source",
] as const;

export const CLEANUP_UPDATE = {
  monthly_profit: null,
  quotes_done: null,
  orders_processed: null,
} as const;

export type MondayKpiCleanupRow = {
  organisation_id: string;
  year: number;
  month: number;
  monthly_profit: number | null;
  quotes_done: number | null;
  orders_processed: number | null;
  monday_scope_a_leads: number | null;
  monday_scope_a_converted: number | null;
  monday_scope_a_conversion_rate: number | null;
  sales_inbox_enquiries: number | null;
  converted: number | null;
  monday_sync_metadata: unknown;
  data_source: "monday";
};

export function isCleanupTarget(row: Pick<MondayKpiCleanupRow, "organisation_id" | "year" | "month" | "data_source">) {
  return row.organisation_id === CLEANUP_ORGANISATION_ID
    && row.year === CLEANUP_YEAR
    && CLEANUP_MONTHS.includes(row.month as (typeof CLEANUP_MONTHS)[number])
    && row.data_source === "monday";
}

export function planMondayKpiCleanup(rows: MondayKpiCleanupRow[]) {
  const targets = rows.filter(isCleanupTarget);
  return {
    rowsAffected: targets.length,
    fieldsToClear: [...FIELDS_TO_CLEAR],
    mondayFieldsUnchanged: targets.map((row) => ({
      month: row.month,
      monday_scope_a_leads: row.monday_scope_a_leads,
      monday_scope_a_converted: row.monday_scope_a_converted,
      monday_scope_a_conversion_rate: row.monday_scope_a_conversion_rate,
      sales_inbox_enquiries: row.sales_inbox_enquiries,
      converted: row.converted,
      monday_sync_metadata: row.monday_sync_metadata,
      data_source: row.data_source,
    })),
  };
}
