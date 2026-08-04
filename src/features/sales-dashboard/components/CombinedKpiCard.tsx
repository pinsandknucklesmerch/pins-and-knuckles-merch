"use client";

import type { CSSProperties } from "react";
import { Surface } from "@/components/ui/Surface";
import type { MetricResult } from "../domain/types";
import { formatPercentagePoints, previousYearComparisonState, targetBullet } from "../lib/metricDisplay";
import { ComparisonBadge } from "./ComparisonBadge";
import { RevGauge } from "./RevGauge";
import styles from "./CombinedKpiCard.module.css";

function value(metric: MetricResult) {
  if (metric.value === null) return "—";
  return metric.format === "percent"
    ? formatPercentagePoints(metric.value)
    : metric.value.toLocaleString("en-GB", { maximumFractionDigits: metric.format === "currency" ? 2 : 0 });
}

function target(metric: MetricResult) {
  const bullet = targetBullet(metric.value, metric.target);
  if (metric.target === null || metric.targetProgress === null || !bullet) return null;
  const display = metric.format === "percent" ? formatPercentagePoints(metric.target) : metric.target.toLocaleString("en-GB");
  return { display, progress: metric.targetProgress, bullet };
}

function KpiSection({ metric, divided, className, gaugeAnimationKey, gaugeAnimationDelayMs, gaugeInteractive, gaugeTvMode, tvEnterIndex }: { metric: MetricResult; divided?: boolean; className?: string; gaugeAnimationKey?: string | number; gaugeAnimationDelayMs?: number; gaugeInteractive?: boolean; gaugeTvMode?: boolean; tvEnterIndex?: number }) {
  const metricTarget = target(metric);
  const state = previousYearComparisonState(metric.value, metric.previousYear);
  return (
    <section className={`${divided ? styles.divided : styles.section} ${className ?? ""}`} aria-label={metric.label} data-tv-group={gaugeAnimationKey !== undefined ? metric.code : undefined} style={gaugeAnimationKey !== undefined ? { "--tv-enter-index": tvEnterIndex ?? 0 } as CSSProperties : undefined}>
      <div className={styles.metricLabel}>{metric.label}</div>
      <div className={styles.value}>{value(metric)}</div>
      {metricTarget ? (
        <div className={styles.target}>
          <div className={styles.targetRow}><span>Target {metricTarget.display}</span><span>{metric.targetProgress?.toFixed(1)}%</span></div>
          <RevGauge
            value={metricTarget.bullet.value}
            target={metricTarget.bullet.target}
            max={metricTarget.bullet.max}
            progress={metricTarget.progress}
            format={metric.format}
            label={metric.label}
            animationKey={gaugeAnimationKey}
            animationDelayMs={gaugeAnimationDelayMs}
            interactive={gaugeInteractive}
            tvMode={gaugeTvMode}
          />
        </div>
      ) : null}
      {metric.previousYear === null ? (
        <div className={styles.reference}>No previous-year comparison</div>
      ) : (
        <div className={styles.comparison}>
          <span>Last year {metric.format === "percent" ? formatPercentagePoints(metric.previousYear) : metric.previousYear.toLocaleString("en-GB")}</span>
          <ComparisonBadge absoluteChange={metric.format === "percent" ? null : metric.difference} percentagePointChange={metric.format === "percent" ? metric.difference : null} percentageChange={metric.percentageChange} state={state} />
        </div>
      )}
    </section>
  );
}

export function CombinedKpiCard({ title, first, second, third, gaugeAnimationKey, gaugeAnimationDelayMs, gaugeInteractive = true, tvMode = false, tvEnterIndex = 1 }: { title?: string; first: MetricResult; second?: MetricResult; third?: MetricResult; gaugeAnimationKey?: string | number; gaugeAnimationDelayMs?: number; gaugeInteractive?: boolean; tvMode?: boolean; tvEnterIndex?: number }) {
  const metricCountClass = third && second ? styles.triple : second ? styles.double : styles.single;

  return (
    <Surface variant="metric" className={`${styles.card} ${tvMode ? styles.tvCard : ""}`} data-tv-group={gaugeAnimationKey !== undefined ? "overview-performance" : undefined} style={gaugeAnimationKey !== undefined ? { "--tv-enter-index": tvEnterIndex } as CSSProperties : undefined}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      <div className={`${title ? styles.sections : styles.sectionsWithoutTitle} ${metricCountClass}`}>
        <KpiSection metric={first} gaugeAnimationKey={gaugeAnimationKey} gaugeAnimationDelayMs={gaugeAnimationDelayMs} gaugeInteractive={gaugeInteractive} gaugeTvMode={tvMode} tvEnterIndex={0} />
        {second ? <KpiSection metric={second} divided gaugeAnimationKey={gaugeAnimationKey} gaugeAnimationDelayMs={gaugeAnimationDelayMs} gaugeInteractive={gaugeInteractive} gaugeTvMode={tvMode} tvEnterIndex={1} /> : null}
        {third && second ? <KpiSection metric={third} divided className={styles.trailing} gaugeAnimationKey={gaugeAnimationKey} gaugeAnimationDelayMs={gaugeAnimationDelayMs} gaugeInteractive={gaugeInteractive} gaugeTvMode={tvMode} tvEnterIndex={2} /> : null}
      </div>
    </Surface>
  );
}
