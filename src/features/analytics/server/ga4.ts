import "server-only";

import { BetaAnalyticsDataClient, type protos } from "@google-analytics/data";
import { getVercelOidcToken } from "@vercel/oidc";
import { ExternalAccountClient, GoogleAuth } from "google-auth-library";
import type { WebsiteAnalyticsPeriod } from "../types";
import { compareTraffic, parseTrafficInvestigationRange, rankPositiveContributors, type TrafficInvestigation, type TrafficInvestigationRange, type TrafficInvestigationRow } from "../lib/trafficInvestigation";

const ANALYTICS_READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const SUBJECT_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:jwt";
const TOKEN_URL = "https://sts.googleapis.com/v1/token";

type Ga4Configuration = {
  propertyId: string;
  projectNumber: string;
  workloadIdentityPoolId: string;
  workloadIdentityPoolProviderId: string;
  serviceAccountEmail: string;
};

export type Ga4LastSevenDaysReport = {
  propertyId: string;
  period: "last7Days";
  activeUsers: number;
  sessions: number;
  pageViews: number;
};

export type Ga4WebsiteAnalyticsReport = {
  periodDays: WebsiteAnalyticsPeriod;
  metrics: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    engagementRate: number;
  };
  previousMetrics: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    engagementRate: number;
  } | null;
  dailyTraffic: Array<{ date: string; sessions: number; activeUsers: number; pageViews: number; engagementRate: number }>;
  previousDailyTraffic: Array<{ date: string; sessions: number; activeUsers: number; pageViews: number; engagementRate: number }>;
  geography: Array<{ country: string; countryId: string | null; sessions: number; activeUsers: number }>;
  acquisitionChannels: Array<{ channel: string; sessions: number }>;
  topPages: Array<{ title: string; path: string | null; pageViews: number }>;
  hasData: boolean;
};

export class Ga4ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Ga4ConfigurationError";
  }
}

export class Ga4DataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Ga4DataError";
  }
}

export class Ga4OidcUnavailableError extends Error {
  constructor() {
    super("GA4 Vercel OIDC credentials are unavailable. This integration requires an authorised Vercel deployment identity and has no local credential fallback.");
    this.name = "Ga4OidcUnavailableError";
  }
}

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Ga4ConfigurationError(`GA4 configuration unavailable: ${name} is required.`);
  return value;
}

function numericEnvironmentValue(name: string) {
  const value = requiredEnvironmentValue(name);
  if (!/^\d+$/.test(value)) throw new Ga4ConfigurationError(`GA4 configuration unavailable: ${name} must be numeric.`);
  return value;
}

function identifierEnvironmentValue(name: string) {
  const value = requiredEnvironmentValue(name);
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Ga4ConfigurationError(`GA4 configuration unavailable: ${name} is invalid.`);
  return value;
}

function ga4Configuration(): Ga4Configuration {
  const serviceAccountEmail = requiredEnvironmentValue("GCP_SERVICE_ACCOUNT_EMAIL");
  if (!/^[^\s@]+@[^\s@]+$/.test(serviceAccountEmail)) {
    throw new Ga4ConfigurationError("GA4 configuration unavailable: GCP_SERVICE_ACCOUNT_EMAIL is invalid.");
  }

  return {
    propertyId: numericEnvironmentValue("GA4_PROPERTY_ID"),
    projectNumber: numericEnvironmentValue("GCP_PROJECT_NUMBER"),
    workloadIdentityPoolId: identifierEnvironmentValue("GCP_WORKLOAD_IDENTITY_POOL_ID"),
    workloadIdentityPoolProviderId: identifierEnvironmentValue("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID"),
    serviceAccountEmail,
  };
}

function googleAuth(configuration: Ga4Configuration) {
  const externalAccountClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${configuration.projectNumber}/locations/global/workloadIdentityPools/${configuration.workloadIdentityPoolId}/providers/${configuration.workloadIdentityPoolProviderId}`,
    subject_token_type: SUBJECT_TOKEN_TYPE,
    token_url: TOKEN_URL,
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(configuration.serviceAccountEmail)}:generateAccessToken`,
    scopes: [ANALYTICS_READONLY_SCOPE],
    subject_token_supplier: {
      async getSubjectToken() {
        try {
          return await getVercelOidcToken();
        } catch {
          throw new Ga4OidcUnavailableError();
        }
      },
    },
  });

  if (!externalAccountClient) throw new Ga4ConfigurationError("GA4 configuration unavailable: external account client could not be created.");
  return new GoogleAuth({ authClient: externalAccountClient });
}

function metricValue(value: string | null | undefined, metric: string) {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Ga4DataError(`GA4 returned an invalid ${metric} value.`);
  return parsed;
}

function reportMetrics(values: protos.google.analytics.data.v1beta.IMetricValue[] | null | undefined) {
  return {
    activeUsers: metricValue(values?.[0]?.value, "activeUsers"),
    sessions: metricValue(values?.[1]?.value, "sessions"),
    pageViews: metricValue(values?.[2]?.value, "screenPageViews"),
    engagementRate: metricValue(values?.[3]?.value, "engagementRate"),
  };
}

function dateRange(days: number, previous = false) {
  if (!previous) return { startDate: `${days - 1}daysAgo`, endDate: "today" };
  return { startDate: `${(days * 2) - 1}daysAgo`, endDate: `${days}daysAgo` };
}

function formatGa4Date(value: string | null | undefined) {
  if (!value || !/^\d{8}$/.test(value)) return value ?? "";
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function dailyTraffic(rows: protos.google.analytics.data.v1beta.IRow[]) {
  return rows.map((row) => ({
    date: formatGa4Date(row.dimensionValues?.[0]?.value),
    sessions: metricValue(row.metricValues?.[0]?.value, "sessions"),
    activeUsers: metricValue(row.metricValues?.[1]?.value, "activeUsers"),
    pageViews: metricValue(row.metricValues?.[2]?.value, "screenPageViews"),
    engagementRate: metricValue(row.metricValues?.[3]?.value, "engagementRate"),
  }));
}

/** Retrieves the aggregate website metrics used by the first GA4 connectivity check. */
export async function getGa4LastSevenDaysReport(): Promise<Ga4LastSevenDaysReport> {
  const configuration = ga4Configuration();
  const client = new BetaAnalyticsDataClient({ auth: googleAuth(configuration) });

  try {
    const [response] = await client.runReport({
      property: `properties/${configuration.propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
    });
    const values = response.rows?.[0]?.metricValues ?? [];

    return {
      propertyId: configuration.propertyId,
      period: "last7Days",
      activeUsers: metricValue(values[0]?.value, "activeUsers"),
      sessions: metricValue(values[1]?.value, "sessions"),
      pageViews: metricValue(values[2]?.value, "screenPageViews"),
    };
  } finally {
    await client.close();
  }
}

/** Retrieves normalized live GA4 website reporting for the authenticated Hub page. */
export async function getGa4WebsiteAnalyticsReport(periodDays: WebsiteAnalyticsPeriod): Promise<Ga4WebsiteAnalyticsReport> {
  const configuration = ga4Configuration();
  const client = new BetaAnalyticsDataClient({ auth: googleAuth(configuration) });
  const property = `properties/${configuration.propertyId}`;
  const currentRange = dateRange(periodDays);

  try {
    const [currentResponse, previousResponse, trendResponse, previousTrendResponse, geographyResponse, acquisitionResponse, pagesResponse] = await Promise.all([
      client.runReport({ property, dateRanges: [currentRange], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "engagementRate" }] }),
      client.runReport({ property, dateRanges: [dateRange(periodDays, true)], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "engagementRate" }] }),
      client.runReport({ property, dateRanges: [currentRange], dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }, { name: "engagementRate" }], orderBys: [{ dimension: { dimensionName: "date" } }] }),
      client.runReport({ property, dateRanges: [dateRange(periodDays, true)], dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }, { name: "engagementRate" }], orderBys: [{ dimension: { dimensionName: "date" } }] }),
      client.runReport({ property, dateRanges: [currentRange], dimensions: [{ name: "country" }, { name: "countryId" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }] }),
      client.runReport({ property, dateRanges: [currentRange], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 6 }),
      client.runReport({ property, dateRanges: [currentRange], dimensions: [{ name: "pageTitle" }, { name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10 }),
    ]);

    const currentRows = currentResponse[0].rows ?? [];
    const previousRows = previousResponse[0].rows ?? [];
    const trendRows = trendResponse[0].rows ?? [];
    const previousTrendRows = previousTrendResponse[0].rows ?? [];
    const geographyRows = geographyResponse[0].rows ?? [];
    const acquisitionRows = acquisitionResponse[0].rows ?? [];
    const pageRows = pagesResponse[0].rows ?? [];

    return {
      periodDays,
      metrics: reportMetrics(currentRows[0]?.metricValues),
      previousMetrics: previousRows[0] ? reportMetrics(previousRows[0].metricValues) : null,
      dailyTraffic: dailyTraffic(trendRows),
      previousDailyTraffic: dailyTraffic(previousTrendRows),
      geography: geographyRows.map((row) => ({ country: row.dimensionValues?.[0]?.value?.trim() || "Unassigned", countryId: row.dimensionValues?.[1]?.value?.trim() || null, sessions: metricValue(row.metricValues?.[0]?.value, "sessions"), activeUsers: metricValue(row.metricValues?.[1]?.value, "activeUsers") })),
      acquisitionChannels: acquisitionRows.map((row) => ({ channel: row.dimensionValues?.[0]?.value?.trim() || "Unassigned", sessions: metricValue(row.metricValues?.[0]?.value, "sessions") })),
      topPages: pageRows.map((row) => ({ title: row.dimensionValues?.[0]?.value?.trim() || "Untitled page", path: row.dimensionValues?.[1]?.value?.trim() || null, pageViews: metricValue(row.metricValues?.[0]?.value, "screenPageViews") })),
      hasData: currentRows.length > 0 || trendRows.length > 0 || geographyRows.length > 0 || acquisitionRows.length > 0 || pageRows.length > 0,
    };
  } finally {
    await client.close();
  }
}

function investigationSummary(values: protos.google.analytics.data.v1beta.IMetricValue[] | null | undefined) {
  return {
    sessions: metricValue(values?.[0]?.value, "sessions"),
    activeUsers: metricValue(values?.[1]?.value, "activeUsers"),
    pageViews: metricValue(values?.[2]?.value, "screenPageViews"),
  };
}

function investigationRows(selectedRows: protos.google.analytics.data.v1beta.IRow[], baselineRows: protos.google.analytics.data.v1beta.IRow[], range: TrafficInvestigationRange, country = false): TrafficInvestigationRow[] {
  const baseline = new Map(baselineRows.map((row) => [row.dimensionValues?.[0]?.value?.trim() || "Unassigned", metricValue(row.metricValues?.[0]?.value, "sessions")]));
  const selected = new Map(selectedRows.map((row) => [row.dimensionValues?.[0]?.value?.trim() || "Unassigned", { sessions: metricValue(row.metricValues?.[0]?.value, "sessions"), countryId: country ? row.dimensionValues?.[1]?.value?.trim() || null : undefined }]));
  return Array.from(new Set([...baseline.keys(), ...selected.keys()])).map((label) => {
    const current = selected.get(label);
    return { label, countryId: current?.countryId, sessions: compareTraffic(current?.sessions ?? 0, baseline.get(label) ?? 0, range.baselineDays) };
  }).sort((left, right) => right.sessions.difference - left.sessions.difference || right.sessions.selected - left.sessions.selected);
}

/** Retrieves a lazy, normalized drill-down for one rendered traffic bucket. */
export async function getGa4TrafficInvestigation(startDate: string | null, endDate: string | null): Promise<TrafficInvestigation | null> {
  const range = parseTrafficInvestigationRange(startDate, endDate);
  if (!range) return null;
  const configuration = ga4Configuration();
  const client = new BetaAnalyticsDataClient({ auth: googleAuth(configuration) });
  const property = `properties/${configuration.propertyId}`;
  const selectedRange = { startDate: range.startDate, endDate: range.endDate };
  const baselineRange = { startDate: range.baselineStartDate, endDate: range.baselineEndDate };
  const summaryMetrics = [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }];
  const categoryReport = (dateRanges: Array<{ startDate: string; endDate: string }>, dimensions: Array<{ name: string }>) => client.runReport({ property, dateRanges, dimensions, metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 50 });

  try {
    const [selectedSummaryResponse, baselineSummaryResponse, selectedAcquisitionResponse, baselineAcquisitionResponse, selectedLandingResponse, baselineLandingResponse, selectedGeographyResponse, baselineGeographyResponse, selectedDeviceResponse, baselineDeviceResponse] = await Promise.all([
      client.runReport({ property, dateRanges: [selectedRange], metrics: summaryMetrics }),
      client.runReport({ property, dateRanges: [baselineRange], metrics: summaryMetrics }),
      categoryReport([selectedRange], [{ name: "sessionDefaultChannelGroup" }]),
      categoryReport([baselineRange], [{ name: "sessionDefaultChannelGroup" }]),
      categoryReport([selectedRange], [{ name: "landingPagePlusQueryString" }]),
      categoryReport([baselineRange], [{ name: "landingPagePlusQueryString" }]),
      categoryReport([selectedRange], [{ name: "country" }, { name: "countryId" }]),
      categoryReport([baselineRange], [{ name: "country" }, { name: "countryId" }]),
      categoryReport([selectedRange], [{ name: "deviceCategory" }]),
      categoryReport([baselineRange], [{ name: "deviceCategory" }]),
    ]);
    const selectedSummary = investigationSummary(selectedSummaryResponse[0].rows?.[0]?.metricValues);
    const baselineSummary = investigationSummary(baselineSummaryResponse[0].rows?.[0]?.metricValues);
    const acquisition = investigationRows(selectedAcquisitionResponse[0].rows ?? [], baselineAcquisitionResponse[0].rows ?? [], range);
    return {
      range,
      summary: {
        sessions: compareTraffic(selectedSummary.sessions, baselineSummary.sessions, range.baselineDays),
        activeUsers: compareTraffic(selectedSummary.activeUsers, baselineSummary.activeUsers, range.baselineDays),
        pageViews: compareTraffic(selectedSummary.pageViews, baselineSummary.pageViews, range.baselineDays),
      },
      contributors: rankPositiveContributors(acquisition),
      acquisition,
      landingPages: investigationRows(selectedLandingResponse[0].rows ?? [], baselineLandingResponse[0].rows ?? [], range),
      geography: investigationRows(selectedGeographyResponse[0].rows ?? [], baselineGeographyResponse[0].rows ?? [], range, true),
      devices: investigationRows(selectedDeviceResponse[0].rows ?? [], baselineDeviceResponse[0].rows ?? [], range),
    };
  } finally {
    await client.close();
  }
}
