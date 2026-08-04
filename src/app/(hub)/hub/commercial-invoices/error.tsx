"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function CommercialInvoicesError() {
  return <main className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-8"><ErrorState title="Commercial Invoices unavailable" /></main>;
}
