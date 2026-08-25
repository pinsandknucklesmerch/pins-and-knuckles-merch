import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsDashboard } from "@/features/analytics/components/AnalyticsDashboard";
import { parseAnalyticsView } from "@/features/analytics/lib/view";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <AppShell>
      <PageHeader title="Analytics" />
      <AnalyticsDashboard activeView={parseAnalyticsView(first(params.view))} />
    </AppShell>
  );
}
