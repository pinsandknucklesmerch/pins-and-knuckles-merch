import { DASHBOARD_MONTHS } from "../types";
import type { MetricResult, YearComparisonData, YearToDateData } from "../domain/types";
import { ProfitShirtKpi } from "./ProfitShirtKpi";
import { YearComparisonChart } from "./YearComparisonChart";
import { YearToDateView } from "./YearToDateView";

type ProfitPdfReportProps = {
  year: number;
  month: number;
  monthlyProfitMetric: MetricResult;
  yearToDate: YearToDateData;
  yearComparison: YearComparisonData;
};

export function ProfitPdfReport({
  year,
  month,
  monthlyProfitMetric,
  yearToDate,
  yearComparison,
}: ProfitPdfReportProps) {
  return (
    <div className="grid gap-8 bg-background p-6 text-foreground">
      <section data-profit-pdf-page className="grid gap-3">
        <header>
          <h1 className="text-xl font-semibold">
            Pins & Knuckles Profit Report
          </h1>

          <p className="text-sm text-muted-foreground">
            {DASHBOARD_MONTHS[month - 1]} {year}
          </p>
        </header>
        <h2 className="text-sm font-semibold">Monthly Profit</h2>
        <ProfitShirtKpi metric={monthlyProfitMetric} />
      </section>

      <section data-profit-pdf-page className="profit-report-page grid gap-3">
        <h2 className="text-sm font-semibold">Year to Date</h2>
        <YearToDateView data={yearToDate} />
      </section>

      <section data-profit-pdf-page className="profit-report-page grid gap-3">
        <h2 className="text-sm font-semibold">Year Comparison</h2>
        <YearComparisonChart comparison={yearComparison} />
      </section>
    </div>
  );
}
