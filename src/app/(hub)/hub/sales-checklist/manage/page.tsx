import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { ChecklistManagement } from "@/features/sales-checklist/components/ChecklistManagement";
import { loadChecklistManagement } from "@/features/sales-checklist/data/managementRepository";
import { hasAdminAccess } from "@/lib/access/pinsHubAccess";

export default async function ChecklistManagementPage() {
  const { access, management, errorMessage } = await loadChecklistManagement();
  if (!access.access || !access.membership?.is_active || !hasAdminAccess(access)) redirect("/hub/sales-checklist");
  return <AppShell pinsHubAccess={access}>
    <PageHeader title="Checklist Management" />
    {errorMessage ? <ErrorState title="Management unavailable" message={errorMessage} /> : null}
    {management ? <ChecklistManagement key={`${management.revision ?? "initial"}:${management.effectiveFrom}`} management={management} /> : null}
  </AppShell>;
}
