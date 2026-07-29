import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import MagicBento, { type MagicBentoItem } from "@/components/ui/MagicBento";
import { loadDataManagementSummary } from "@/features/data-management/data/catalog";

export default async function DataManagementPage() {
  const { access, garmentCount, productTypeCount } = await loadDataManagementSummary();
  const items: MagicBentoItem[] = [
    { id: "garments", title: "Garments", label: "Directory", value: String(garmentCount), href: "/hub/data/garments", status: "Available", prefetch: false },
    { id: "product-types", title: "Product Types", label: "Reference data", value: String(productTypeCount), href: "/hub/data/product-types", status: "Available", prefetch: false },
  ];
  return <AppShell pinsHubAccess={access}><PageHeader title="Data Management" /><MagicBento items={items} enableStars enableSpotlight enableBorderGlow clickEffect glowColor="222, 59, 67" /></AppShell>;
}
