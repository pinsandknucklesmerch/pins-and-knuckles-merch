import { calculateProgress } from "../lib/calculateKpis";
import { BentoPanel } from "@/components/ui/BentoPanel";
import type { DashboardKpi } from "../types";
import { ComparisonValue } from "./ComparisonValue";
import { KpiMeter } from "./KpiMeter";

type KpiCardProps = {
  kpi: DashboardKpi;
};

export function KpiCard({ kpi }: KpiCardProps) {
  const progress = calculateProgress(kpi.comparison.current, kpi.target);
  const value = kpi.comparison.current === null ? "—" : kpi.format === "currency"
    ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(kpi.comparison.current)
    : kpi.comparison.current.toLocaleString("en-GB");

  return (
    <BentoPanel className="p-4" glow>
      <div className="flex items-start justify-between gap-3">
        <dt className="text-sm font-medium text-muted-foreground">{kpi.label}</dt>
        {kpi.target !== null ? <span className="text-xs tabular-nums text-muted-foreground">Target {kpi.format === "currency" ? `£${kpi.target.toLocaleString("en-GB")}` : kpi.target.toLocaleString("en-GB")}</span> : null}
      </div>
      <dd className="mt-2 text-2xl font-semibold tracking-normal text-foreground">{value}</dd>
      <div className="mt-3 grid gap-2">
        {progress !== null ? <KpiMeter value={progress} label={`${progress.toFixed(0)}% of target`} /> : null}
        <ComparisonValue comparison={kpi.comparison} format={kpi.format} />
      </div>
    </BentoPanel>
  );
}
