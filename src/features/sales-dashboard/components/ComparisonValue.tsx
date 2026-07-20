import type { DashboardKpi } from "../types";

type ComparisonValueProps = {
  comparison: DashboardKpi["comparison"];
  format: DashboardKpi["format"];
};

function formatValue(value: number, format: ComparisonValueProps["format"]) {
  if (format === "currency") return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(Math.abs(value));
  return Math.abs(value).toLocaleString("en-GB");
}

export function ComparisonValue({ comparison, format }: ComparisonValueProps) {
  if (comparison.previousYear === null) {
    return <span className="text-xs text-muted-foreground">Previous year: —</span>;
  }

  const direction = comparison.difference === null || comparison.difference === 0 ? "flat" : comparison.difference > 0 ? "up" : "down";
  const change = comparison.percentageChange === null ? "—" : `${comparison.percentageChange > 0 ? "+" : ""}${comparison.percentageChange.toFixed(1)}%`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
      <span className="text-muted-foreground">Previous year: <span className="tabular-nums text-foreground">{formatValue(comparison.previousYear, format)}</span></span>
      <span className={direction === "down" ? "text-destructive" : "text-muted-foreground"} aria-label={`Previous year comparison ${change}`}>
        {direction === "up" ? "↑" : direction === "down" ? "↓" : "→"} {change}
      </span>
    </div>
  );
}
