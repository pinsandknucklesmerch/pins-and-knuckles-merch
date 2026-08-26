export const ANALYTICS_VIEWS = ["overview", "website", "social-media"] as const;

export type AnalyticsView = (typeof ANALYTICS_VIEWS)[number];

export const WEBSITE_ANALYTICS_PERIODS = [7, 30, 90] as const;

export type WebsiteAnalyticsPeriod = (typeof WEBSITE_ANALYTICS_PERIODS)[number];
