import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Panel } from "@/components/ui/Panel";
import Link from "next/link";

export default function HubPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading hub" />}>
      <AppShell>
        <PageHeader
          title="Dashboard"
          description="Initial workspace shell for the Pins Hub rebuild."
        />
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <Panel title="Workspace">
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                className="rounded-md border border-border bg-background px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                href="/hub/sales-dashboard"
              >
                Sales Dashboard
              </Link>
              <EmptyState title="No modules connected" />
            </div>
          </Panel>
          <Panel title="Status">
            <dl className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Auth</dt>
                <dd className="font-medium text-foreground">Supabase</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Database</dt>
                <dd className="font-medium text-foreground">Supabase</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Storage</dt>
                <dd className="font-medium text-muted-foreground">Later</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </AppShell>
    </Suspense>
  );
}
