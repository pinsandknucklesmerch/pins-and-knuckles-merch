import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import MagicBento, { type MagicBentoItem } from "@/components/ui/MagicBento";
import { loadDataManagementSummary } from "@/features/data-management/data/catalog";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";

export default async function DataManagementPage() {
  const access = await getCurrentPinsHubAccess();
  if (!access.access) return <AppShell pinsHubAccess={access}><PageHeader title="Data Management" /></AppShell>;

  const { garmentCount, productTypeCount, invoiceCompanyCount } = await loadDataManagementSummary();
  const items: MagicBentoItem[] = [
    { id: "garments", title: "Garments", value: String(garmentCount), href: "/hub/data/garments" },
    { id: "product-types", title: "Product Types", value: String(productTypeCount), href: "/hub/data/product-types" },
    { id: "invoice-companies", title: "Invoice Companies", value: String(invoiceCompanyCount), href: "/hub/data/invoice-companies" },
  ];
  return <AppShell pinsHubAccess={access}><PageHeader title="Data Management" /><MagicBento items={items} enableBorderGlow cardSize="index" /></AppShell>;
}
