"use client";

import { ExportButton } from "metricui";
import type { RefObject } from "react";
import type { MetricExportRow } from "../lib/metricsExport";
import styles from "./ExportMetricsButton.module.css";

export function ExportMetricsButton({ rows, targetRef, title }: { rows: MetricExportRow[]; targetRef: RefObject<HTMLElement | null>; title: string }) {
  return <div className={styles.control} data-testid="sales-dashboard-export-control">
    <ExportButton title={title} targetRef={targetRef} data={rows} className={styles.trigger} />
  </div>;
}
