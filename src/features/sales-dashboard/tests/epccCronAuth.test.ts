import assert from "node:assert/strict";
import test from "node:test";
import { isEpccCronRequestAuthorised } from "../server/epccCronAuth.ts";

test("EPCC cron authorisation rejects missing and invalid Bearer tokens", () => {
  const secret = "test-cron-secret";
  assert.equal(isEpccCronRequestAuthorised(new Request("https://example.test/api/cron/epcc-profit"), secret), false);
  assert.equal(isEpccCronRequestAuthorised(new Request("https://example.test/api/cron/epcc-profit", { headers: { authorization: "Bearer wrong-token" } }), secret), false);
  assert.equal(isEpccCronRequestAuthorised(new Request("https://example.test/api/cron/epcc-profit", { headers: { authorization: `Bearer ${secret}` } }), secret), true);
});
