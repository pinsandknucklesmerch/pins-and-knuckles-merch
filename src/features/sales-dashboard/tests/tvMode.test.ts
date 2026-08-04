import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildNormalModeUrl, buildTvModeUrl, DEFAULT_TV_DURATION_SECONDS, isTvMode, nextTvView, parseTvDuration, previousTvView, tvDurationMilliseconds, TV_DATA_REFRESH_INTERVAL_MS, TV_DURATION_OPTIONS_SECONDS, TV_VIEWS } from "../lib/tvMode.ts";

test("TV mode activates only for tv=1", () => {
  assert.equal(isTvMode("1"), true);
  assert.equal(isTvMode("0"), false);
  assert.equal(isTvMode("true"), false);
  assert.equal(isTvMode(undefined), false);
  assert.equal(isTvMode(["1", "0"]), true);
});

test("TV slide order wraps in both directions", () => {
  assert.deepEqual(TV_VIEWS, ["overview", "sales-activity", "ytd", "year-comparison", "snuggle"]);
  assert.equal(nextTvView("snuggle"), "overview");
  assert.equal(previousTvView("overview"), "snuggle");
  assert.equal(nextTvView("overview"), "sales-activity");
  assert.equal(previousTvView("year-comparison"), "ytd");
});

test("TV duration options validate to the default and milliseconds", () => {
  assert.deepEqual(TV_DURATION_OPTIONS_SECONDS, [10, 20, 30, 45, 60]);
  assert.equal(DEFAULT_TV_DURATION_SECONDS, 20);
  assert.equal(parseTvDuration("30"), 30);
  assert.equal(parseTvDuration(["45", "10"]), 45);
  assert.equal(parseTvDuration(undefined), 20);
  assert.equal(parseTvDuration("0"), 20);
  assert.equal(parseTvDuration("-10"), 20);
  assert.equal(parseTvDuration("25"), 20);
  assert.equal(tvDurationMilliseconds(60), 60_000);
  assert.equal(TV_DATA_REFRESH_INTERVAL_MS, 5 * 60_000);
});

test("TV entry and exit URLs preserve the applied reporting context", () => {
  assert.equal(buildTvModeUrl({ month: 8, year: 2026, view: "company", durationSeconds: 30 }), "/hub/sales-dashboard?month=8&year=2026&tv=1&duration=30&view=company");
  assert.equal(buildTvModeUrl({ month: 8, year: 2026, durationSeconds: 25 }), "/hub/sales-dashboard?month=8&year=2026&tv=1&duration=20");
  assert.equal(buildNormalModeUrl({ month: 8, year: 2026, view: "members", member: "alice" }), "/hub/sales-dashboard?month=8&year=2026&view=members&member=alice");
});

test("TV controller resets its cycle and cleans up rotation and refresh timers", () => {
  const component = readFileSync(new URL("../components/SalesDashboardTvView.tsx", import.meta.url), "utf8");
  assert.match(component, /setCycleKey\(\(current\) => current \+ 1\)/);
  assert.match(component, /window\.setTimeout\(moveNext, durationMs\)/);
  assert.match(component, /setProgressKey/);
  assert.match(component, /buildTvModeUrl/);
  assert.match(component, /window\.history\.replaceState/);
  assert.match(component, /buildNormalModeUrl/);
  assert.match(component, /window\.clearTimeout\(timeout\)/);
  assert.match(component, /window\.setTimeout\(\(\) => router\.refresh\(\), TV_DATA_REFRESH_INTERVAL_MS\)/);
  assert.match(component, /window\.clearTimeout\(refreshTimer\)/);
});

test("TV controller pauses on pointer, focus, and hidden-document state", () => {
  const component = readFileSync(new URL("../components/SalesDashboardTvView.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../components/SalesDashboardTvView.module.css", import.meta.url), "utf8");
  assert.match(component, /const paused = pointerOver \|\| focusWithin \|\| documentHidden/);
  assert.match(component, /visibilitychange/);
  assert.match(component, /onPointerEnter/);
  assert.match(component, /onFocusCapture/);
  assert.match(component, /data-tv-group/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /tv-enter-item/);
  assert.match(styles, /animation-delay: calc\(var\(--tv-enter-index/);
});

test("TV slides place Overview KPIs and keep Conversion Rate out of Sales Activity", () => {
  const component = readFileSync(new URL("../components/SalesDashboardTvView.tsx", import.meta.url), "utf8");
  const overview = component.slice(component.indexOf('activeView === "overview"'), component.indexOf('activeView === "sales-activity"'));
  const activity = component.slice(component.indexOf('activeView === "sales-activity"'), component.indexOf('activeView === "snuggle"'));
  assert.match(overview, /ProfitShirtKpi/);
  assert.match(overview, /SalesInboxKpi/);
  assert.match(overview, /CombinedKpiCard first=\{conversion\}/);
  assert.match(overview, /animationKey=\{cycleKey\}/);
  assert.match(activity, /CombinedKpiCard first=\{quotes\} second=\{orders\}/);
  assert.doesNotMatch(activity, /third=\{conversion\}/);
  assert.match(component, /gaugeAnimationDelayMs=\{320\}/);
  assert.match(component, /data-tv-view="overview"/);
});
