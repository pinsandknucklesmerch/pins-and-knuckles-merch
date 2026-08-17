"use client";

import { KpiCard } from "metricui";
import { DASHBOARD_MONTHS } from "../types";
import { formatMemberKpiValue, getMemberKpiHistory, getMemberKpiMetrics, getMemberKpiSnapshot, type MemberKpiMetric } from "../domain/memberKpis";
import type { TeamMemberKpiMonth } from "../domain/types";
import type { CSSProperties } from "react";

function MemberMetricValue({ metric }: { metric: MemberKpiMetric }) {
  return <span className="tabular-nums">{formatMemberKpiValue(metric.value, metric.format)}</span>;
}

export function MemberKpiCards({ rows, memberKey, year, month, tvMode = false }: { rows: TeamMemberKpiMonth[]; memberKey: string; year: number; month: number; tvMode?: boolean }) {
  const snapshot = getMemberKpiSnapshot(rows, memberKey, year, month);
  return <div data-testid="member-kpi-cards" data-tv-kpi={tvMode ? "true" : undefined} className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
    {getMemberKpiMetrics(snapshot).map((metric) => <KpiCard key={metric.key} data-testid="member-kpi-metric" title={metric.label} value={metric.value} format={metric.format === "currency" ? { style: "currency", currency: "GBP", compact: false, precision: 0 } : metric.format === "percent" ? { style: "percent", precision: 1 } : { style: "number", compact: false, precision: 0 }} nullDisplay="dash" animate className="min-w-0" />)}
  </div>;
}

export function MemberSummaryCard({ rows, memberKey, year, month, tvMode = false, animationIndex = 0 }: { rows: TeamMemberKpiMonth[]; memberKey: string; year: number; month: number; tvMode?: boolean; animationIndex?: number }) {
  const snapshot = getMemberKpiSnapshot(rows, memberKey, year, month);
  return <section data-testid="member-summary-card" data-period={`${year}-${month}`} data-tv-group={tvMode ? "member-summary" : undefined} style={tvMode ? { "--tv-enter-index": animationIndex } as CSSProperties : undefined} className="grid w-full gap-3 border-b border-border pb-5 text-left last:border-b-0 last:pb-0">
    <h2 className={tvMode ? "text-xl font-semibold text-foreground" : "font-medium text-foreground"}>{snapshot.memberName}</h2>
    <MemberKpiCards rows={rows} memberKey={memberKey} year={year} month={month} tvMode={tvMode} />
  </section>;
}

export function MemberKpiHistoryTable({ rows, memberKey, year, month }: { rows: TeamMemberKpiMonth[]; memberKey: string; year: number; month: number }) {
  const history = getMemberKpiHistory(rows, memberKey, year, month);
  return <div data-testid="member-kpi-history" className="overflow-x-auto"><table className="w-full min-w-[38rem] text-sm"><caption className="sr-only">Monthly member KPI history</caption><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-2 py-2 font-medium">Month</th><th className="px-2 py-2 text-right font-medium">Profit</th><th className="px-2 py-2 text-right font-medium">Quotes Done</th><th className="px-2 py-2 text-right font-medium">Orders Processed</th><th className="px-2 py-2 text-right font-medium">Conversion Rate</th></tr></thead><tbody>{history.length ? history.map((row) => { const snapshot = getMemberKpiSnapshot([row], memberKey, row.year, row.month); const metrics = getMemberKpiMetrics(snapshot); return <tr key={`${row.year}-${row.month}`} className="border-b border-border/70 last:border-0"><td className="px-2 py-2">{DASHBOARD_MONTHS[row.month - 1] ?? row.month} {row.year}</td>{metrics.map((metric) => <td key={metric.key} className="px-2 py-2 text-right tabular-nums"><MemberMetricValue metric={metric} /></td>)}</tr>; }) : <tr><td colSpan={5} className="px-2 py-6 text-center text-muted-foreground">—</td></tr>}</tbody></table></div>;
}
