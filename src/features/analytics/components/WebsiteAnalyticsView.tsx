import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import type { Ga4WebsiteAnalyticsReport } from "../server/ga4";
import styles from "./WebsiteAnalyticsView.module.css";

type WebsiteMetric = { label: string; value: number; previous: number | undefined; format: "number" | "percent" };

const CHART_BOX = { width: 760, height: 272, left: 52, right: 22, top: 22, bottom: 44 };

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return formatNumber(value);
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

function MetricCard({ metric }: { metric: WebsiteMetric }) {
  const change = comparison(metric.value, metric.previous);
  return <article className={styles.metricCard}>
    <span>{metric.label}</span>
    <strong>{formatMetric(metric.value, metric.format)}</strong>
    <small className={change ? styles[change.tone] : undefined}>{change?.value ?? "—"}</small>
  </article>;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function axisTickIndexes(length: number) {
  const count = Math.min(length, 7);
  if (count <= 1) return [0];
  return Array.from({ length: count }, (_, index) => Math.round((index * (length - 1)) / (count - 1)));
}

function TrafficTrend({ report }: { report: Ga4WebsiteAnalyticsReport }) {
  const points = report.dailyTraffic;
  const maximum = Math.max(1, ...points.flatMap((point) => [point.sessions, point.activeUsers]));
  const yMaximum = Math.ceil(maximum / 4) * 4;
  const plotWidth = CHART_BOX.width - CHART_BOX.left - CHART_BOX.right;
  const plotHeight = CHART_BOX.height - CHART_BOX.top - CHART_BOX.bottom;
  const x = (index: number) => CHART_BOX.left + (points.length <= 1 ? plotWidth / 2 : (plotWidth / (points.length - 1)) * index);
  const y = (value: number) => CHART_BOX.top + plotHeight - (value / yMaximum) * plotHeight;
  const path = (key: "sessions" | "activeUsers") => points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(point[key]).toFixed(2)}`).join(" ");

  return <Panel className={styles.trendPanel}>
    <header className={styles.chartHeader}><h2>Traffic trend</h2><div className={styles.legend} aria-label="Traffic trend legend"><span className={styles.sessionsSwatch} />Sessions<span className={styles.usersSwatch} />Active Users</div></header>
    {points.length ? <div className={styles.chartFrame}><svg className={styles.chart} viewBox={`0 0 ${CHART_BOX.width} ${CHART_BOX.height}`} role="img" aria-label="Daily sessions and active users">
      {Array.from({ length: 5 }, (_, index) => {
        const value = (yMaximum / 4) * index;
        const lineY = y(value);
        return <g key={value}><line className={index === 0 ? styles.baseline : styles.gridLine} x1={CHART_BOX.left} x2={CHART_BOX.width - CHART_BOX.right} y1={lineY} y2={lineY} /><text className={styles.axisLabel} x={CHART_BOX.left - 8} y={lineY + 3} textAnchor="end">{formatCompactNumber(value)}</text></g>;
      })}
      {axisTickIndexes(points.length).map((index) => <text key={points[index].date} className={styles.dateLabel} x={x(index)} y={CHART_BOX.height - 12}>{dateLabel(points[index].date)}</text>)}
      <path className={styles.sessionsLine} d={path("sessions")} />
      <path className={styles.usersLine} d={path("activeUsers")} />
    </svg></div> : <EmptyState title="No daily traffic data" />}
  </Panel>;
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
    { label: "Active Users", value: report.metrics.activeUsers, previous: previous?.activeUsers, format: "number" },
    { label: "Sessions", value: report.metrics.sessions, previous: previous?.sessions, format: "number" },
    { label: "Page Views", value: report.metrics.pageViews, previous: previous?.pageViews, format: "number" },
    { label: "Engagement Rate", value: report.metrics.engagementRate, previous: previous?.engagementRate, format: "percent" },
  ];

  return <div className={styles.root}>
    <section className={styles.kpis} aria-label="Website metrics">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</section>
    <TrafficTrend report={report} />
    <div className={styles.lower}><Acquisition report={report} /><TopPages report={report} /></div>
  </div>;
}
