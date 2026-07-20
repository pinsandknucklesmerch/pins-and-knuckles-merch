import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { CommercialInvoiceGenerator } from "@/features/commercial-invoices/components/CommercialInvoiceGenerator";

export default function CommercialInvoicesPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading commercial invoice" />}>
      <AppShell>
        <PageHeader title="Commercial Invoice Generator" />
        <CommercialInvoiceGenerator />
      </AppShell>
    </Suspense>
  );
}
