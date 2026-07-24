"use client";

import { Download } from "lucide-react";
import type { MetricExportRow } from "../lib/metricsExport";
import { buildMetricExportCsv } from "../lib/metricsExport";

export function ExportMetricsButton({ rows, filename }: { rows: MetricExportRow[]; filename: string }) {
  function exportMetrics() {
    const blob = new Blob([buildMetricExportCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={exportMetrics} className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Download aria-hidden="true" size={16} />
      Export Metrics
    </button>
  );
}
