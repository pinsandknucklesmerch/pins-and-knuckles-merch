import type { MetricResult } from "../domain/types.ts";

export type CompanyProfitPresentation = {
  current: number | null;
  target: number | null;
  progress: number | null;
  remaining: number | null;
  bonus: number | null;
  hasReachedTarget: boolean;
  supportingLabel: "Profit Above Target" | "Remaining to Target";
  supportingValue: number | null;
};

/** Shared, display-ready values for the dashboard and export presentations. */
export function companyProfitPresentation(metric: MetricResult): CompanyProfitPresentation {
  const target = metric.target !== null && Number.isFinite(metric.target) && metric.target > 0 ? metric.target : null;
  const current = metric.value !== null && Number.isFinite(metric.value) ? metric.value : null;
  const remaining = target !== null && current !== null ? Math.max(target - current, 0) : null;
  const bonus = target !== null && current !== null ? Math.max(current - target, 0) : null;
  const hasReachedTarget = target !== null && current !== null && current >= target;

  return {
    current,
    target,
    progress: metric.targetProgress,
    remaining,
    bonus,
    hasReachedTarget,
    supportingLabel: hasReachedTarget ? "Profit Above Target" : "Remaining to Target",
    supportingValue: hasReachedTarget ? bonus : remaining,
  };
}
