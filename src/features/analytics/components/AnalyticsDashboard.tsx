import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Panel } from "@/components/ui/Panel";
import type { Ga4WebsiteAnalyticsReport } from "../server/ga4";
import type { AnalyticsView, WebsiteAnalyticsPeriod } from "../types";
import { WebsiteAnalyticsView } from "./WebsiteAnalyticsView";

const ANALYTICS_TABS: Array<{ view: AnalyticsView; label: string }> = [
  { view: "overview", label: "Overview" },
  { view: "website", label: "Website" },
  { view: "social-media", label: "Social Media" },
];

function viewHref(view: AnalyticsView, period: WebsiteAnalyticsPeriod) {
  return view === "overview" ? "/hub/analytics" : view === "website" ? `/hub/analytics?view=website&period=${period}` : `/hub/analytics?view=${view}`;
}

function AnalyticsTabs({ activeView, period }: { activeView: AnalyticsView; period: WebsiteAnalyticsPeriod }) {
  return (
    <nav aria-label="Analytics views" className="overflow-x-auto">
      <div className="flex min-w-max gap-1">
        {ANALYTICS_TABS.map((tab) => {
          const active = tab.view === activeView;
          return (
            <Link
              key={tab.view}
              href={viewHref(tab.view, period)}
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

function WebsiteView({ period, report, error }: { period: WebsiteAnalyticsPeriod; report: Ga4WebsiteAnalyticsReport | null; error: "configuration" | "unavailable" | null }) {
  return <div className="grid gap-2">
    <nav aria-label="Website analytics period" className="overflow-x-auto">
      <div className="flex min-w-max gap-1">
        {[7, 30, 90].map((days) => <Link key={days} href={`/hub/analytics?view=website&period=${days}`} aria-current={period === days ? "page" : undefined} className={`flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${period === days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"}`}>Last {days} days</Link>)}
      </div>
    </nav>
    {error === "configuration" ? <Panel><ErrorState title="Website Analytics is not configured" message="GA4 reporting is unavailable until its server configuration is complete." /></Panel> : null}
    {error === "unavailable" ? <Panel><ErrorState title="Website Analytics is temporarily unavailable" message="Please try again shortly." /></Panel> : null}
    {report ? <WebsiteAnalyticsView report={report} /> : null}
  </div>;
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

export function AnalyticsDashboard({ activeView, period, websiteReport, websiteError }: { activeView: AnalyticsView; period: WebsiteAnalyticsPeriod; websiteReport: Ga4WebsiteAnalyticsReport | null; websiteError: "configuration" | "unavailable" | null }) {
  return (
    <div className="grid min-w-0 gap-3">
      <AnalyticsTabs activeView={activeView} period={period} />
      {activeView === "website" ? <WebsiteView period={period} report={websiteReport} error={websiteError} /> : null}
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
