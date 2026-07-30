import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import MagicBento, { type MagicBentoItem } from "@/components/ui/MagicBento";
import { loadDataManagementSummary } from "@/features/data-management/data/catalog";

export default async function DataManagementPage() {
  const { access, garmentCount, productTypeCount } = await loadDataManagementSummary();
  const items: MagicBentoItem[] = [
    { id: "garments", title: "Garments", value: String(garmentCount), href: "/hub/data/garments" },
    { id: "product-types", title: "Product Types", value: String(productTypeCount), href: "/hub/data/product-types" },
  ];
  return <AppShell pinsHubAccess={access}><PageHeader title="Data Management" /><MagicBento items={items} enableBorderGlow cardSize="index" /></AppShell>;
}
