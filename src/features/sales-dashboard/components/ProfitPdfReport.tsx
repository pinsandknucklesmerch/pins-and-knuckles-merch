import type { MetricResult, YearComparisonData, YearToDateData } from "../domain/types";
import { DEFAULT_EPCC_REPORT_TEMPLATE, orderedEpccReportComponents, type EpccReportTemplate } from "../lib/epccReportTemplate";
import { DASHBOARD_MONTHS } from "../types";
import { ProfitReportMonthlyProfit } from "./ProfitReportMonthlyProfit";
import { ProfitReportMonthlyComparison, ProfitReportPerformanceKpis, ProfitReportYtdSummary } from "./ProfitReportYearToDate";
import styles from "./ProfitPdfReport.module.css";

type ProfitPdfReportProps = {
  year: number;
  month: number;
  monthlyProfitMetric: MetricResult;
  yearToDate: YearToDateData;
  yearComparison: YearComparisonData;
  template?: EpccReportTemplate;
};

const reportPageClass = "box-border flex min-h-[793px] w-[1120px] flex-col gap-6 overflow-hidden bg-[#111114] p-10 text-foreground";

function ReportPageHeader({ month, year, title }: { month: number; year: number; title: string }) {
  return <header className="flex shrink-0 items-end justify-between border-b border-white/10 pb-4">
    <div className="grid gap-1"><p className="text-base font-semibold">Pins & Knuckles Profit Report</p><p className="text-sm text-muted-foreground">{DASHBOARD_MONTHS[month - 1]} {year}</p></div>
    <h1 className="text-lg font-semibold">{title}</h1>
  </header>;
}

export function ProfitPdfReport({ year, month, monthlyProfitMetric, yearToDate, yearComparison, template = DEFAULT_EPCC_REPORT_TEMPLATE }: ProfitPdfReportProps) {
  const companyProfitComponents = orderedEpccReportComponents(template, "company-profit", "company-profit");
  const yearToDatePrimaryComponents = orderedEpccReportComponents(template, "year-to-date", "year-to-date-primary");
  const performanceComponents = orderedEpccReportComponents(template, "year-to-date", "year-to-date-performance");

  return <div data-export-subtree="epcc-profit" className="grid gap-8 bg-[#111114] text-foreground">
    <section data-profit-pdf-page="true" className={reportPageClass}>
      <ReportPageHeader month={month} year={year} title="Company Profit" />
      <div className={styles.companyProfit}>
        {companyProfitComponents.some((component) => component.type === "monthly-profit") ? <ProfitReportMonthlyProfit metric={monthlyProfitMetric} label={companyProfitComponents.find((component) => component.type === "monthly-profit")?.label} bonusLabel={companyProfitComponents.find((component) => component.type === "bonus-profit")?.label} showBonus={companyProfitComponents.some((component) => component.type === "bonus-profit")} /> : null}
      </div>
    </section>
    <section data-profit-pdf-page="true" className={reportPageClass}>
      <ReportPageHeader month={month} year={year} title="Year to Date" />
      <div className={styles.yearToDate}>
        <div className={styles.yearToDatePrimary}>
          {yearToDatePrimaryComponents.map((component) => {
            if (component.type === "ytd-summary") return <ProfitReportYtdSummary key={component.id} data={yearToDate} comparison={yearComparison} label={component.label} previousYearLabel={yearToDatePrimaryComponents.find((item) => item.type === "previous-year-ytd")?.label} targetLabel={yearToDatePrimaryComponents.find((item) => item.type === "ytd-target")?.label} varianceAboveLabel={yearToDatePrimaryComponents.find((item) => item.type === "target-variance")?.label} varianceBelowLabel={component.labels?.varianceBelow} showPreviousYear={yearToDatePrimaryComponents.some((item) => item.type === "previous-year-ytd")} showTarget={yearToDatePrimaryComponents.some((item) => item.type === "ytd-target")} showVariance={yearToDatePrimaryComponents.some((item) => item.type === "target-variance")} />;
            if (component.type === "monthly-profit-comparison") return <ProfitReportMonthlyComparison key={component.id} data={yearToDate} comparison={yearComparison} label={component.label} />;
            return null;
          })}
        </div>
        <ProfitReportPerformanceKpis data={yearToDate} comparison={yearComparison} components={performanceComponents} />
      </div>
    </section>
  </div>;
}
