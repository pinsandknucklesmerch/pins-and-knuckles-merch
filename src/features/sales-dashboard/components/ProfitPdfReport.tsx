import type { MetricResult, YearComparisonData, YearToDateData } from "../domain/types";
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
};

const reportPageClass = "box-border flex min-h-[793px] w-[1120px] flex-col gap-6 overflow-hidden bg-[#111114] p-10 text-foreground";

function ReportPageHeader({ month, year, title }: { month: number; year: number; title: string }) {
  return <header className="flex shrink-0 items-end justify-between border-b border-white/10 pb-4">
    <div className="grid gap-1"><p className="text-base font-semibold">Pins & Knuckles Profit Report</p><p className="text-sm text-muted-foreground">{DASHBOARD_MONTHS[month - 1]} {year}</p></div>
    <h1 className="text-lg font-semibold">{title}</h1>
  </header>;
}

export function ProfitPdfReport({ year, month, monthlyProfitMetric, yearToDate, yearComparison }: ProfitPdfReportProps) {
  return <div data-export-subtree="epcc-profit" className="grid gap-8 bg-[#111114] text-foreground">
    <section data-profit-pdf-page="true" className={reportPageClass}>
      <ReportPageHeader month={month} year={year} title="Company Profit" />
      <div className={styles.companyProfit}>
        <ProfitReportMonthlyProfit metric={monthlyProfitMetric} />
      </div>
    </section>
    <section data-profit-pdf-page="true" className={reportPageClass}>
      <ReportPageHeader month={month} year={year} title="Year to Date" />
      <div className={styles.yearToDate}>
        <div className={styles.yearToDatePrimary}>
          <ProfitReportYtdSummary data={yearToDate} comparison={yearComparison} />
          <ProfitReportMonthlyComparison data={yearToDate} comparison={yearComparison} />
        </div>
        <ProfitReportPerformanceKpis data={yearToDate} comparison={yearComparison} />
      </div>
    </section>
  </div>;
}
