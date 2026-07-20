import { Suspense } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { SalesDashboard } from "@/features/sales-dashboard/components/SalesDashboard";
import { salesDashboardFixture } from "@/features/sales-dashboard/data/fixtures";
import { DASHBOARD_MONTHS } from "@/features/sales-dashboard/types";
import { DEFAULT_DATE_RANGE, DEFAULT_DASHBOARD_SELECTION, calculateHistoricalDashboardMetrics, getHistoricalPeriod, normaliseDateRange } from "@/features/sales-dashboard/lib/calculateKpis";

type SalesDashboardPageProps = {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    year?: string | string[];
    month?: string | string[];
  }>;
};

export default async function SalesDashboardPage({
  searchParams,
}: SalesDashboardPageProps) {
  return (
    <Suspense fallback={<LoadingState label="Loading sales dashboard" />}>
      <SalesDashboardPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SalesDashboardPageContent({
  searchParams,
}: SalesDashboardPageProps) {
  const params = await searchParams;
  const dateRange = normaliseDateRange(params);
  const rawFrom = Array.isArray(params.from) ? params.from[0] : params.from;
  const rawTo = Array.isArray(params.to) ? params.to[0] : params.to;
  const rawYear = Array.isArray(params.year) ? params.year[0] : params.year;
  const rawMonth = Array.isArray(params.month) ? params.month[0] : params.month;
  const parsedYear = Number(rawYear);
  const selection = {
    year: salesDashboardFixture.historical.years.some((year) => year.year === parsedYear) ? parsedYear : DEFAULT_DASHBOARD_SELECTION.year,
    month: DASHBOARD_MONTHS.includes(rawMonth as (typeof DASHBOARD_MONTHS)[number]) ? rawMonth as (typeof DASHBOARD_MONTHS)[number] : DEFAULT_DASHBOARD_SELECTION.month,
  };
  const historical = calculateHistoricalDashboardMetrics(salesDashboardFixture.historical, selection);
  const invalidDateRange = Boolean((rawFrom || rawTo) && dateRange === DEFAULT_DATE_RANGE);

  return (
    <AppShell>
      <PageHeader title="Sales Dashboard" />
      <SalesDashboard dateRange={dateRange} leads={salesDashboardFixture.leads} period={getHistoricalPeriod(salesDashboardFixture.historical, selection)} historical={historical} years={salesDashboardFixture.historical.years.map((year) => year.year)} invalidDateRange={invalidDateRange} />
    </AppShell>
  );
}
