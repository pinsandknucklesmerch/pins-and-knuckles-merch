import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { CalculatorShell } from "@/features/calculators/components/CalculatorShell";
import { UkTradeCalculator } from "@/features/calculators/components/UkTradeCalculator";
import { loadUkTradeCalculatorReferenceData } from "@/features/calculators/data/calculatorRepository";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
export default function UkTradePage() { return <Suspense fallback={<LoadingState label="Loading UK Trade" />}><Content /></Suspense>; }
async function Content() { const access = await getCurrentPinsHubAccess(); if (!access.access) return <AppShell pinsHubAccess={access}><CalculatorShell title="UK Trade">{null}</CalculatorShell></AppShell>; try { const data = await loadUkTradeCalculatorReferenceData(await createClient()); return <AppShell pinsHubAccess={access}><CalculatorShell title="UK Trade"><UkTradeCalculator referenceData={data} /></CalculatorShell></AppShell>; } catch (error) { return <AppShell pinsHubAccess={access}><CalculatorShell title="UK Trade"><ErrorState title="Calculator unavailable" message={error instanceof Error ? error.message : "Reference data failed"} /></CalculatorShell></AppShell>; } }
