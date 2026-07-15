import { Suspense } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { SalesDashboard } from "@/features/sales-dashboard/components/SalesDashboard";
import { salesLeadFixtures } from "@/features/sales-dashboard/data/fixtures";
import { normaliseDateRange } from "@/features/sales-dashboard/lib/calculateKpis";

type SalesDashboardPageProps = {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
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
  const dateRange = normaliseDateRange(await searchParams);

  return (
    <AppShell>
      <PageHeader title="Sales Dashboard" />
      <SalesDashboard dateRange={dateRange} leads={salesLeadFixtures} />
    </AppShell>
  );
}
