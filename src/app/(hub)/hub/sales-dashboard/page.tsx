import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { SalesDashboard } from "@/features/sales-dashboard/components/SalesDashboard";
import { loadSalesDashboard } from "@/features/sales-dashboard/data/salesDashboardRepository";

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
  const view = first(params.view) === "members" ? "members" : "company";
  const member = first(params.member);
  const isAdmin = access.access?.access_level === "admin";
  const data = await loadSalesDashboard(year, month, access.membership?.organisation_id ?? null, view, isAdmin);
  return <AppShell><PageHeader title="Sales Dashboard" /><SalesDashboard data={data} year={year} month={month} view={view} member={member} isAdmin={isAdmin} /></AppShell>;
}
