import { EPCC_PROFIT_SENDER, EPCC_PROFIT_SUBJECT } from "../lib/epccProfitEmail.ts";

type GmailListResponse = { messages?: Array<{ id: string }> };
type GmailMessageResponse = { id: string; internalDate: string; raw: string };
type GoogleOAuthErrorResponse = { error?: string };
type GoogleGmailErrorResponse = { error?: { message?: string; status?: string; errors?: Array<{ message?: string; reason?: string }> } };
type GmailOperation = "messages.list" | "messages.get.raw";
type GmailClientConfiguration = { clientId: string; clientSecret: string; refreshToken: string; reportAddress: string };

const MAX_GMAIL_ATTEMPTS = 3;
const MAX_GMAIL_RETRY_DELAY_MS = 5_000;
const GMAIL_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const RAW_MESSAGE_CONCURRENCY = 3;

export type GmailProfitMessage = { id: string; receivedAt: string; raw: string };

export type GmailProfitClient = {
  findMessages(options: { messageId?: string }): Promise<GmailProfitMessage[]>;
};

export type GmailProfitClientDependencies = {
  fetch?: typeof fetch;
  sleep?: (delayMs: number) => Promise<void>;
  random?: () => number;
  now?: () => number;
  configuration?: GmailClientConfiguration;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function decodeBase64Url(value: string) {
  return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString("utf8");
}

function defaultSleep(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

function safeGoogleText(value: string | undefined) {
  if (!value) return undefined;
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:access|refresh)[_-]?token\s*[:=]\s*[^\s,;]+/gi, "token=[redacted]")
    .replace(/\bauthorization\s*[:=]\s*[^\s,;]+/gi, "authorization=[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300) || undefined;
}

export function retryAfterMilliseconds(value: string | null, now = Date.now()) {
  if (!value) return null;
  const seconds = Number(value.trim());
  if (Number.isInteger(seconds) && seconds >= 0) return seconds * 1_000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - now);
}

function retryDelayMilliseconds(retryAfter: string | null, attempt: number, now: number, random: () => number) {
  const retryAfterMs = retryAfterMilliseconds(retryAfter, now);
  if (retryAfterMs !== null) return Math.min(retryAfterMs, MAX_GMAIL_RETRY_DELAY_MS);
  const backoff = Math.min(MAX_GMAIL_RETRY_DELAY_MS, 250 * 2 ** (attempt - 1));
  return Math.round(backoff * (0.5 + Math.max(0, Math.min(1, random())) * 0.5));
}

function gmailFailureMessage(input: { operation: GmailOperation; status: number; reason?: string; message?: string; retryAfterMs: number | null; attempt: number }) {
  return [
    `Gmail ${input.operation} request failed (${input.status}) after ${input.attempt}/${MAX_GMAIL_ATTEMPTS} attempts.`,
    input.reason ? `reason=${input.reason}.` : null,
    input.message ? `message=${input.message}.` : null,
    input.retryAfterMs !== null ? `retryAfterMs=${input.retryAfterMs}.` : null,
  ].filter(Boolean).join(" ");
}

/** Runs a fixed worker pool and stops taking queued work after the first failure. */
export async function mapWithConcurrency<T, Result>(items: readonly T[], concurrency: number, mapper: (item: T) => Promise<Result>): Promise<Result[]> {
  const results = new Array<Result>(items.length);
  let nextIndex = 0;
  let failure: unknown;

  const worker = async () => {
    while (failure === undefined) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      try {
        results[index] = await mapper(items[index]);
      } catch (error) {
        failure ??= error;
        return;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  if (failure !== undefined) throw failure;
  return results;
}

export function classifyGoogleOAuthRefreshFailure(status: number, error?: string) {
  if (error === "invalid_grant") return `Google OAuth refresh failed (${status} invalid_grant): the refresh token was rejected. Re-authorise the intended mailbox with the configured OAuth client.`;
  if (error === "invalid_client") return `Google OAuth refresh failed (${status} invalid_client): verify the configured OAuth client ID and secret belong to the same client.`;
  if (error === "unauthorized_client") return `Google OAuth refresh failed (${status} unauthorized_client): verify the OAuth client, consent configuration, and Gmail read-only scope.`;
  return `Google OAuth token refresh failed (${status}${error ? ` ${error}` : ""}).`;
}

export function createGmailProfitClient(dependencies: GmailProfitClientDependencies = {}): GmailProfitClient {
  const configuration = dependencies.configuration ?? {
    clientId: required("GOOGLE_CLIENT_ID"),
    clientSecret: required("GOOGLE_CLIENT_SECRET"),
    refreshToken: required("GOOGLE_REFRESH_TOKEN"),
    reportAddress: required("GMAIL_REPORT_ADDRESS"),
  };
  const fetcher = dependencies.fetch ?? fetch;
  const sleep = dependencies.sleep ?? defaultSleep;
  const random = dependencies.random ?? Math.random;
  const now = dependencies.now ?? Date.now;

  async function accessToken() {
    const response = await fetcher("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: configuration.clientId,
        client_secret: configuration.clientSecret,
        refresh_token: configuration.refreshToken,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as ({ access_token?: string } & GoogleOAuthErrorResponse) | null;
    if (!response.ok) throw new Error(classifyGoogleOAuthRefreshFailure(response.status, payload?.error));
    if (!payload?.access_token) throw new Error("Google OAuth response did not include an access token.");
    return payload.access_token;
  }

  async function request<T>(path: string, token: string, operation: GmailOperation): Promise<T> {
    for (let attempt = 1; attempt <= MAX_GMAIL_ATTEMPTS; attempt += 1) {
      const response = await fetcher(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(configuration.reportAddress)}${path}`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) return response.json() as Promise<T>;

      const payload = await response.json().catch(() => null) as GoogleGmailErrorResponse | null;
      const error = payload?.error;
      const reason = safeGoogleText(error?.errors?.[0]?.reason ?? error?.status);
      const message = safeGoogleText(error?.errors?.[0]?.message ?? error?.message);
      const retryAfter = response.headers.get("retry-after");
      const retryAfterMs = retryAfterMilliseconds(retryAfter, now());
      const retryable = GMAIL_RETRYABLE_STATUSES.has(response.status);
      if (!retryable || attempt === MAX_GMAIL_ATTEMPTS) {
        throw new Error(gmailFailureMessage({ operation, status: response.status, reason, message, retryAfterMs, attempt }));
      }
      await sleep(retryDelayMilliseconds(retryAfter, attempt, now(), random));
    }
    throw new Error("Gmail request retry loop ended unexpectedly.");
  }

  async function message(id: string, token: string): Promise<GmailProfitMessage> {
    const payload = await request<GmailMessageResponse>(`/messages/${encodeURIComponent(id)}?format=raw`, token, "messages.get.raw");
    return { id: payload.id, receivedAt: new Date(Number(payload.internalDate)).toISOString(), raw: decodeBase64Url(payload.raw) };
  }

  return {
    async findMessages({ messageId }) {
      const token = await accessToken();
      if (messageId) return [await message(messageId, token)];
      const query = `from:${EPCC_PROFIT_SENDER} subject:"${EPCC_PROFIT_SUBJECT}"`;
      const list = await request<GmailListResponse>(`/messages?q=${encodeURIComponent(query)}&maxResults=25`, token, "messages.list");
      const messages = await mapWithConcurrency(list.messages ?? [], RAW_MESSAGE_CONCURRENCY, (item) => message(item.id, token));
      return messages.sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));
    },
  };
}
