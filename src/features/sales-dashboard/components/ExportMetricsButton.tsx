"use client";

import { ExportButton } from "metricui";
import type { RefObject } from "react";
import type { MetricExportRow } from "../lib/metricsExport";
import styles from "./ExportMetricsButton.module.css";

type ExportMetricsButtonProps = {
  rows: MetricExportRow[];
  targetRef: RefObject<HTMLElement | null>;
  profitTargetRef: RefObject<HTMLElement | null>;
  title: string;
  profitTitle: string;
};

export function ExportMetricsButton({
  rows,
  targetRef,
  profitTargetRef,
  title,
  profitTitle,
}: ExportMetricsButtonProps) {
  const printProfitReport = () => {
    const report = profitTargetRef.current;

    if (!report) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=900");

    if (!printWindow) {
      return;
    }

    const stylesheets = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style'),
    )
      .map((element) => element.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${profitTitle}</title>
          ${stylesheets}
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            html,
            body {
              margin: 0;
              background: #111114;
              color: #f5f5f5;
            }

            body {
              padding: 16px;
            }

            .profit-report-page {
              break-after: page;
              page-break-after: always;
            }

            .profit-report-page:last-child {
              break-after: auto;
              page-break-after: auto;
            }

            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${report.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };
  };

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

      <div className={styles.control}>
        <button
          type="button"
          className={styles.profitButton}
          onClick={printProfitReport}
        >
          <span aria-hidden="true">⇩</span>
          Export Profit PDF
        </button>
      </div>
    </div>
  );
}