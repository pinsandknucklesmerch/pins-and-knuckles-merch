"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import type { Ga4WebsiteAnalyticsReport } from "../server/ga4";
import styles from "./AnalyticsAcquisitionBreakdown.module.css";

const DONUT_SIZE = 184;
const DONUT_RADIUS = 62;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const SEGMENT_GAP = 3;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

export function AnalyticsAcquisitionBreakdown({ channels }: { channels: Ga4WebsiteAnalyticsReport["acquisitionChannels"] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const sortedChannels = [...channels].sort((left, right) => right.sessions - left.sessions);
  const totalSessions = sortedChannels.reduce((total, channel) => total + channel.sessions, 0);
  let offset = 0;
  const segments = sortedChannels.map((channel, index) => {
    const share = totalSessions ? channel.sessions / totalSessions : 0;
    const span = share * DONUT_CIRCUMFERENCE;
    const segment = { ...channel, index, share, offset, length: Math.max(0, span - (sortedChannels.length > 1 ? SEGMENT_GAP : 0)) };
    offset += span;
    return segment;
  });

  return <Panel title="Traffic acquisition" className={styles.panel}>
    {segments.length ? <div className={styles.content}>
      <div className={styles.donutWrap}>
        <svg className={styles.donut} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`} role="img" aria-label={`Traffic acquisition distribution, ${formatNumber(totalSessions)} sessions`}>
          <circle className={styles.donutTrack} cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS} />
          {segments.map((segment) => <circle key={segment.channel} className={`${styles.segment} ${styles[`segment${segment.index % 6}`]} ${hoveredIndex === segment.index ? styles.hovered : ""}`} cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS} strokeDasharray={`${segment.length} ${DONUT_CIRCUMFERENCE - segment.length}`} strokeDashoffset={-segment.offset} onPointerEnter={() => setHoveredIndex(segment.index)} onPointerLeave={() => setHoveredIndex(null)}>
            <title>{`${segment.channel}: ${formatNumber(segment.sessions)} sessions (${(segment.share * 100).toFixed(0)}%)`}</title>
          </circle>)}
        </svg>
        <div className={styles.donutCentre} aria-hidden="true"><strong>{formatNumber(totalSessions)}</strong><span>Sessions</span></div>
      </div>
      <ul className={styles.legend}>
        {segments.map((segment) => <li key={segment.channel} className={hoveredIndex === segment.index ? styles.legendHovered : undefined} onPointerEnter={() => setHoveredIndex(segment.index)} onPointerLeave={() => setHoveredIndex(null)}>
          <span className={`${styles.key} ${styles[`segment${segment.index % 6}`]}`} aria-hidden="true" />
          <span className={styles.channel} title={segment.channel}>{segment.channel}</span>
          <small>{(segment.share * 100).toFixed(0)}%</small>
          <strong>{formatNumber(segment.sessions)}</strong>
        </li>)}
      </ul>
    </div> : <EmptyState title="No traffic acquisition data" />}
  </Panel>;
}
