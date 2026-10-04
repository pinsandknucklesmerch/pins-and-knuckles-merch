import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { CommercialInvoiceGenerator } from "@/features/commercial-invoices/components/CommercialInvoiceGenerator";
import {
  getInvoiceDirectory,
} from "@/features/commercial-invoices/data/invoiceDirectoryRepository";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";

export default function CommercialInvoicesPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading commercial invoice" />}>
      <CommercialInvoicesContent />
    </Suspense>
  );
}

async function CommercialInvoicesContent() {
  const access = await getCurrentPinsHubAccess();
  if (!access.access) return <AppShell pinsHubAccess={access}><PageHeader title="Commercial Invoice Generator" /></AppShell>;

  const [companies, products] = await getInvoiceDirectory();

  return (
    <AppShell pinsHubAccess={access}>
      <PageHeader title="Commercial Invoice Generator" />
      <CommercialInvoiceGenerator companies={companies} products={products} />
    </AppShell>
  );
}
