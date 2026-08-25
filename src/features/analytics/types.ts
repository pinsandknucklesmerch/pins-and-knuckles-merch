export const ANALYTICS_VIEWS = ["overview", "website", "social-media"] as const;

export type AnalyticsView = (typeof ANALYTICS_VIEWS)[number];
