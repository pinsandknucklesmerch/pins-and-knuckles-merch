import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { CalculatorShell } from "@/features/calculators/components/CalculatorShell";
import { UkTradeCalculator } from "@/features/calculators/components/UkTradeCalculator";
import { loadUkTradeCalculatorReferenceData } from "@/features/calculators/data/calculatorRepository";
import { createClient } from "@/lib/supabase/server";
export default function UkTradePage() { return <Suspense fallback={<LoadingState label="Loading UK Trade" />}><Content /></Suspense>; }
async function Content() { try { const data = await loadUkTradeCalculatorReferenceData(await createClient()); return <AppShell><CalculatorShell title="UK Trade"><UkTradeCalculator referenceData={data} /></CalculatorShell></AppShell>; } catch (error) { return <AppShell><CalculatorShell title="UK Trade"><ErrorState title="Calculator unavailable" message={error instanceof Error ? error.message : "Reference data failed"} /></CalculatorShell></AppShell>; } }
