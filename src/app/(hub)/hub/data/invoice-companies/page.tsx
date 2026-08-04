import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { InvoiceCompaniesManager } from "@/features/data-management/components/InvoiceCompaniesManager";
import { loadInvoiceCompaniesData } from "@/features/data-management/data/invoiceCompanies";

export default async function InvoiceCompaniesPage() {
  const { access, companies } = await loadInvoiceCompaniesData();
  return <AppShell pinsHubAccess={access}><PageHeader title="Invoice Companies" /><InvoiceCompaniesManager companies={companies} accessLevel={access.access?.access_level ?? "read"} /></AppShell>;
}
