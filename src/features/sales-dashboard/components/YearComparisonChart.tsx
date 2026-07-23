"use client";

import { useState } from "react";
import { AreaChart, MetricProvider, type FormatOption } from "metricui";
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
  const currentPeriod = [{ id: metric.label, data: comparison.selected.map((point) => ({ x: point.label, y: yearComparisonValue(point, metric.code) })) }];
  const previousPeriod = [{ id: metric.label, data: comparison.previous.map((point) => ({ x: point.label, y: yearComparisonValue(point, metric.code) })) }];
  const hasData = [...currentPeriod[0].data, ...previousPeriod[0].data].some((point) => point.y !== null);
  const format: FormatOption = metric.format === "currency"
    ? { style: "currency", currency: "GBP", compact: false, precision: 0 }
    : metric.format === "percent"
      ? { style: "percent", percentInput: "whole", precision: 1 }
      : { style: "number", compact: false, precision: 0 };

  const controls = (
    <div className={styles.chartControls}>
      <ul className={styles.legend} aria-label={`Year comparison: ${comparison.selectedYear} current year and ${comparison.previousYear} previous year`}>
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
  );

  return (
    hasData ? <div className={styles.chartContainer}>
      <div className={styles.chartControls}>{controls}</div>
      <div className={styles.chartArea}>
        <MetricProvider dense={false}>
          <AreaChart
            data={currentPeriod}
            comparisonData={previousPeriod}
            seriesStyles={{ [metric.label]: { color: "#d9474b", lineWidth: 2.5 } }}
            format={format}
            height={460}
            gradient={false}
            areaOpacity={0.12}
            curve="monotoneX"
            enablePoints
            enableGridX={false}
            enableGridY
            legend={false}
            chartNullMode="gap"
            animate
            classNames={{ root: styles.chartRoot }}
          />
        </MetricProvider>
      </div>
    </div> : <EmptyState title="No comparison data" />
  );
}
