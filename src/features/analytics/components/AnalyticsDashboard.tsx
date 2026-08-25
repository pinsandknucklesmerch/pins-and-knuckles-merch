import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import type { AnalyticsView } from "../types";

const ANALYTICS_TABS: Array<{ view: AnalyticsView; label: string }> = [
  { view: "overview", label: "Overview" },
  { view: "website", label: "Website" },
  { view: "social-media", label: "Social Media" },
];

function viewHref(view: AnalyticsView) {
  return view === "overview" ? "/hub/analytics" : `/hub/analytics?view=${view}`;
}

function AnalyticsTabs({ activeView }: { activeView: AnalyticsView }) {
  return (
    <nav aria-label="Analytics views" className="overflow-x-auto">
      <div className="flex min-w-max gap-1">
        {ANALYTICS_TABS.map((tab) => {
          const active = tab.view === activeView;
          return (
            <Link
              key={tab.view}
              href={viewHref(tab.view)}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function WebsiteView() {
  return (
    <Panel title="Website analytics">
      <EmptyState
        title="Google Analytics 4 is not connected"
        description="Website reporting will be available after Google Analytics 4 is connected."
      />
    </Panel>
  );
}

function SocialMediaView() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Panel title="Instagram">
        <EmptyState title="Instagram is not connected" />
      </Panel>
      <Panel title="Facebook">
        <EmptyState title="Facebook is not connected" />
      </Panel>
    </div>
  );
}

export function AnalyticsDashboard({ activeView }: { activeView: AnalyticsView }) {
  return (
    <div className="grid min-w-0 gap-4">
      <AnalyticsTabs activeView={activeView} />
      {activeView === "website" ? <WebsiteView /> : null}
      {activeView === "social-media" ? <SocialMediaView /> : null}
      {activeView === "overview" ? (
        <Panel>
          <EmptyState
            title="Analytics sources are not connected"
            description="Connect Google Analytics 4, Instagram, and Facebook to begin reporting."
          />
        </Panel>
      ) : null}
    </div>
  );
}
