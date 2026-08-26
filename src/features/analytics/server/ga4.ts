import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { getVercelOidcToken } from "@vercel/oidc";
import { ExternalAccountClient, GoogleAuth } from "google-auth-library";

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
