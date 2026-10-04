import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { InvoiceCompaniesManager } from "@/features/data-management/components/InvoiceCompaniesManager";
import { loadInvoiceCompaniesData } from "@/features/data-management/data/invoiceCompanies";
import { effectivePinsHubAccessLevel, getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";

export default async function InvoiceCompaniesPage() {
  const access = await getCurrentPinsHubAccess();
  if (!access.access) return <AppShell pinsHubAccess={access}><PageHeader title="Invoice Companies" /></AppShell>;

  const { companies } = await loadInvoiceCompaniesData();
  return <AppShell pinsHubAccess={access}><PageHeader title="Invoice Companies" /><InvoiceCompaniesManager companies={companies} accessLevel={effectivePinsHubAccessLevel(access) ?? "read"} /></AppShell>;
}
