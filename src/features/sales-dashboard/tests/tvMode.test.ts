import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isTvMode, nextTvView, previousTvView, TV_DATA_REFRESH_INTERVAL_MS, TV_ROTATION_INTERVAL_MS, TV_VIEWS } from "../lib/tvMode.ts";

test("TV mode activates only for tv=1", () => {
  assert.equal(isTvMode("1"), true);
  assert.equal(isTvMode("0"), false);
  assert.equal(isTvMode("true"), false);
  assert.equal(isTvMode(undefined), false);
  assert.equal(isTvMode(["1", "0"]), true);
});

test("TV slide order wraps in both directions", () => {
  assert.deepEqual(TV_VIEWS, ["profit-overview", "sales-activity", "ytd", "year-comparison", "snuggle"]);
  assert.equal(nextTvView("snuggle"), "profit-overview");
  assert.equal(previousTvView("profit-overview"), "snuggle");
  assert.equal(nextTvView("profit-overview"), "sales-activity");
  assert.equal(previousTvView("year-comparison"), "ytd");
});

test("TV timing constants use the requested intervals", () => {
  assert.equal(TV_ROTATION_INTERVAL_MS, 20_000);
  assert.equal(TV_DATA_REFRESH_INTERVAL_MS, 5 * 60_000);
});

test("TV controller resets its cycle and cleans up rotation and refresh timers", () => {
  const component = readFileSync(new URL("../components/SalesDashboardTvView.tsx", import.meta.url), "utf8");
  assert.match(component, /setCycleKey\(\(current\) => current \+ 1\)/);
  assert.match(component, /window\.setTimeout\(moveNext, TV_ROTATION_INTERVAL_MS\)/);
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
  assert.match(styles, /prefers-reduced-motion/);
});
