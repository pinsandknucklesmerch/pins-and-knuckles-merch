import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { AnalyticsMetricCard } from "./AnalyticsMetricCard";
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

function Acquisition({ report }: { report: Ga4WebsiteAnalyticsReport }) {
  return <Panel title="Traffic acquisition" className={styles.acquisitionPanel}>
    {report.acquisitionChannels.length ? <ul className={styles.breakdown}>{report.acquisitionChannels.map((channel) => <li key={channel.channel}><span>{channel.channel}</span><strong>{formatNumber(channel.sessions)}</strong></li>)}</ul> : <EmptyState title="No traffic acquisition data" />}
  </Panel>;
}

function TopPages({ report }: { report: Ga4WebsiteAnalyticsReport }) {
  return <Panel title="Top pages" className="min-w-0">
    {report.topPages.length ? <div className="overflow-x-auto"><table className={styles.pages}><caption className="sr-only">Top website pages by page views</caption><thead><tr><th>Page</th><th className="text-right">Page views</th></tr></thead><tbody>{report.topPages.map((page, index) => <tr key={`${page.path ?? page.title}-${index}`}><td><span>{page.title}</span>{page.path ? <small>{page.path}</small> : null}</td><td className="text-right tabular-nums">{formatNumber(page.pageViews)}</td></tr>)}</tbody></table></div> : <EmptyState title="No page data" />}
  </Panel>;
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
    <div className={styles.lower}><Acquisition report={report} /><TopPages report={report} /></div>
  </div>;
}
