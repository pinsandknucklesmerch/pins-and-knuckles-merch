import "server-only";

import { BetaAnalyticsDataClient, type protos } from "@google-analytics/data";
import { getVercelOidcToken } from "@vercel/oidc";
import { ExternalAccountClient, GoogleAuth } from "google-auth-library";
import type { WebsiteAnalyticsPeriod } from "../types";

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
  dailyTraffic: Array<{ date: string; sessions: number; activeUsers: number }>;
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
    const [currentResponse, previousResponse, trendResponse, acquisitionResponse, pagesResponse] = await Promise.all([
      client.runReport({ property, dateRanges: [currentRange], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "engagementRate" }] }),
      client.runReport({ property, dateRanges: [dateRange(periodDays, true)], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "engagementRate" }] }),
      client.runReport({ property, dateRanges: [currentRange], dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }], orderBys: [{ dimension: { dimensionName: "date" } }] }),
      client.runReport({ property, dateRanges: [currentRange], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 6 }),
      client.runReport({ property, dateRanges: [currentRange], dimensions: [{ name: "pageTitle" }, { name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10 }),
    ]);

    const currentRows = currentResponse[0].rows ?? [];
    const previousRows = previousResponse[0].rows ?? [];
    const trendRows = trendResponse[0].rows ?? [];
    const acquisitionRows = acquisitionResponse[0].rows ?? [];
    const pageRows = pagesResponse[0].rows ?? [];

    return {
      periodDays,
      metrics: reportMetrics(currentRows[0]?.metricValues),
      previousMetrics: previousRows[0] ? reportMetrics(previousRows[0].metricValues) : null,
      dailyTraffic: trendRows.map((row) => ({ date: formatGa4Date(row.dimensionValues?.[0]?.value), sessions: metricValue(row.metricValues?.[0]?.value, "sessions"), activeUsers: metricValue(row.metricValues?.[1]?.value, "activeUsers") })),
      acquisitionChannels: acquisitionRows.map((row) => ({ channel: row.dimensionValues?.[0]?.value?.trim() || "Unassigned", sessions: metricValue(row.metricValues?.[0]?.value, "sessions") })),
      topPages: pageRows.map((row) => ({ title: row.dimensionValues?.[0]?.value?.trim() || "Untitled page", path: row.dimensionValues?.[1]?.value?.trim() || null, pageViews: metricValue(row.metricValues?.[0]?.value, "screenPageViews") })),
      hasData: currentRows.length > 0 || trendRows.length > 0 || acquisitionRows.length > 0 || pageRows.length > 0,
    };
  } finally {
    await client.close();
  }
}
