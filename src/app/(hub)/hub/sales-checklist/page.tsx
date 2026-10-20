import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { ActionButton } from "@/components/ui/ActionButton";
import { hasAdminAccess } from "@/lib/access/pinsHubAccess";
import { WeeklyChecklistTable } from "@/features/sales-checklist/components/WeeklyChecklistTable";
import { loadSalesChecklist } from "@/features/sales-checklist/data/checklistRepository";

export default async function SalesChecklistPage() {
  const { access, checklist, errorMessage } = await loadSalesChecklist();
  return <AppShell pinsHubAccess={access}>
    <PageHeader title="Sales Weekly Checklist" action={hasAdminAccess(access) ? <ActionButton href="/hub/sales-checklist/manage">Manage</ActionButton> : undefined} />
    {errorMessage ? <ErrorState title="Checklist unavailable" message={errorMessage} /> : null}
    {checklist ? <WeeklyChecklistTable key={`${checklist.weekId}:${checklist.resetRevision}`} checklist={checklist} /> : null}
  </AppShell>;
}
