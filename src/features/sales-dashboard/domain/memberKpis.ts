import type { TeamMemberKpiMonth } from "./types.ts";

export type MemberKpiFormat = "currency" | "number" | "percent";

export type MemberKpiMetric = {
  key: "profit" | "quotesDone" | "ordersProcessed" | "conversionRate";
  label: string;
  value: number | null;
  format: MemberKpiFormat;
};

export type MemberKpiSnapshot = {
  year: number;
  month: number;
  memberKey: string;
  memberName: string;
  profit: number | null;
  quotesDone: number | null;
  ordersProcessed: number | null;
  conversionRate: number | null;
};

export const MEMBER_KPI_METRICS: Array<Pick<MemberKpiMetric, "key" | "label" | "format">> = [
  { key: "profit", label: "Profit", format: "currency" },
  { key: "quotesDone", label: "Quotes Done", format: "number" },
  { key: "ordersProcessed", label: "Orders Processed", format: "number" },
  { key: "conversionRate", label: "Conversion Rate", format: "percent" },
];

/** Member conversion uses the Monday-owned quote and order fields. */
export function calculateMemberConversionRate(ordersProcessed: number | null, quotesDone: number | null): number | null {
  if (quotesDone === null || !Number.isFinite(quotesDone)) return null;
  if (quotesDone <= 0) return 0;
  if (ordersProcessed === null || !Number.isFinite(ordersProcessed)) return null;
  return Math.round((ordersProcessed / quotesDone) * 1000) / 10;
}

export function mapMemberKpiSnapshot(row: TeamMemberKpiMonth | null, year: number, month: number, memberKey: string): MemberKpiSnapshot {
  return {
    year,
    month,
    memberKey,
    memberName: row?.teamMemberName ?? memberKey,
    profit: row?.profit ?? null,
    quotesDone: row?.quotesDone ?? null,
    ordersProcessed: row?.ordersProcessed ?? null,
    conversionRate: calculateMemberConversionRate(row?.ordersProcessed ?? null, row?.quotesDone ?? null),
  };
}

export function getMemberKpiSnapshot(rows: TeamMemberKpiMonth[], memberKey: string, year: number, month: number): MemberKpiSnapshot {
  return mapMemberKpiSnapshot(
    rows.find((row) => row.teamMemberKey === memberKey && row.year === year && row.month === month) ?? null,
    year,
    month,
    memberKey,
  );
}

export function getMemberKpiMetrics(snapshot: MemberKpiSnapshot): MemberKpiMetric[] {
  return MEMBER_KPI_METRICS.map((metric) => ({ ...metric, value: snapshot[metric.key] }));
}

export function getMemberKpiHistory(rows: TeamMemberKpiMonth[], memberKey: string, year: number, month: number): TeamMemberKpiMonth[] {
  return rows
    .filter((row) => row.teamMemberKey === memberKey && row.year === year && row.month <= month)
    .sort((left, right) => left.month - right.month);
}

export function formatMemberKpiValue(value: number | null, format: MemberKpiFormat): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (format === "currency") return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
  if (format === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString("en-GB");
}
