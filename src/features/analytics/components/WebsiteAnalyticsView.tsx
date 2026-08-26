import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { AnalyticsAcquisitionBreakdown } from "./AnalyticsAcquisitionBreakdown";
import { AnalyticsMetricCard } from "./AnalyticsMetricCard";
import { AnalyticsTopPages } from "./AnalyticsTopPages";
import { AnalyticsTrafficOverview } from "./AnalyticsTrafficOverview";
import type { Ga4WebsiteAnalyticsReport } from "../server/ga4";
import styles from "./WebsiteAnalyticsView.module.css";

type WebsiteMetric = { key: "activeUsers" | "sessions" | "pageViews" | "engagementRate"; label: string; value: number; previous: number | undefined; format: "number" | "percent" };

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

function formatMetric(value: number, format: WebsiteMetric["format"]) {
  return format === "percent" ? new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 }).format(value) : formatNumber(value);
}

function comparison(current: number, previous: number | undefined) {
  if (previous === undefined) return null;
  if (previous === 0) return current === 0 ? { value: "0.0%", tone: "neutral" } as const : null;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  if (!Number.isFinite(change)) return null;
  return { value: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`, tone: change > 0 ? "positive" : change < 0 ? "negative" : "neutral" } as const;
}

export function WebsiteAnalyticsView({ report }: { report: Ga4WebsiteAnalyticsReport }) {
  if (!report.hasData) return <Panel><EmptyState title="No website analytics data" description="GA4 did not return data for this period." /></Panel>;
  const previous = report.previousMetrics;
  const metrics: WebsiteMetric[] = [
    { key: "activeUsers", label: "Active Users", value: report.metrics.activeUsers, previous: previous?.activeUsers, format: "number" },
    { key: "sessions", label: "Sessions", value: report.metrics.sessions, previous: previous?.sessions, format: "number" },
    { key: "pageViews", label: "Page Views", value: report.metrics.pageViews, previous: previous?.pageViews, format: "number" },
    { key: "engagementRate", label: "Engagement Rate", value: report.metrics.engagementRate, previous: previous?.engagementRate, format: "percent" },
  ];

  return <div className={styles.root}>
    <section className={styles.kpis} aria-label="Website metrics">{metrics.map((metric) => <AnalyticsMetricCard key={metric.key} label={metric.label} value={formatMetric(metric.value, metric.format)} change={comparison(metric.value, metric.previous)} trend={report.dailyTraffic.map((point) => point[metric.key])} />)}</section>
    <AnalyticsTrafficOverview report={report} />
    <div className={styles.lower}><AnalyticsAcquisitionBreakdown channels={report.acquisitionChannels} /><AnalyticsTopPages pages={report.topPages} /></div>
  </div>;
}
