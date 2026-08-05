"use client";

import { useEffect, useRef, useState } from "react";
import { formatAnimatedMetricValue, getAccessibleMetricText, shouldAnimateMetricValue, type AnimatedMetricFormat } from "../lib/animatedMetricValue";

type AnimatedMetricValueProps = {
  value: number | null | undefined;
  format: AnimatedMetricFormat;
  className?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export function AnimatedMetricValue({ value, format, className, maximumFractionDigits, minimumFractionDigits }: AnimatedMetricValueProps) {
  const previousValue = useRef<number | null>(null);
  const [animatedValue, setAnimatedValue] = useState<number | null>(value ?? null);
  const finalText = getAccessibleMetricText(value, format, maximumFractionDigits, minimumFractionDigits);

  useEffect(() => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      previousValue.current = null;
      setAnimatedValue(null);
      return;
    }

    const from = previousValue.current === null || !Number.isFinite(previousValue.current) ? 0 : previousValue.current;
    previousValue.current = value;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!shouldAnimateMetricValue(from, value, reduceMotion)) {
      setAnimatedValue(value);
      return;
    }

    let frame = 0;
    const duration = 700;
    const startedAt = performance.now();
    setAnimatedValue(from);
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const visibleText = animatedValue === null || !Number.isFinite(animatedValue)
    ? "—"
    : formatAnimatedMetricValue(animatedValue, format, maximumFractionDigits, minimumFractionDigits);

  return <span className={className} aria-label={finalText}><span aria-hidden="true">{visibleText}</span><span className="sr-only">{finalText}</span></span>;
}
