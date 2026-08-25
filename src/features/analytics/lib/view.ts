import { ANALYTICS_VIEWS, type AnalyticsView } from "../types";

export function parseAnalyticsView(value: string | undefined): AnalyticsView {
  return ANALYTICS_VIEWS.includes(value as AnalyticsView) ? value as AnalyticsView : "overview";
}
