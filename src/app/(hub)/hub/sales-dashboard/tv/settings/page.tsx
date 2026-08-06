import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCurrentPinsHubAccess, hasAdminAccess } from "@/lib/access/pinsHubAccess";
import { loadSalesDashboardTvSettings } from "@/features/sales-dashboard/data/salesDashboardTvSettingsRepository";
import { TvSettingsForm } from "@/features/sales-dashboard/components/TvSettingsForm";

export default async function SalesDashboardTvSettingsPage() {
  const access = await getCurrentPinsHubAccess();
  if (!hasAdminAccess(access) || !access.membership?.organisation_id) notFound();
  const settings = await loadSalesDashboardTvSettings(access.membership.organisation_id);
  return <AppShell pinsHubAccess={access}><PageHeader title="Sales Dashboard TV" /><TvSettingsForm settings={settings.slides} /></AppShell>;
}
