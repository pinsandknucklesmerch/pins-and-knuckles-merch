import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { Panel } from "@/components/ui/Panel";

export default function EuCalculatorsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading EU calculators" />}>
      <AppShell>
        <PageHeader title="EU Calculators" />
        <Panel title="Profiles">
          <div className="flex flex-wrap gap-2">
            <ActionButton href="/hub/calculators/eu/standard">
              EU Standard
            </ActionButton>
          </div>
        </Panel>
      </AppShell>
    </Suspense>
  );
}
