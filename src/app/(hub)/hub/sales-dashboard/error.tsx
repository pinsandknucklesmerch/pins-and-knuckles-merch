"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function SalesDashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid gap-3">
      <ErrorState title="Sales dashboard unavailable" message="Try loading the dashboard again." />
      <button className="h-9 justify-self-start rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="button" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
