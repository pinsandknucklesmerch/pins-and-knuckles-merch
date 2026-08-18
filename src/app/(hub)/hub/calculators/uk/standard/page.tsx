import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { CalculatorShell } from "@/features/calculators/components/CalculatorShell";
import { UkStandardCalculator } from "@/features/calculators/components/UkStandardCalculator";
import { loadUkStandardCalculatorReferenceData } from "@/features/calculators/data/calculatorRepository";
import { createClient } from "@/lib/supabase/server";

export default function UkStandardPage() {
  return <Suspense fallback={<LoadingState label="Loading UK Standard" />}><Content /></Suspense>;
}

async function Content() {
  try {
    const data = await loadUkStandardCalculatorReferenceData(await createClient());
    return <AppShell><CalculatorShell title="UK Standard"><UkStandardCalculator referenceData={data} /></CalculatorShell></AppShell>;
  } catch (error) {
    return <AppShell><CalculatorShell title="UK Standard"><ErrorState title="Calculator unavailable" message={error instanceof Error ? error.message : "Reference data failed"} /></CalculatorShell></AppShell>;
  }
}
