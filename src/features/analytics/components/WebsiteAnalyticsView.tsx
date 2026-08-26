"use client";

import { AreaChart, KpiCard, MetricProvider } from "metricui";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import type { Ga4WebsiteAnalyticsReport } from "../server/ga4";
import styles from "./WebsiteAnalyticsView.module.css";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

function TrafficTrend({ report }: { report: Ga4WebsiteAnalyticsReport }) {
  const data = report.dailyTraffic.map((point) => ({ date: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${point.date}T00:00:00Z`)), sessions: point.sessions, activeUsers: point.activeUsers }));

  return <Panel title="Traffic trend" className="min-w-0 overflow-hidden">
    {data.length ? <AreaChart data={data} index="date" categories={["sessions", "activeUsers"]} format={{ style: "number", compact: false, precision: 0 }} height={260} gradient={false} areaOpacity={0.1} enableGridX={false} enableGridY legend chartNullMode="gap" classNames={{ root: styles.chart }} /> : <EmptyState title="No daily traffic data" />}
  </Panel>;
}

function Acquisition({ report }: { report: Ga4WebsiteAnalyticsReport }) {
  return <Panel title="Traffic acquisition">
    {report.acquisitionChannels.length ? <ul className={styles.breakdown}>
      {report.acquisitionChannels.map((channel) => <li key={channel.channel}><span>{channel.channel}</span><strong>{formatNumber(channel.sessions)}</strong></li>)}
    </ul> : <EmptyState title="No traffic acquisition data" />}
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
  const metrics = [
    { title: "Active Users", value: report.metrics.activeUsers, previous: previous?.activeUsers, format: { style: "number" as const, compact: false, precision: 0 } },
    { title: "Sessions", value: report.metrics.sessions, previous: previous?.sessions, format: { style: "number" as const, compact: false, precision: 0 } },
    { title: "Page Views", value: report.metrics.pageViews, previous: previous?.pageViews, format: { style: "number" as const, compact: false, precision: 0 } },
    { title: "Engagement Rate", value: report.metrics.engagementRate, previous: previous?.engagementRate, format: { style: "percent" as const, percentInput: "decimal" as const, precision: 1 } },
  ];

  return <MetricProvider locale="en-GB" colorScheme="dark" animate dense texture={false} variant="default"><div className={styles.root}>
    <div className={styles.kpis}>{metrics.map((metric) => <KpiCard key={metric.title} title={metric.title} value={metric.value} format={metric.format} comparison={metric.previous === undefined ? undefined : { value: metric.previous, label: `vs previous ${report.periodDays} days` }} nullDisplay="dash" className={styles.kpi} />)}</div>
    <TrafficTrend report={report} />
    <div className={styles.lower}><Acquisition report={report} /><TopPages report={report} /></div>
  </div></MetricProvider>;
}
