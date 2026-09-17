import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuickReferenceManager } from "@/features/quick-reference/components/QuickReferenceManager";
import { loadQuickReferenceManagementData } from "@/features/quick-reference/data/quickReferenceRepository";
import { effectivePinsHubAccessLevel } from "@/lib/access/pinsHubAccess";
import { hasPinsHubAccessLevel } from "@/lib/access/pinsHubRoles";

export default async function QuickReferenceManagementPage() {
  const { access, records } = await loadQuickReferenceManagementData();
  const accessLevel = effectivePinsHubAccessLevel(access);
  if (!hasPinsHubAccessLevel(accessLevel, "write")) redirect("/hub/reference");

  return <AppShell pinsHubAccess={access}>
    <PageHeader title="Manage Quick Reference" />
    <QuickReferenceManager records={records} accessLevel={accessLevel} />
  </AppShell>;
}
