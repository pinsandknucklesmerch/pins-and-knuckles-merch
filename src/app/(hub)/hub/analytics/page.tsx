import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsDashboard } from "@/features/analytics/components/AnalyticsDashboard";
import { parseWebsiteAnalyticsPeriod } from "@/features/analytics/lib/period";
import { parseAnalyticsView } from "@/features/analytics/lib/view";
import { Ga4ConfigurationError, getGa4WebsiteAnalyticsReport, type Ga4WebsiteAnalyticsReport } from "@/features/analytics/server/ga4";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeView = parseAnalyticsView(first(params.view));
  const period = parseWebsiteAnalyticsPeriod(first(params.period));
  let websiteReport: Ga4WebsiteAnalyticsReport | null = null;
  let websiteError: "configuration" | "unavailable" | null = null;

  if (activeView === "website") {
    try {
      websiteReport = await getGa4WebsiteAnalyticsReport(period);
    } catch (error) {
      websiteError = error instanceof Ga4ConfigurationError ? "configuration" : "unavailable";
    }
  }

  return (
    <AppShell>
      <PageHeader title="Analytics" />
      <AnalyticsDashboard activeView={activeView} period={period} websiteReport={websiteReport} websiteError={websiteError} />
    </AppShell>
  );
}
