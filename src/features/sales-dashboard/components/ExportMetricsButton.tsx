"use client";

import { ExportButton } from "metricui";
import { useState, type RefObject } from "react";
import { feedback } from "@/components/ui/feedback";
import type { MetricExportRow } from "../lib/metricsExport";
import { findUnsupportedExportColors, normalizeExportColors } from "../lib/exportSafeColors";
import styles from "./ExportMetricsButton.module.css";

type ExportMetricsButtonProps = {
  rows: MetricExportRow[];
  targetRef: RefObject<HTMLElement | null>;
  requestProfitReport: () => Promise<HTMLElement | null>;
  releaseProfitReport: () => void;
  title: string;
  profitFilename: string;
};

export function ExportMetricsButton({
  rows,
  targetRef,
  requestProfitReport,
  releaseProfitReport,
  title,
  profitFilename,
}: ExportMetricsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const downloadProfitReport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const report = await requestProfitReport();
    if (!report) {
      feedback.error("Could not export the profit PDF.");
      releaseProfitReport();
      setIsExporting(false);
      return;
    }
    const sections = Array.from(report.querySelectorAll<HTMLElement>("[data-profit-pdf-page]"));
    if (!sections.length) {
      feedback.error("Could not find the profit report sections.");
      releaseProfitReport();
      setIsExporting(false);
      return;
    }

    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");
      const margin = 8;
      const pageWidth = 297;
      const pageHeight = 210;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      for (const [index, section] of sections.entries()) {
        const canvas = await html2canvas(section, {
          scale: 1,
          useCORS: true,
          backgroundColor: "#111114",
          logging: false,
          removeContainer: true,
          onclone: (clonedDocument, clonedElement) => {
            normalizeExportColors(clonedElement ?? clonedDocument.body);
          },
        });
        const scale = Math.min(printableWidth / canvas.width, printableHeight / canvas.height);
        const imageWidth = canvas.width * scale;
        const imageHeight = canvas.height * scale;
        const imageX = (pageWidth - imageWidth) / 2;
        const imageY = (pageHeight - imageHeight) / 2;
        if (index > 0) pdf.addPage();
        pdf.setFillColor(17, 17, 20);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", imageX, imageY, imageWidth, imageHeight);
        canvas.width = 0;
        canvas.height = 0;
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }

      pdf.save(profitFilename);
      feedback.success("PDF downloaded");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Profit PDF export failed", {
          error: error instanceof Error ? error.message : "unknown error",
          unsupportedStyles: findUnsupportedExportColors(report),
        });
      }
      feedback.error("Could not download the profit PDF.");
    } finally {
      releaseProfitReport();
      setIsExporting(false);
    }
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
          onClick={downloadProfitReport}
          disabled={isExporting}
        >
          <span aria-hidden="true">{isExporting ? "…" : "⇩"}</span>
          {isExporting ? "Exporting…" : "EPCC Profit Report"}
        </button>
      </div>
    </div>
  );
}
