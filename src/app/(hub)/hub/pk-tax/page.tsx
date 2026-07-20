import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { PkTaxCalculator } from "@/features/pk-tax/components/PkTaxCalculator";

export default function PkTaxPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading PK Tax" />}>
      <AppShell>
        <PageHeader title="PK Tax" />
        <PkTaxCalculator />
      </AppShell>
    </Suspense>
  );
}
