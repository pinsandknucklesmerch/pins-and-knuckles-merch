import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { CalculatorShell } from "@/features/calculators/components/CalculatorShell";
import { EuCalculator } from "@/features/calculators/components/EuCalculator";
import { loadEuCalculatorReferenceData } from "@/features/calculators/data/calculatorRepository";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";

export default function EuStandardCalculatorPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading EU Standard" />}>
      <EuStandardCalculatorPageContent />
    </Suspense>
  );
}

async function EuStandardCalculatorPageContent() {
  const access = await getCurrentPinsHubAccess();
  if (!access.access) return <AppShell pinsHubAccess={access} wideContent><CalculatorShell title="EU Standard">{null}</CalculatorShell></AppShell>;

  const supabase = await createClient();

  try {
    const referenceData = await loadEuCalculatorReferenceData(
      supabase,
      "EU_STANDARD",
    );

    return (
      <AppShell pinsHubAccess={access} wideContent>
        <CalculatorShell title="EU Standard">
          <EuCalculator referenceData={referenceData} />
        </CalculatorShell>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell pinsHubAccess={access} wideContent>
        <CalculatorShell title="EU Standard">
          <ErrorState
            title="Calculator unavailable"
            message={error instanceof Error ? error.message : "Reference data failed"}
          />
        </CalculatorShell>
      </AppShell>
    );
  }
}
