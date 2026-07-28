import { EPCC_PROFIT_SENDER, EPCC_PROFIT_SUBJECT } from "../lib/epccProfitEmail.ts";

type GmailListResponse = { messages?: Array<{ id: string }> };
type GmailMessageResponse = { id: string; internalDate: string; raw: string };
type GoogleOAuthErrorResponse = { error?: string };

export type GmailProfitMessage = { id: string; receivedAt: string; raw: string };

export type GmailProfitClient = {
  findMessages(options: { messageId?: string }): Promise<GmailProfitMessage[]>;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function decodeBase64Url(value: string) {
  return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString("utf8");
}

export function classifyGoogleOAuthRefreshFailure(status: number, error?: string) {
  if (error === "invalid_grant") return `Google OAuth refresh failed (${status} invalid_grant): the refresh token was rejected. Re-authorise the intended mailbox with the configured OAuth client.`;
  if (error === "invalid_client") return `Google OAuth refresh failed (${status} invalid_client): verify the configured OAuth client ID and secret belong to the same client.`;
  if (error === "unauthorized_client") return `Google OAuth refresh failed (${status} unauthorized_client): verify the OAuth client, consent configuration, and Gmail read-only scope.`;
  return `Google OAuth token refresh failed (${status}${error ? ` ${error}` : ""}).`;
}

export function createGmailProfitClient(): GmailProfitClient {
  const clientId = required("GOOGLE_CLIENT_ID");
  const clientSecret = required("GOOGLE_CLIENT_SECRET");
  const refreshToken = required("GOOGLE_REFRESH_TOKEN");
  const reportAddress = required("GMAIL_REPORT_ADDRESS");

  async function accessToken() {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as ({ access_token?: string } & GoogleOAuthErrorResponse) | null;
    if (!response.ok) throw new Error(classifyGoogleOAuthRefreshFailure(response.status, payload?.error));
    if (!payload?.access_token) throw new Error("Google OAuth response did not include an access token.");
    return payload.access_token;
  }

  async function request<T>(path: string, token: string): Promise<T> {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(reportAddress)}${path}`, {
      headers: { authorization: `Bearer ${token}` }, cache: "no-store",
    });
    if (!response.ok) throw new Error(`Gmail API request failed (${response.status}).`);
    return response.json() as Promise<T>;
  }

  async function message(id: string, token: string): Promise<GmailProfitMessage> {
    const payload = await request<GmailMessageResponse>(`/messages/${encodeURIComponent(id)}?format=raw`, token);
    return { id: payload.id, receivedAt: new Date(Number(payload.internalDate)).toISOString(), raw: decodeBase64Url(payload.raw) };
  }

  return {
    async findMessages({ messageId }) {
      const token = await accessToken();
      if (messageId) return [await message(messageId, token)];
      const query = `from:${EPCC_PROFIT_SENDER} subject:"${EPCC_PROFIT_SUBJECT}"`;
      const list = await request<GmailListResponse>(`/messages?q=${encodeURIComponent(query)}&maxResults=25`, token);
      const messages = await Promise.all((list.messages ?? []).map((item) => message(item.id, token)));
      return messages.sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));
    },
  };
}
