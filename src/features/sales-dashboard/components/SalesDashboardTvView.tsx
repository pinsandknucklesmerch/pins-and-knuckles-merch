"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_MONTHS } from "../types";
import type { MetricResult, SalesDashboardData } from "../domain/types";
import type { TvSlide } from "../lib/tvMode";
import { buildNormalModeUrl, nextTvView, previousTvView, tvDurationMilliseconds, TV_DATA_REFRESH_INTERVAL_MS } from "../lib/tvMode";
import { safeTvSettings } from "../lib/tvSettings";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProfitShirtKpi } from "./ProfitShirtKpi";
import { SalesInboxKpi } from "./SalesInboxKpi";
import { SnuggleView } from "./SnuggleView";
import { YearComparisonChart } from "./YearComparisonChart";
import { YearToDateView } from "./YearToDateView";
import { TeamMembersTab } from "./TeamMembersTab";
import { LiveZooCamSlide } from "./LiveZooCamSlide";
import styles from "./SalesDashboardTvView.module.css";

const VIEW_LABELS: Record<TvSlide, string> = {
  overview: "Overview",
  ytd: "Year to Date",
  year_comparison: "Year Comparison",
  snuggle: "Snuggle",
  team_members: "Team Members",
  "live-zoo-cam": "Live Zoo Cam",
};

type SalesDashboardTvViewProps = {
  data: SalesDashboardData;
  year: number;
  month: number;
  companyMetrics: MetricResult[];
  monthlyProfitMetric: MetricResult;
  durationSeconds: number;
};

function metricByCode(metrics: MetricResult[], code: MetricResult["code"]) {
  const metric = metrics.find((candidate) => candidate.code === code);
  if (!metric) throw new Error(`Missing TV metric ${code}.`);
  return metric;
}

export function SalesDashboardTvView({ data, year, month, companyMetrics, monthlyProfitMetric, durationSeconds }: SalesDashboardTvViewProps) {
  const router = useRouter();
  const rotation = useMemo(() => safeTvSettings().slides.filter((slide) => slide.isEnabled), []);
  const rotationKeys = useMemo(() => rotation.map((slide) => slide.slideKey), [rotation]);
  const [activeView, setActiveView] = useState<TvSlide>(rotation[0]?.slideKey ?? "overview");
  const [cycleKey, setCycleKey] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [pointerOver, setPointerOver] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const paused = manualPaused || pointerOver || focusWithin || documentHidden;
  const activeSetting = rotation.find((slide) => slide.slideKey === activeView) ?? rotation[0];
  const durationMs = tvDurationMilliseconds(activeSetting?.durationSeconds ?? durationSeconds);
  const viewLabel = VIEW_LABELS[activeView];
  const monthLabel = DASHBOARD_MONTHS[month - 1] ?? "Current month";
  const previousPausedRef = useRef(paused);

  const changeView = useCallback((nextView: TvSlide) => {
    if (!rotationKeys.includes(nextView)) return;
    if (nextView === activeView) return;
    setActiveView(nextView);
    setCycleKey((current) => current + 1);
    setProgressKey((current) => current + 1);
  }, [activeView, rotationKeys]);

  const moveNext = useCallback(() => { if (rotationKeys.length) changeView(nextTvView(activeView, rotationKeys)); }, [activeView, changeView, rotationKeys]);
  const movePrevious = useCallback(() => { if (rotationKeys.length) changeView(previousTvView(activeView, rotationKeys)); }, [activeView, changeView, rotationKeys]);

  useEffect(() => {
    if (!rotationKeys.includes(activeView) && rotationKeys[0]) changeView(rotationKeys[0]);
  }, [activeView, changeView, rotationKeys]);

  useEffect(() => {
    if (paused) return;
    const timeout = window.setTimeout(moveNext, durationMs);
    return () => window.clearTimeout(timeout);
  }, [activeView, durationMs, moveNext, paused]);

  useEffect(() => {
    if (previousPausedRef.current && !paused) setProgressKey((current) => current + 1);
    previousPausedRef.current = paused;
  }, [paused]);

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

  const exitTvMode = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Continue to the normal dashboard if fullscreen exit is unavailable.
      }
    }
    router.push(buildNormalModeUrl({ year, month }));
  }, [month, router, year]);

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
    if (activeView === "overview") {
      const inbox = metricByCode(companyMetrics, "SALES_INBOX_ENQUIRIES");
      const inboxConversion = metricByCode(companyMetrics, "SALES_INBOX_CONVERSION_RATE");
      return <section className={styles.overviewSlide} data-tv-view="overview">
      <div className={styles.slideHeading} data-tv-group="profit-heading" style={{ "--tv-enter-index": 0 } as CSSProperties}><h2>{VIEW_LABELS[activeView]}</h2><span>{monthLabel} {year}</span></div>
      <div className={styles.overviewGrid}>
        <div className={styles.overviewProfit} data-tv-group="profit-card" style={{ "--tv-enter-index": 1 } as CSSProperties}><ProfitShirtKpi metric={monthlyProfitMetric} animationKey={cycleKey} animationDelayMs={160} tvMode /></div>
        <div className={styles.overviewInbox} data-tv-group="inbox-card" style={{ "--tv-enter-index": 2 } as CSSProperties}><SalesInboxKpi enquiries={inbox} conversionRate={inboxConversion} animationKey={cycleKey} animationDelayMs={240} tvMode /></div>
      </div>
    </section>;
    }
    if (activeView === "snuggle") return <SnuggleView data={data.snuggle} year={year} month={month} tvMode />;
    if (activeView === "ytd") return <YearToDateView data={data.yearToDate} comparison={data.yearComparison} tvMode />;
    if (activeView === "year_comparison") return <YearComparisonChart comparison={data.yearComparison} showControls={false} tvMode />;
    if (activeView === "team_members") return <TeamMembersTab data={data} year={year} month={month} tvMode />;
    if (activeView === "live-zoo-cam") return <LiveZooCamSlide />;
    return <EmptyState title="No dashboard view" />;
  }, [activeView, companyMetrics, cycleKey, data, month, monthLabel, monthlyProfitMetric, year]);

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
        <div className={styles.progressTrack} aria-hidden="true"><div key={progressKey} className={styles.progressFill} style={{ "--tv-duration": `${durationMs}ms` } as CSSProperties} /></div>
        <div className={styles.controls}>
          <span className={styles.viewName}>{viewLabel} · {paused ? "Paused" : "Rotating"}</span>
          <div className={styles.toolbar}>
            <div className={styles.buttonGroup}>
            <button className={styles.controlButton} type="button" onClick={movePrevious} aria-label="Previous TV view"><ChevronLeft size={14} aria-hidden="true" />Previous</button>
            <button className={styles.controlButton} type="button" onClick={() => setManualPaused((current) => !current)} aria-label={manualPaused ? "Resume TV rotation" : "Pause TV rotation"}>{manualPaused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}{manualPaused ? "Resume" : "Pause"}</button>
            <button className={styles.controlButton} type="button" onClick={moveNext} aria-label="Next TV view">Next<ChevronRight size={14} aria-hidden="true" /></button>
            <button className={styles.controlButton} type="button" onClick={toggleFullscreen} disabled={!canFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>{isFullscreen ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}{isFullscreen ? "Exit" : "Fullscreen"}</button>
            <button className={styles.controlButton} type="button" onClick={exitTvMode}>Exit TV Mode</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
