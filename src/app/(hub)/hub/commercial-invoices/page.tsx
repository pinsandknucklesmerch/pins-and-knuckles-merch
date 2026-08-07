import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { CommercialInvoiceGenerator } from "@/features/commercial-invoices/components/CommercialInvoiceGenerator";
import {
  getInvoiceDirectory,
} from "@/features/commercial-invoices/data/invoiceDirectoryRepository";

export default function CommercialInvoicesPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading commercial invoice" />}>
      <CommercialInvoicesContent />
    </Suspense>
  );
}

async function CommercialInvoicesContent() {
  const [companies, products] = await getInvoiceDirectory();

  return (
    <AppShell>
      <PageHeader title="Commercial Invoice Generator" />
      <CommercialInvoiceGenerator companies={companies} products={products} />
    </AppShell>
  );
}
