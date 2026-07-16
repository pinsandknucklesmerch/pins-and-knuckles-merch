import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { Panel } from "@/components/ui/Panel";

export default function CalculatorsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading calculators" />}>
      <AppShell>
        <PageHeader title="Calculators" />
        <Panel title="Regions">
          <div className="flex flex-wrap gap-2">
            <ActionButton href="/hub/calculators/eu">EU</ActionButton>
          </div>
        </Panel>
      </AppShell>
    </Suspense>
  );
}
