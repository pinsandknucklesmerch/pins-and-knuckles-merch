"use client";

import { ExportButton } from "metricui";
import type { RefObject } from "react";
import type { MetricExportRow } from "../lib/metricsExport";
import styles from "./ExportMetricsButton.module.css";

type ExportMetricsButtonProps = {
  rows: MetricExportRow[];
  targetRef: RefObject<HTMLElement | null>;
  title: string;
};

export function ExportMetricsButton({
  rows,
  targetRef,
  title,
}: ExportMetricsButtonProps) {
  return (
    <div className={styles.actions}>
      <div
        className={styles.control}
        data-testid="sales-dashboard-export-control"
      >
        <ExportButton
          title={title}
          targetRef={targetRef}
          data={rows}
          className={styles.metricsTrigger}
        />
      </div>

    </div>
  );
}
