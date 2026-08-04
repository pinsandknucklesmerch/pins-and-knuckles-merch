import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_TV_SETTINGS, mapTvSettingsRows, safeTvSettings, sortTvSettings, validateTvSettings, type TvSlideSetting } from "../lib/tvSettings.ts";

const valid: TvSlideSetting[] = DEFAULT_TV_SETTINGS.map((row) => ({ ...row }));

test("TV settings map into chronological display order", () => {
  const rows = [...valid].reverse().map((row) => ({ organisation_id: "org", slide_key: row.slideKey, is_enabled: row.isEnabled, display_order: row.displayOrder, duration_seconds: row.durationSeconds, updated_at: "", updated_by: null }));
  assert.deepEqual(mapTvSettingsRows(rows).map((row) => row.slideKey), ["overview", "ytd", "year_comparison", "snuggle", "team_members"]);
});

test("approved fallback defaults contain all five enabled 30-second slides", () => {
  assert.equal(DEFAULT_TV_SETTINGS.length, 5);
  assert.ok(DEFAULT_TV_SETTINGS.every((row) => row.isEnabled && row.durationSeconds === 30));
});

test("safe TV runtime fallback enables four slides at 30 seconds", () => {
  const settings = safeTvSettings().slides;
  assert.deepEqual(settings.filter((row) => row.isEnabled).map((row) => row.slideKey), ["overview", "ytd", "year_comparison", "snuggle"]);
  assert.ok(settings.every((row) => row.durationSeconds === 30));
});

test("TV settings validation rejects incomplete, duplicate-order, invalid-duration, and all-disabled payloads", () => {
  assert.ok(validateTvSettings(valid.slice(0, 4))?.includes("five"));
  assert.ok(validateTvSettings(valid.map((row, index) => index === 1 ? { ...row, displayOrder: 0 } : row))?.includes("unique"));
  assert.ok(validateTvSettings(valid.map((row, index) => index === 1 ? { ...row, durationSeconds: 301 } : row))?.includes("10 and 300"));
  assert.ok(validateTvSettings(valid.map((row) => ({ ...row, isEnabled: false })))?.includes("enabled"));
  assert.equal(validateTvSettings(sortTvSettings(valid)), null);
});
