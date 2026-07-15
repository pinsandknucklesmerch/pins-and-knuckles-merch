import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Panel } from "@/components/ui/Panel";

import { calculateSalesDashboardKpis } from "../lib/calculateKpis";
import type { DateRange, SalesLead } from "../types";
import { DateRangeFilter } from "./DateRangeFilter";
import { KpiCard } from "./KpiCard";
import { LeadSourceTable } from "./LeadSourceTable";
import { SalespersonTable } from "./SalespersonTable";

type SalesDashboardProps = {
  dateRange: DateRange;
  error?: string | null;
  leads: SalesLead[];
};

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function SalesDashboard({
  dateRange,
  error = null,
  leads,
}: SalesDashboardProps) {
  if (error) {
    return <ErrorState title={error} />;
  }

  const kpis = calculateSalesDashboardKpis(leads, dateRange);

  return (
    <div className="grid gap-4">
      <Panel>
        <DateRangeFilter dateRange={kpis.dateRange} />
      </Panel>

      {kpis.leads.length === 0 ? (
        <EmptyState title="No sales data" />
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="Total leads" value={String(kpis.summary.totalLeads)} />
            <KpiCard
              label="Total conversions"
              value={String(kpis.summary.totalConversions)}
            />
            <KpiCard
              label="Conversion rate"
              value={formatPercent(kpis.summary.conversionRate)}
            />
          </dl>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Salespeople">
              <SalespersonTable rows={kpis.salespeople} />
            </Panel>
            <Panel title="Lead sources">
              <LeadSourceTable rows={kpis.sources} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
