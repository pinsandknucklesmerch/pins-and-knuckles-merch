import assert from "node:assert/strict";
import test from "node:test";
import { parseWebsiteAnalyticsPeriod } from "../lib/period.ts";
import { parseAnalyticsView } from "../lib/view.ts";

test("parses supported Analytics views and falls back to Overview", () => {
  assert.equal(parseAnalyticsView("website"), "website");
  assert.equal(parseAnalyticsView("social-media"), "social-media");
  assert.equal(parseAnalyticsView("unknown"), "overview");
  assert.equal(parseAnalyticsView(undefined), "overview");
});

test("parses supported Website Analytics periods and defaults to 30 days", () => {
  assert.equal(parseWebsiteAnalyticsPeriod("7"), 7);
  assert.equal(parseWebsiteAnalyticsPeriod("30"), 30);
  assert.equal(parseWebsiteAnalyticsPeriod("90"), 90);
  assert.equal(parseWebsiteAnalyticsPeriod("14"), 30);
  assert.equal(parseWebsiteAnalyticsPeriod(undefined), 30);
});
