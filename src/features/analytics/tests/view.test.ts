import assert from "node:assert/strict";
import test from "node:test";
import { parseAnalyticsView } from "../lib/view.ts";

test("parses supported Analytics views and falls back to Overview", () => {
  assert.equal(parseAnalyticsView("website"), "website");
  assert.equal(parseAnalyticsView("social-media"), "social-media");
  assert.equal(parseAnalyticsView("unknown"), "overview");
  assert.equal(parseAnalyticsView(undefined), "overview");
});
