import assert from "node:assert/strict";
import test from "node:test";
import { createGmailProfitClient, mapWithConcurrency, retryAfterMilliseconds } from "../server/gmailProfitClient.ts";

const configuration = { clientId: "client", clientSecret: "secret", refreshToken: "refresh", reportAddress: "reports@example.test" };
const oauthResponse = () => new Response(JSON.stringify({ access_token: "access" }), { headers: { "content-type": "application/json" } });
const gmailError = (status: number, retryAfter: string | null = null) => new Response(JSON.stringify({ error: { message: "User rate limit exceeded", errors: [{ reason: "userRateLimitExceeded", message: "User rate limit exceeded" }] } }), { status, headers: { "content-type": "application/json", ...(retryAfter ? { "retry-after": retryAfter } : {}) } });

test("parses both supported Retry-After formats", () => {
  const now = Date.parse("2026-08-25T08:00:00Z");
  assert.equal(retryAfterMilliseconds("2", now), 2_000);
  assert.equal(retryAfterMilliseconds("Mon, 25 Aug 2026 08:00:03 GMT", now), 3_000);
  assert.equal(retryAfterMilliseconds("invalid", now), null);
});

test("retries a Gmail list 429 three times at most and respects Retry-After", async () => {
  let listAttempts = 0;
  const delays: number[] = [];
  const client = createGmailProfitClient({
    configuration,
    now: () => Date.parse("2026-08-25T08:00:00Z"),
    sleep: async (delay) => { delays.push(delay); },
    fetch: async (input) => {
      const url = String(input);
      if (url === "https://oauth2.googleapis.com/token") return oauthResponse();
      listAttempts += 1;
      return listAttempts < 3 ? gmailError(429, "1") : new Response(JSON.stringify({ messages: [] }), { headers: { "content-type": "application/json" } });
    },
  });

  await client.findMessages({});
  assert.equal(listAttempts, 3);
  assert.deepEqual(delays, [1_000, 1_000]);
});

test("reports a sanitized exhausted raw-message Gmail 429", async () => {
  let rawAttempts = 0;
  const delays: number[] = [];
  const client = createGmailProfitClient({
    configuration,
    now: () => Date.parse("2026-08-25T08:00:00Z"),
    sleep: async (delay) => { delays.push(delay); },
    fetch: async (input) => {
      const url = String(input);
      if (url === "https://oauth2.googleapis.com/token") return oauthResponse();
      rawAttempts += 1;
      return gmailError(429, "1");
    },
  });

  await assert.rejects(client.findMessages({ messageId: "gmail-id" }), /Gmail messages\.get\.raw request failed \(429\) after 3\/3 attempts\. reason=userRateLimitExceeded\. message=User rate limit exceeded\. retryAfterMs=1000\./);
  assert.equal(rawAttempts, 3);
  assert.deepEqual(delays, [1_000, 1_000]);
});

test("does not retry normal Gmail 4xx responses", async () => {
  let attempts = 0;
  const client = createGmailProfitClient({
    configuration,
    sleep: async () => { throw new Error("should not sleep"); },
    fetch: async (input) => {
      if (String(input) === "https://oauth2.googleapis.com/token") return oauthResponse();
      attempts += 1;
      return gmailError(403);
    },
  });

  await assert.rejects(client.findMessages({}), /Gmail messages\.list request failed \(403\) after 1\/3 attempts\./);
  assert.equal(attempts, 1);
});

test("bounds raw-message work and stops dequeuing after a failure", async () => {
  let active = 0;
  let maximumActive = 0;
  const started: number[] = [];

  await assert.rejects(mapWithConcurrency([0, 1, 2, 3, 4, 5], 3, async (item) => {
    started.push(item);
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    if (item === 0) throw new Error("first request failed");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    active -= 1;
    return item;
  }), /first request failed/);

  assert.equal(maximumActive, 3);
  assert.deepEqual(started, [0, 1, 2]);
});
