import { WEBSITE_ANALYTICS_PERIODS, type WebsiteAnalyticsPeriod } from "../types";

export function parseWebsiteAnalyticsPeriod(value: string | undefined): WebsiteAnalyticsPeriod {
  const parsed = Number(value);
  return WEBSITE_ANALYTICS_PERIODS.includes(parsed as WebsiteAnalyticsPeriod) ? parsed as WebsiteAnalyticsPeriod : 30;
}
