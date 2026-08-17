import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildNormalModeUrl, buildTvModeUrl, DEFAULT_TV_DURATION_SECONDS, isTvMode, nextTvView, parseTvDuration, previousTvView, tvDurationMilliseconds, TV_VIEWS } from "../lib/tvMode.ts";
import { TV_RUNTIME_FALLBACK_SETTINGS } from "../lib/tvSettings.ts";

test("TV mode activates only for tv=1", () => {
  assert.equal(isTvMode("1"), true);
  assert.equal(isTvMode("true"), false);
  assert.equal(isTvMode(["1", "0"]), true);
});

test("TV slide registry wraps in both directions", () => {
  assert.deepEqual(TV_VIEWS, ["overview", "ytd", "year_comparison", "snuggle", "team_members", "live-zoo-cam", "current-month-comparison"]);
  assert.equal(nextTvView("live-zoo-cam"), "current-month-comparison");
  assert.equal(previousTvView("overview"), "current-month-comparison");
  assert.equal(nextTvView("overview", ["overview", "snuggle"]), "snuggle");
  assert.equal(previousTvView("overview", ["overview", "snuggle"]), "snuggle");
});

test("TV URL helpers preserve reporting context and duration fallback", () => {
  assert.equal(DEFAULT_TV_DURATION_SECONDS, 30);
  assert.equal(parseTvDuration("30"), 30);
  assert.equal(parseTvDuration("25"), 30);
  assert.equal(tvDurationMilliseconds(60), 60_000);
  assert.equal(buildTvModeUrl({ month: 8, year: 2026, durationSeconds: 30 }), "/hub/sales-dashboard?month=8&year=2026&tv=1&duration=30");
  assert.equal(buildNormalModeUrl({ month: 8, year: 2026 }), "/hub/sales-dashboard?month=8&year=2026");
});

test("TV controller uses the safe six-slide fallback, skips Team Members, and pauses hidden tabs", () => {
  const component = readFileSync(new URL("../components/SalesDashboardTvView.tsx", import.meta.url), "utf8");
  assert.deepEqual(TV_RUNTIME_FALLBACK_SETTINGS.filter((slide) => slide.isEnabled).map((slide) => slide.slideKey), ["overview", "ytd", "year_comparison", "snuggle", "live-zoo-cam", "current-month-comparison"]);
  assert.equal(TV_RUNTIME_FALLBACK_SETTINGS.find((slide) => slide.slideKey === "team_members")?.isEnabled, false);
  assert.match(component, /safeTvSettings\(\)\.slides\.filter/);
  assert.match(component, /durationSeconds/);
  assert.match(component, /setManualPaused/);
  assert.match(component, /visibilitychange/);
  assert.match(component, /<LiveZooCamSlide/);
  assert.match(component, /<CurrentMonthComparisonView/);
  assert.match(component, /styles\.tvEnter/);
  assert.match(component, /if \(nextView === activeView\) return/);
  assert.doesNotMatch(component, /sales-dashboard\/tv\/settings|<Settings|>Settings</);
  const styles = readFileSync(new URL("../components/SalesDashboardTvView.module.css", import.meta.url), "utf8");
  assert.match(styles, /@keyframes tv-enter/);
  assert.match(styles, /scale\(0\.99\)/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("dashboard rendering does not depend on TV settings or its RPC", () => {
  const page = readFileSync(new URL("../../../app/(hub)/hub/sales-dashboard/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /loadSalesDashboardTvSettings|tvSettings|sales_dashboard_tv_settings|save_sales_dashboard_tv_settings/);
});

test("Team Members remains a normal dashboard tab", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /activeDashboardView === "team-members"/);
  assert.match(dashboard, /<TeamMembersTab/);
});
