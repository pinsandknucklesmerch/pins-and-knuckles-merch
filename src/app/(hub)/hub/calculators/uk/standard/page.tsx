import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { CalculatorShell } from "@/features/calculators/components/CalculatorShell";
import { UkStandardCalculator } from "@/features/calculators/components/UkStandardCalculator";
import { loadUkStandardCalculatorReferenceData } from "@/features/calculators/data/calculatorRepository";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";

export default function UkStandardPage() {
  return <Suspense fallback={<LoadingState label="Loading UK Standard" />}><Content /></Suspense>;
}

async function Content() {
  const access = await getCurrentPinsHubAccess();
  if (!access.access) return <AppShell pinsHubAccess={access}><CalculatorShell title="UK Standard">{null}</CalculatorShell></AppShell>;

  try {
    const data = await loadUkStandardCalculatorReferenceData(await createClient());
    return <AppShell pinsHubAccess={access}><CalculatorShell title="UK Standard"><UkStandardCalculator referenceData={data} /></CalculatorShell></AppShell>;
  } catch (error) {
    return <AppShell pinsHubAccess={access}><CalculatorShell title="UK Standard"><ErrorState title="Calculator unavailable" message={error instanceof Error ? error.message : "Reference data failed"} /></CalculatorShell></AppShell>;
  }
}
