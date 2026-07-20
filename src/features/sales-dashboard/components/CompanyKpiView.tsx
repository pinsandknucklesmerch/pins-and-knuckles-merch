import { BentoPanel } from "@/components/ui/BentoPanel";
import { calculateCompanyMetrics } from "../domain/calculateDashboardKpis";
import type { CompanyKpiMonth, SalesKpiTargets } from "../domain/types";

function format(value: number | null, type: "currency" | "number" | "percent") {
  if (value === null) return "—";
  if (type === "currency") return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
  if (type === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString("en-GB");
}

export function CompanyKpiView({ current, previous, targets }: { current: CompanyKpiMonth; previous: CompanyKpiMonth | null; targets: SalesKpiTargets }) {
  const metrics = calculateCompanyMetrics(current, previous, targets);
  return (
    <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => (
        <BentoPanel key={metric.code} className="p-4" glow>
          <div className="flex items-start justify-between gap-2"><dt className="text-sm font-medium text-muted-foreground">{metric.label}</dt>{metric.target !== null ? <span className="text-xs tabular-nums text-muted-foreground">Target {format(metric.target, metric.format)}</span> : null}</div>
          <dd className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{format(metric.value, metric.format)}</dd>
          {metric.targetProgress !== null ? <div className="mt-3"><div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${metric.targetReached ? "bg-emerald-400" : "bg-primary"}`} style={{ width: `${Math.min(metric.targetProgress, 100)}%` }} /></div><p className="mt-1 text-xs tabular-nums text-muted-foreground">{metric.targetProgress.toFixed(1)}%</p></div> : null}
          <div className="mt-3 border-t border-border/70 pt-2 text-xs text-muted-foreground"><span>Last year {format(metric.previousYear, metric.format)}</span>{metric.percentageChange !== null ? <span className={`ml-2 ${metric.percentageChange >= 0 ? "text-emerald-400" : "text-destructive"}`}>{metric.percentageChange >= 0 ? "+" : ""}{metric.percentageChange.toFixed(1)}%</span> : null}</div>
        </BentoPanel>
      ))}
    </dl>
  );
}
