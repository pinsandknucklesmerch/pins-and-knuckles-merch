"use client";

import { useMemo, useRef } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Select } from "@/components/ui/Select";
import type { SalesDashboardData } from "../domain/types";
import { calculateCompanyMetrics } from "../domain/calculateDashboardKpis";
import { buildMetricExportRows } from "../lib/metricsExport";
import { DASHBOARD_MONTHS } from "../types";
import { ExportMetricsButton } from "./ExportMetricsButton";

export function MetricExportWorkspace({ data, year, month }: { data: SalesDashboardData; year: number; month: number }) {
  const exportTargetRef = useRef<HTMLDivElement>(null);
  const metrics = useMemo(() => calculateCompanyMetrics(data.company, data.previousCompany, data.targets), [data.company, data.previousCompany, data.targets]);
  const rows = useMemo(() => buildMetricExportRows(data.company, metrics, { year, month }), [data.company, metrics, year, month]);
  return <div className="grid gap-4">
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-md border border-border bg-card p-4">
      <form method="get" action="/hub/reporting/metrics" className="flex flex-wrap items-end gap-2">
        <label className="grid min-w-[5.5rem] gap-1 text-xs font-medium text-muted-foreground"><span>Year</span><Select aria-label="Export year" className="min-w-[5.5rem]" name="year" defaultValue={String(year)}>{data.availableYears.map((value) => <option key={value} value={String(value)}>{value}</option>)}</Select></label>
        <label className="grid min-w-[8rem] gap-1 text-xs font-medium text-muted-foreground"><span>Month</span><Select aria-label="Export month" className="min-w-[8rem]" name="month" defaultValue={String(month)}>{DASHBOARD_MONTHS.map((name, index) => <option key={name} value={String(index + 1)}>{name}</option>)}</Select></label>
        <ActionButton type="submit">Apply</ActionButton>
      </form>
      <ExportMetricsButton rows={rows} targetRef={exportTargetRef} title={`Pins Sales Metrics — ${DASHBOARD_MONTHS[month - 1]} ${year}`} />
    </div>
    <div ref={exportTargetRef} className="pointer-events-none fixed left-[-12000px] top-0 w-[1100px]" aria-hidden="true">{rows.map((row) => <span key={row.metric_name}>{row.metric_name}</span>)}</div>
  </div>;
}
