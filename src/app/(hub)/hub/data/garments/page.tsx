import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GarmentsManager } from "@/features/data-management/components/GarmentsManager";
import { loadGarmentsData } from "@/features/data-management/data/catalog";
import { effectivePinsHubAccessLevel } from "@/lib/access/pinsHubAccess";

export default async function GarmentsPage() {
  const { access, garments, productTypes } = await loadGarmentsData();
  const accessLevel = effectivePinsHubAccessLevel(access) ?? "read";
  return <AppShell pinsHubAccess={access}><PageHeader title="Garment Directory" /><GarmentsManager garments={garments} productTypes={productTypes} accessLevel={accessLevel} /></AppShell>;
}
