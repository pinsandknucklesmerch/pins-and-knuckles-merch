import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { loadSalesDashboard } from "@/features/sales-dashboard/data/salesDashboardRepository";
import { parseDashboardPeriod } from "@/features/sales-dashboard/lib/dashboardPeriod";
import { MetricExportWorkspace } from "@/features/sales-dashboard/components/MetricExportWorkspace";
import { Suspense } from "react";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function ExportMetricsPage({ searchParams }: Props) {
  return <Suspense fallback={<LoadingState label="Loading metric export" />}><ExportMetricsPageContent searchParams={searchParams} /></Suspense>;
}

async function ExportMetricsPageContent({ searchParams }: Props) {
  const [params, access] = await Promise.all([searchParams, getCurrentPinsHubAccess()]);
  if (!access.access) return <AppShell pinsHubAccess={access}><PageHeader title="Export Metrics" /></AppShell>;
  const { year, month } = parseDashboardPeriod(params);
  const data = await loadSalesDashboard(year, month, access.membership?.organisation_id ?? null);
  return <AppShell pinsHubAccess={access}><PageHeader title="Export Metrics" /><MetricExportWorkspace data={data} year={year} month={month} /></AppShell>;
}
