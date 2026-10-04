import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { CalculatorShell } from "@/features/calculators/components/CalculatorShell";
import { EuCalculator } from "@/features/calculators/components/EuCalculator";
import { loadEuCalculatorReferenceData } from "@/features/calculators/data/calculatorRepository";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";

export default function UsClientsCalculatorPage() {
  return <Suspense fallback={<LoadingState label="Loading EU US Clients" />}><Content /></Suspense>;
}

async function Content() {
  const access = await getCurrentPinsHubAccess();
  if (!access.access) return <AppShell pinsHubAccess={access} wideContent><CalculatorShell title="EU US Clients">{null}</CalculatorShell></AppShell>;

  try {
    const data = await loadEuCalculatorReferenceData(await createClient(), "EU_US_CLIENTS");
    return <AppShell pinsHubAccess={access} wideContent><CalculatorShell title="EU US Clients"><EuCalculator referenceData={data} profileCode="EU_US_CLIENTS" /></CalculatorShell></AppShell>;
  } catch (error) {
    return <AppShell pinsHubAccess={access}><CalculatorShell title="EU US Clients"><ErrorState title="Calculator unavailable" message={error instanceof Error ? error.message : "Reference data failed"} /></CalculatorShell></AppShell>;
  }
}
