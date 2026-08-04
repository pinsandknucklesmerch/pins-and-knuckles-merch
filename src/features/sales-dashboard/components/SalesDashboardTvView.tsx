"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_MONTHS } from "../types";
import type { MetricResult, SalesDashboardData } from "../domain/types";
import type { TvSlide } from "../lib/tvMode";
import { nextTvView, previousTvView, TV_DATA_REFRESH_INTERVAL_MS, TV_ROTATION_INTERVAL_MS, TV_VIEWS } from "../lib/tvMode";
import { CombinedKpiCard } from "./CombinedKpiCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProfitShirtKpi } from "./ProfitShirtKpi";
import { SnuggleView } from "./SnuggleView";
import { TeamMemberKpiView } from "./TeamMemberKpiView";
import { YearComparisonChart } from "./YearComparisonChart";
import { YearToDateView } from "./YearToDateView";
import styles from "./SalesDashboardTvView.module.css";

const VIEW_LABELS: Record<TvSlide, string> = {
  "profit-overview": "Profit Overview",
  "sales-activity": "Sales Activity",
  ytd: "Year to Date",
  "year-comparison": "Year Comparison",
  snuggle: "Snuggle",
};

type SalesDashboardTvViewProps = {
  data: SalesDashboardData;
  year: number;
  month: number;
  view: "company" | "members";
  member?: string;
  companyMetrics: MetricResult[];
  monthlyProfitMetric: MetricResult;
};

function metricByCode(metrics: MetricResult[], code: MetricResult["code"]) {
  const metric = metrics.find((candidate) => candidate.code === code);
  if (!metric) throw new Error(`Missing TV metric ${code}.`);
  return metric;
}

export function SalesDashboardTvView({ data, year, month, view, member, companyMetrics, monthlyProfitMetric }: SalesDashboardTvViewProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<TvSlide>(TV_VIEWS[0]);
  const [cycleKey, setCycleKey] = useState(0);
  const [pointerOver, setPointerOver] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const paused = pointerOver || focusWithin || documentHidden;
  const viewLabel = VIEW_LABELS[activeView];
  const monthLabel = DASHBOARD_MONTHS[month - 1] ?? "Current month";

  const changeView = useCallback((nextView: TvSlide) => {
    setActiveView(nextView);
    setCycleKey((current) => current + 1);
  }, []);

  const moveNext = useCallback(() => changeView(nextTvView(activeView)), [activeView, changeView]);
  const movePrevious = useCallback(() => changeView(previousTvView(activeView)), [activeView, changeView]);

  useEffect(() => {
    if (paused) return;
    const timeout = window.setTimeout(moveNext, TV_ROTATION_INTERVAL_MS);
    return () => window.clearTimeout(timeout);
  }, [activeView, moveNext, paused]);

  useEffect(() => {
    const updateVisibility = () => setDocumentHidden(document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (documentHidden) return;
    const refreshTimer = window.setTimeout(() => router.refresh(), TV_DATA_REFRESH_INTERVAL_MS);
    return () => window.clearTimeout(refreshTimer);
  }, [documentHidden, router]);

  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(document.fullscreenElement !== null);
    setCanFullscreen("requestFullscreen" in document.documentElement && "exitFullscreen" in document);
    updateFullscreen();
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!canFullscreen) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setIsFullscreen(document.fullscreenElement !== null);
    }
  }, [canFullscreen]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      movePrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveNext();
    }
  }, [moveNext, movePrevious]);

  const viewContent = useMemo(() => {
    if (activeView === "profit-overview") return <section className={styles.profitSlide} data-tv-view="profit-overview">
      <div className={styles.slideHeading} data-tv-group="profit-heading" style={{ "--tv-enter-index": 0 } as CSSProperties}><h2>{VIEW_LABELS[activeView]}</h2><span>{monthLabel} {year}</span></div>
      <div className={styles.profitCard} data-tv-group="profit-card" style={{ "--tv-enter-index": 1 } as CSSProperties}><ProfitShirtKpi metric={monthlyProfitMetric} animationKey={cycleKey} /></div>
    </section>;
    if (activeView === "sales-activity") {
      const quotes = metricByCode(companyMetrics, "QUOTES_DONE");
      const orders = metricByCode(companyMetrics, "ORDERS_PROCESSED");
      const conversion = metricByCode(companyMetrics, "CONVERSION_RATE");
      return <section className={styles.activitySlide} data-tv-view="sales-activity">
        <div className={styles.slideHeading} data-tv-group="activity-heading" style={{ "--tv-enter-index": 0 } as CSSProperties}><h2>{VIEW_LABELS[activeView]}</h2><span>{monthLabel} {year}</span></div>
        <div data-tv-group="activity-card" style={{ "--tv-enter-index": 1 } as CSSProperties}><CombinedKpiCard first={quotes} second={orders} third={conversion} gaugeAnimationKey={cycleKey} gaugeAnimationDelayMs={120} gaugeInteractive={false} tvMode /></div>
      </section>;
    }
    if (activeView === "snuggle") return <SnuggleView data={data.snuggle} year={year} month={month} view={view} member={member} tvMode />;
    if (activeView === "ytd") return <YearToDateView data={data.yearToDate} tvMode />;
    if (activeView === "year-comparison") return <YearComparisonChart comparison={data.yearComparison} showControls={false} tvMode />;
    return data.members.length ? <TeamMemberKpiView rows={data.members} selectedKey={member} query={{ year, month }} /> : <EmptyState title="No team member data" />;
  }, [activeView, companyMetrics, cycleKey, data, member, month, monthLabel, monthlyProfitMetric, view, year]);

  return (
    <div
      className={styles.tvRoot}
      data-paused={paused ? "true" : "false"}
      onPointerEnter={() => setPointerOver(true)}
      onPointerLeave={() => setPointerOver(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
      }}
      onKeyDown={handleKeyDown}
    >
      <header className={styles.tvHeader}>
        <Image className={styles.brand} src="/branding/P&K_LOGO.png" alt="Pins & Knuckles" width={180} height={48} priority />
        <div className={styles.headerMeta}>
          <span className={styles.eyebrow}>Sales Dashboard · TV</span>
          <strong className={styles.title}>{viewLabel}</strong>
          <span className={styles.date}>{monthLabel} {year}</span>
        </div>
      </header>

      <main className={styles.stage} aria-live="polite">
        <div className={`${styles.view} ${styles.tvEnter}`} key={`${activeView}-${cycleKey}`}>
          {viewContent}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.progressTrack} aria-hidden="true"><div key={cycleKey} className={styles.progressFill} /></div>
        <div className={styles.controls}>
          <span className={styles.viewName}>{viewLabel} · {paused ? "Paused" : "Rotating"}</span>
          <div className={styles.buttonGroup}>
            <button className={styles.controlButton} type="button" onClick={movePrevious} aria-label="Previous TV view"><ChevronLeft size={14} aria-hidden="true" />Previous</button>
            <button className={styles.controlButton} type="button" onClick={moveNext} aria-label="Next TV view">Next<ChevronRight size={14} aria-hidden="true" /></button>
            <button className={styles.controlButton} type="button" onClick={toggleFullscreen} disabled={!canFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>{isFullscreen ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}{isFullscreen ? "Exit" : "Fullscreen"}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
