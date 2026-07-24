"use client";

import { MetricProvider } from "metricui";
import type { ReactNode } from "react";
import styles from "./MetricDashboardProvider.module.css";

export function MetricDashboardProvider({ children }: { children: ReactNode }) {
  return (
    <div className={styles.scope}>
      <MetricProvider locale="en-GB" currency="GBP" colorScheme="dark" animate dense texture={false} variant="default">
        {children}
      </MetricProvider>
    </div>
  );
}
