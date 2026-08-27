import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EpccReportWorkspace } from "@/features/sales-dashboard/components/EpccReportWorkspace";
import { loadSalesDashboard } from "@/features/sales-dashboard/data/salesDashboardRepository";
import { parseDashboardPeriod } from "@/features/sales-dashboard/lib/dashboardPeriod";
import { getCurrentPinsHubAccess, hasAdminAccess } from "@/lib/access/pinsHubAccess";
import { loadEpccReportTemplate } from "@/features/sales-dashboard/lib/epccReportTemplatePersistence";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function EpccReportPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<LoadingState label="Loading EPCC report" />}>
      <EpccReportPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function EpccReportPageContent({ searchParams }: Props) {
  const [params, access] = await Promise.all([searchParams, getCurrentPinsHubAccess()]);

  if (!access.access) {
    return <AppShell pinsHubAccess={access}><PageHeader title="EPCC Report" /></AppShell>;
  }

  const { year, month } = parseDashboardPeriod(params);
  const organisationId = access.membership?.organisation_id ?? null;
  const [data, template] = await Promise.all([
    loadSalesDashboard(year, month, organisationId),
    loadEpccReportTemplate(organisationId),
  ]);

  return (
    <AppShell pinsHubAccess={access} wideContent>
      <PageHeader title="EPCC Report" />
      <EpccReportWorkspace data={data} year={year} month={month} initialTemplate={template} canEdit={hasAdminAccess(access)} />
    </AppShell>
  );
}
