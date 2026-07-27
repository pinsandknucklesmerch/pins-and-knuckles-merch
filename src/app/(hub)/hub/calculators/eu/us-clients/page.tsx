import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { CalculatorShell } from "@/features/calculators/components/CalculatorShell";
import { EuCalculator } from "@/features/calculators/components/EuCalculator";
import { loadEuCalculatorReferenceData } from "@/features/calculators/data/calculatorRepository";
import { createClient } from "@/lib/supabase/server";

export default function UsClientsCalculatorPage() {
  return <Suspense fallback={<LoadingState label="Loading EU US Clients" />}><Content /></Suspense>;
}

async function Content() {
  try {
    const data = await loadEuCalculatorReferenceData(await createClient(), "EU_US_CLIENTS");
    return <AppShell><CalculatorShell title="EU US Clients"><EuCalculator referenceData={data} profileCode="EU_US_CLIENTS" /></CalculatorShell></AppShell>;
  } catch (error) {
    return <AppShell><CalculatorShell title="EU US Clients"><ErrorState title="Calculator unavailable" message={error instanceof Error ? error.message : "Reference data failed"} /></CalculatorShell></AppShell>;
  }
}
