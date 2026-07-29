import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GarmentsManager } from "@/features/data-management/components/GarmentsManager";
import { loadGarmentsData } from "@/features/data-management/data/catalog";

export default async function GarmentsPage() {
  const { access, garments, productTypes } = await loadGarmentsData();
  const accessLevel = access.access?.access_level ?? "read";
  return <AppShell pinsHubAccess={access}><PageHeader title="Garment Directory" /><GarmentsManager garments={garments} productTypes={productTypes} accessLevel={accessLevel} /></AppShell>;
}
