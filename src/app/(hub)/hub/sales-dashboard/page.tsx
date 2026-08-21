import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { getCurrentPinsHubAccess, hasAdminAccess } from "@/lib/access/pinsHubAccess";
import { SalesDashboard } from "@/features/sales-dashboard/components/SalesDashboard";
import { loadSalesDashboard } from "@/features/sales-dashboard/data/salesDashboardRepository";
import { loadSalesDashboardStaleWarnings } from "@/features/sales-dashboard/data/cronStaleWarning";
import { parseDashboardView } from "@/features/sales-dashboard/lib/dashboardView";
import { isTvMode, parseTvDuration } from "@/features/sales-dashboard/lib/tvMode";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default function SalesDashboardPage({ searchParams }: Props) {
  return <Suspense fallback={<LoadingState label="Loading sales dashboard" />}><SalesDashboardPageContent searchParams={searchParams} /></Suspense>;
}

async function SalesDashboardPageContent({ searchParams }: Props) {
  const [params, access] = await Promise.all([searchParams, getCurrentPinsHubAccess()]);
  const now = new Date();
  const parsedYear = Number(first(params.year));
  const parsedMonth = Number(first(params.month));
  const year = Number.isInteger(parsedYear) && parsedYear >= 2020 ? parsedYear : now.getFullYear();
  const month = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : now.getMonth() + 1;
  const dashboardView = parseDashboardView(first(params.dashboardView));
  const tvMode = isTvMode(params.tv);
  const tvDurationSeconds = parseTvDuration(params.duration);
  const isAdmin = hasAdminAccess(access);
  const organisationId = access.membership?.organisation_id ?? null;
  const [data, staleWarnings] = await Promise.all([loadSalesDashboard(year, month, organisationId), isAdmin ? loadSalesDashboardStaleWarnings(organisationId, year, month, now) : Promise.resolve([])]);
  return <AppShell tvMode={tvMode} wideContent><SalesDashboard data={data} year={year} month={month} isAdmin={isAdmin} initialDashboardView={dashboardView} staleWarnings={staleWarnings} tvMode={tvMode} tvDurationSeconds={tvDurationSeconds} /></AppShell>;
}
