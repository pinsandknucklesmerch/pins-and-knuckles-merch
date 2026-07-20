import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Panel } from "@/components/ui/Panel";

import { calculateSalesDashboardKpis } from "../lib/calculateKpis";
import type { DateRange, HistoricalDashboardMetrics, SalesLead } from "../types";
import { DateRangeFilter } from "./DateRangeFilter";
import { KpiCard } from "./KpiCard";
import { LeadSourceTable } from "./LeadSourceTable";
import { SalespersonTable } from "./SalespersonTable";
import { SalesInboxTable } from "./SalesInboxTable";

type SalesDashboardProps = {
  dateRange: DateRange;
  error?: string | null;
  leads: SalesLead[];
  period: Parameters<typeof calculateSalesDashboardKpis>[2];
  historical: HistoricalDashboardMetrics;
  years: number[];
  invalidDateRange?: boolean;
};

export function SalesDashboard({
  dateRange,
  error = null,
  leads,
  period,
  invalidDateRange = false,
  historical,
  years,
}: SalesDashboardProps) {
  if (error) {
    return <ErrorState title={error} />;
  }

  const kpis = calculateSalesDashboardKpis(leads, dateRange, period);

  return (
    <div className="grid gap-4">
      <Panel>
        <DateRangeFilter dateRange={kpis.dateRange} invalid={invalidDateRange} year={historical.selection.year} month={historical.selection.month} years={years} />
      </Panel>

      <dl className="grid gap-3 lg:grid-cols-3">
        {historical.kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </dl>

      {historical.summary.totalLeads === null && historical.kpis.every((kpi) => kpi.comparison.current === null) ? <EmptyState title="No data for this month" /> : (
        <>
          <Panel title="Incoming leads">
            <dl className="grid gap-3 sm:grid-cols-3">
              <SummaryMetric label="Incoming leads" value={formatNumber(historical.summary.totalLeads)} />
              <SummaryMetric label="Conversions" value={formatNumber(historical.summary.totalConversions)} />
              <SummaryMetric label="Conversion rate" value={historical.summary.conversionRate === null ? "—" : `${historical.summary.conversionRate.toFixed(1)}%`} />
            </dl>
          </Panel>

          <Panel title="Sales Inbox">
            <SalesInboxTable data={historical.salesInbox} month={historical.selection.month} />
          </Panel>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Salespeople">
              {historical.salespeople.length === 0 ? <EmptyState title="No salesperson breakdown for this period" /> : <SalespersonTable rows={historical.salespeople} />}
            </Panel>
            <Panel title="Lead sources">
              {kpis.sources.length === 0 ? <EmptyState title="No lead source data" /> : <LeadSourceTable rows={kpis.sources} />}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function formatNumber(value: number | null) {
  return value === null ? "—" : value.toLocaleString("en-GB");
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/55 p-3 backdrop-blur-sm">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
