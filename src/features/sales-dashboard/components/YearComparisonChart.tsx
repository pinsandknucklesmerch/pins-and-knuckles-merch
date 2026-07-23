"use client";

import { useState } from "react";
import { AreaChart } from "metricui";
import { BentoPanel } from "@/components/ui/BentoPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import type { YearComparisonData, YearComparisonMetric } from "../domain/types";
import { yearComparisonValue } from "../data/yearComparison";
import dashboardStyles from "./SalesDashboard.module.css";
import styles from "./YearComparisonChart.module.css";

type ChartMetric = { code: YearComparisonMetric; label: string; format: "currency" | "number" | "percent" };

const METRICS: ChartMetric[] = [
  { code: "MONTHLY_PROFIT", label: "Monthly Profit", format: "currency" },
  { code: "QUOTES_DONE", label: "Quotes Done", format: "number" },
  { code: "ORDERS_PROCESSED", label: "Orders Processed", format: "number" },
  { code: "LEADS", label: "Leads", format: "number" },
  { code: "CONVERTED", label: "Converted", format: "number" },
  { code: "CONVERSION_RATE", label: "Conversion Rate", format: "percent" },
  { code: "SALES_INBOX_ENQUIRIES", label: "Sales Inbox Enquiries", format: "number" },
  { code: "SALES_INBOX_CONVERSION_RATE", label: "Sales Inbox Conversion Rate", format: "percent" },
];

export function YearComparisonChart({ comparison }: { comparison: YearComparisonData }) {
  const [metricCode, setMetricCode] = useState<YearComparisonMetric>("MONTHLY_PROFIT");
  const metric = METRICS.find((item) => item.code === metricCode) ?? METRICS[0];
  const selected = comparison.selected.map((point) => ({ x: point.label, y: yearComparisonValue(point, metric.code) }));
  const previous = comparison.previous.map((point) => ({ x: point.label, y: yearComparisonValue(point, metric.code) }));
  const hasData = [...selected, ...previous].some((point) => point.y !== null);

  return (
    <BentoPanel className={styles.card} glow overflowVisible>
      <div className={styles.header}>
        <div className={styles.controls}>
          <ul className={styles.legend} aria-label="Year legend">
            <li><span className={styles.currentSwatch} aria-hidden="true" />{comparison.selectedYear}</li>
            <li><span className={styles.previousSwatch} aria-hidden="true" />{comparison.previousYear}</li>
          </ul>
          <label className={styles.selectorLabel}>
            <span className="sr-only">Metric</span>
            <select className={dashboardStyles.select} value={metricCode} onChange={(event) => setMetricCode(event.target.value as YearComparisonMetric)}>
              {METRICS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
        </div>
      </div>
      {hasData ? (
        <AreaChart
          data={[{ id: String(comparison.selectedYear), data: selected }, { id: String(comparison.previousYear), data: previous }]}
          seriesStyles={{ [String(comparison.selectedYear)]: { color: "#d9474b", lineWidth: 2.5 }, [String(comparison.previousYear)]: { color: "#a8a79b", lineWidth: 1.5, lineStyle: "dashed" } }}
          format={metric.format === "currency" ? { style: "currency", compact: false, precision: 0 } : metric.format === "percent" ? { style: "percent", precision: 1 } : { style: "number", compact: false, precision: 0 }}
          height={360}
          stacked={false}
          gradient={false}
          areaOpacity={0.12}
          curve="monotoneX"
          enablePoints
          enableGridX={false}
          enableGridY
          legend={false}
          chartNullMode="gap"
          animate
          className={styles.chart}
        />
      ) : <EmptyState title="No comparison data" />}
    </BentoPanel>
  );
}
