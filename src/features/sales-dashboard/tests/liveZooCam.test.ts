import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { LIVE_ZOO_CAM_SOURCES, SMITHSONIAN_PANDA_CAM } from "../lib/liveZooCam.ts";
import { DEFAULT_TV_SETTINGS, TV_SLIDE_KEYS } from "../lib/tvSettings.ts";

test("Live Zoo Cam is registered alongside the existing TV slides", () => {
  assert.deepEqual(TV_SLIDE_KEYS, ["overview", "ytd", "year_comparison", "snuggle", "team_members", "live-zoo-cam", "current-month-comparison"]);
  assert.equal(DEFAULT_TV_SETTINGS.find((slide) => slide.slideKey === "live-zoo-cam")?.isEnabled, true);
  assert.ok(TV_SLIDE_KEYS.includes("overview"));
  assert.ok(TV_SLIDE_KEYS.includes("team_members"));
});

test("Smithsonian source is attributed and uses only the official page while no official embed is verified", () => {
  assert.deepEqual(LIVE_ZOO_CAM_SOURCES, [SMITHSONIAN_PANDA_CAM]);
  assert.deepEqual(SMITHSONIAN_PANDA_CAM, {
    id: "smithsonian-panda",
    name: "Giant Panda Cam",
    provider: "Smithsonian’s National Zoo",
    officialPageUrl: "https://nationalzoo.si.edu/webcams/panda-cam",
    embeddablePlayerUrl: null,
  });
});

test("the Zoo Cam component falls back to the official page and keeps embed loading stable", () => {
  const component = readFileSync(new URL("../components/LiveZooCamSlide.tsx", import.meta.url), "utf8");
  assert.match(component, /Live from \{source\.provider\}/);
  assert.match(component, /href=\{source\.officialPageUrl\}/);
  assert.match(component, /target="_blank"/);
  assert.match(component, /rel="noreferrer"/);
  assert.match(component, /status !== "fallback"/);
  assert.doesNotMatch(component, /useEffect|setInterval|setTimeout/);
  assert.match(component, /referrerPolicy="strict-origin-when-cross-origin"/);
});

test("TV settings migration preserves existing settings and adds the Zoo Cam slide", () => {
  const migration = readFileSync("supabase/migrations/20260817100000_add_live_zoo_cam_tv_slide.sql", "utf8");
  assert.match(migration, /'live-zoo-cam'/);
  assert.match(migration, /jsonb_array_length\(p_settings\) <> 6/);
  assert.match(migration, /"live-zoo-cam","is_enabled":true,"display_order":5/);
});
