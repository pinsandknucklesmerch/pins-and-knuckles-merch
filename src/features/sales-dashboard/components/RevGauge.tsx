"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { gaugeZoneRatios } from "../lib/gaugeZones";
import styles from "./RevGauge.module.css";

type RevGaugeProps = {
  value: number;
  target: number;
  max: number;
  progress: number;
  format: "currency" | "number" | "percent";
  label?: string;
  interactive?: boolean;
  animationKey?: string | number;
  animationDelayMs?: number;
  tvMode?: boolean;
};

const START_ANGLE = -120;
const END_ANGLE = 120;
const CENTER_X = 120;
const CENTER_Y = 118;
const ARC_RADIUS = 88;
const NEEDLE_RADIUS = 76;
const TICK_RATIOS = [0, 0.25, 0.5, 0.75, 1];
const TICK_INNER_RADIUS = ARC_RADIUS - 8;
const TICK_OUTER_RADIUS = ARC_RADIUS + 5;
const TICK_LABEL_RADIUS = ARC_RADIUS + 19;
const TARGET_LABEL_RADIUS = TICK_LABEL_RADIUS + 7;
const TARGET_LABEL_HIDE_THRESHOLD = 12;

function clampRatio(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function pointAt(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.sin(radians),
    y: CENTER_Y - radius * Math.cos(radians),
  };
}

function arcPath(startAngle: number, endAngle: number, radius = ARC_RADIUS) {
  const start = pointAt(startAngle, radius);
  const end = pointAt(endAngle, radius);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function formatValue(value: number, format: RevGaugeProps["format"]) {
  if (format === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString("en-GB", {
    style: format === "currency" ? "currency" : "decimal",
    currency: format === "currency" ? "GBP" : undefined,
    maximumFractionDigits: format === "currency" ? 2 : 0,
  });
}

function formatTickValue(value: number, format: RevGaugeProps["format"]) {
  if (format === "percent") return `${Math.round(value)}%`;
  return value.toLocaleString("en-GB", format === "currency"
    ? { style: "currency", currency: "GBP", notation: "compact", maximumFractionDigits: 1 }
    : { maximumFractionDigits: 0 });
}

function statusFor(progress: number) {
  if (progress >= 100) return "success";
  if (progress >= 90) return "warning";
  return "danger";
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function RevGauge({ value, target, max, progress, format, label, interactive = true, animationKey, animationDelayMs = 0, tvMode = false }: RevGaugeProps) {
  const valueRatio = clampRatio(value / max);
  const zoneRatios = gaugeZoneRatios(target, max);
  const targetRatio = zoneRatios.greenStart;
  const needleAngle = START_ANGLE + valueRatio * (END_ANGLE - START_ANGLE);
  const prefersReducedMotion = usePrefersReducedMotion();
  const initialAngle = interactive || animationKey !== undefined ? START_ANGLE : needleAngle;
  const needleRef = useRef<SVGLineElement>(null);
  const renderedAngleRef = useRef(interactive || animationKey !== undefined ? START_ANGLE : needleAngle);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimerRef = useRef<number | null>(null);
  const previousAnimationKeyRef = useRef(animationKey);
  const targetAngle = START_ANGLE + targetRatio * (END_ANGLE - START_ANGLE);
  const targetInner = pointAt(targetAngle, ARC_RADIUS - 6);
  const targetOuter = pointAt(targetAngle, ARC_RADIUS + 9);
  const targetLabelPoint = pointAt(targetAngle, TARGET_LABEL_RADIUS);
  const status = statusFor(progress);
  const currentText = formatValue(value, format);
  const targetText = formatValue(target, format);
  const neutralEndAngle = START_ANGLE + zoneRatios.neutralEnd * (END_ANGLE - START_ANGLE);
  const redEndAngle = START_ANGLE + zoneRatios.redEnd * (END_ANGLE - START_ANGLE);
  const orangeEndAngle = START_ANGLE + zoneRatios.orangeEnd * (END_ANGLE - START_ANGLE);
  const amberEndAngle = START_ANGLE + zoneRatios.amberEnd * (END_ANGLE - START_ANGLE);
  const greenStartAngle = START_ANGLE + zoneRatios.greenStart * (END_ANGLE - START_ANGLE);

  const startNeedleAnimation = useCallback((fromAngle: number, destinationAngle: number) => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    if (animationTimerRef.current !== null) window.clearTimeout(animationTimerRef.current);

    if ((!interactive && animationKey === undefined) || prefersReducedMotion) {
      renderedAngleRef.current = destinationAngle;
      needleRef.current?.style.setProperty("--needle-angle", `${destinationAngle}deg`);
      animationFrameRef.current = null;
      return () => undefined;
    }

    const angleDelta = destinationAngle - fromAngle;
    const duration = 1200;
    const startTime = performance.now();

    if (Math.abs(angleDelta) < 0.01) {
      renderedAngleRef.current = destinationAngle;
      needleRef.current?.style.setProperty("--needle-angle", `${destinationAngle}deg`);
      animationFrameRef.current = null;
      return () => undefined;
    }

    const animate = (currentTime: number) => {
      const progressRatio = Math.min(1, (currentTime - startTime) / duration);
      const easedProgress = 1 - Math.pow(1 - progressRatio, 3);
      const nextAngle = fromAngle + angleDelta * easedProgress;
      renderedAngleRef.current = nextAngle;
      needleRef.current?.style.setProperty("--needle-angle", `${nextAngle}deg`);

      if (progressRatio < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    const startFrame = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      animationTimerRef.current = null;
    };
    if (animationDelayMs > 0) animationTimerRef.current = window.setTimeout(startFrame, animationDelayMs);
    else startFrame();
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      if (animationTimerRef.current !== null) window.clearTimeout(animationTimerRef.current);
      animationFrameRef.current = null;
      animationTimerRef.current = null;
    };
  }, [animationDelayMs, animationKey, interactive, prefersReducedMotion]);

  useEffect(() => {
    const shouldReplay = animationKey !== undefined && previousAnimationKeyRef.current !== animationKey;
    previousAnimationKeyRef.current = animationKey;
    if (shouldReplay) {
      renderedAngleRef.current = START_ANGLE;
      needleRef.current?.style.setProperty("--needle-angle", `${START_ANGLE}deg`);
      return startNeedleAnimation(START_ANGLE, needleAngle);
    }
    return startNeedleAnimation(renderedAngleRef.current, needleAngle);
  }, [animationKey, max, needleAngle, startNeedleAnimation, value]);

  const replayNeedle = useCallback(() => {
    if (!interactive || prefersReducedMotion) return;
    renderedAngleRef.current = START_ANGLE;
    needleRef.current?.style.setProperty("--needle-angle", `${START_ANGLE}deg`);
    startNeedleAnimation(START_ANGLE, needleAngle);
  }, [interactive, needleAngle, prefersReducedMotion, startNeedleAnimation]);

  return (
    <div
      className={styles.gauge}
      data-status={status}
      data-interactive={interactive ? "true" : "false"}
      data-tv={tvMode ? "true" : "false"}
      role="img"
      tabIndex={interactive ? 0 : undefined}
      onPointerEnter={interactive && !prefersReducedMotion ? replayNeedle : undefined}
      onFocus={interactive && !prefersReducedMotion ? (event) => {
        if (event.currentTarget === event.target) replayNeedle();
      } : undefined}
      aria-label={`${label ? `${label}: ` : ""}current ${currentText}, target ${targetText}, ${progress.toFixed(1)}% of target`}
    >
      <svg className={styles.svg} viewBox="0 0 240 180" aria-hidden="true" focusable="false">
        <path className={styles.arcTrack} d={arcPath(START_ANGLE, END_ANGLE)} />
        <path className={styles.arcZoneNeutral} d={arcPath(START_ANGLE, neutralEndAngle)} />
        <path className={styles.arcZoneYellow} d={arcPath(neutralEndAngle, redEndAngle)} />
        <path className={styles.arcZoneOrange} d={arcPath(redEndAngle, orangeEndAngle)} />
        <path className={styles.arcZoneRed} d={arcPath(orangeEndAngle, amberEndAngle)} />
        <path className={styles.arcZoneGreen} d={arcPath(greenStartAngle, END_ANGLE)} />
        {TICK_RATIOS.map((ratio, index) => {
          const angle = START_ANGLE + ratio * (END_ANGLE - START_ANGLE);
          const inner = pointAt(angle, TICK_INNER_RADIUS);
          const outer = pointAt(angle, TICK_OUTER_RADIUS);
          const labelPoint = pointAt(angle, TICK_LABEL_RADIUS);
          const labelAnchor = index === 0 ? "start" : index === TICK_RATIOS.length - 1 ? "end" : "middle";
          const hideLabel = Math.abs(angle - targetAngle) < TARGET_LABEL_HIDE_THRESHOLD;

          return (
            <g className={styles.tick} key={ratio}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
              {!hideLabel ? <text className={styles.tickLabel} x={labelPoint.x} y={labelPoint.y} textAnchor={labelAnchor} dominantBaseline="middle">
                {formatTickValue(max * ratio, format)}
              </text> : null}
            </g>
          );
        })}
        <line className={styles.targetMarker} x1={targetInner.x} y1={targetInner.y} x2={targetOuter.x} y2={targetOuter.y} />
        <text className={styles.targetLabel} x={targetLabelPoint.x} y={targetLabelPoint.y} textAnchor="middle" dominantBaseline="middle">{targetText}</text>
        <line
          ref={needleRef}
          className={styles.needle}
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={CENTER_X}
          y2={CENTER_Y - NEEDLE_RADIUS}
          style={{ "--needle-angle": `${initialAngle}deg` } as CSSProperties}
        />
        <circle className={styles.hubOuter} cx={CENTER_X} cy={CENTER_Y} r="8" />
        <circle className={styles.hubInner} cx={CENTER_X} cy={CENTER_Y} r="3" />
      </svg>
      <div className={styles.progress}>{progress.toFixed(1)}% of target</div>
    </div>
  );
}
