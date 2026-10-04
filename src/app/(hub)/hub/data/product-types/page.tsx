import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductTypesManager } from "@/features/data-management/components/ProductTypesManager";
import { loadProductTypesData } from "@/features/data-management/data/catalog";
import { effectivePinsHubAccessLevel, getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";

export default async function ProductTypesPage() {
  const access = await getCurrentPinsHubAccess();
  if (!access.access) return <AppShell pinsHubAccess={access}><PageHeader title="Product Types" /></AppShell>;

  const { productTypes } = await loadProductTypesData();
  const accessLevel = effectivePinsHubAccessLevel(access) ?? "read";
  return <AppShell pinsHubAccess={access}><PageHeader title="Product Types" /><ProductTypesManager productTypes={productTypes} accessLevel={accessLevel} /></AppShell>;
}
