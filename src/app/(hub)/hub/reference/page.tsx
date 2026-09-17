import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { QuickReferenceList } from "@/features/quick-reference/components/QuickReferenceList";
import { loadQuickReferenceData } from "@/features/quick-reference/data/quickReferenceRepository";
import { effectivePinsHubAccessLevel } from "@/lib/access/pinsHubAccess";
import { hasPinsHubAccessLevel } from "@/lib/access/pinsHubRoles";

export default async function QuickReferencePage() {
  const { access, records } = await loadQuickReferenceData();

  const canManage = hasPinsHubAccessLevel(effectivePinsHubAccessLevel(access), "write");

  return <AppShell pinsHubAccess={access}>
    <PageHeader title="Quick Reference" action={canManage ? <ActionButton href="/hub/reference/manage">Manage</ActionButton> : undefined} />
    <QuickReferenceList records={records} />
  </AppShell>;
}
