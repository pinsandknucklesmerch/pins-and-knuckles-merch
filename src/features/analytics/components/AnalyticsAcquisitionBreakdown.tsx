import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import type { Ga4WebsiteAnalyticsReport } from "../server/ga4";
import styles from "./AnalyticsAcquisitionBreakdown.module.css";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

export function AnalyticsAcquisitionBreakdown({ channels }: { channels: Ga4WebsiteAnalyticsReport["acquisitionChannels"] }) {
  const sortedChannels = [...channels].sort((left, right) => right.sessions - left.sessions);
  const totalSessions = sortedChannels.reduce((total, channel) => total + channel.sessions, 0);
  const largestSessions = Math.max(1, ...sortedChannels.map((channel) => channel.sessions));

  return <Panel title="Traffic acquisition" className={styles.panel}>
    {sortedChannels.length ? <ul className={styles.list}>
      {sortedChannels.map((channel) => {
        const share = totalSessions ? (channel.sessions / totalSessions) * 100 : 0;
        const width = (channel.sessions / largestSessions) * 100;
        return <li key={channel.channel} className={styles.item}>
          <div className={styles.labelRow}><span title={channel.channel}>{channel.channel}</span><strong>{formatNumber(channel.sessions)}</strong></div>
          <div className={styles.barRow}><div className={styles.track} role="progressbar" aria-label={`${channel.channel} sessions`} aria-valuemin={0} aria-valuemax={largestSessions} aria-valuenow={channel.sessions}><div className={styles.bar} style={{ width: `${width}%` }} /></div><small>{share.toFixed(0)}%</small></div>
        </li>;
      })}
    </ul> : <EmptyState title="No traffic acquisition data" />}
  </Panel>;
}
