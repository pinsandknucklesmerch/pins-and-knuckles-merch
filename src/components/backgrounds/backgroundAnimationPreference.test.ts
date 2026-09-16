import assert from "node:assert/strict";
import test from "node:test";
import {
  BACKGROUND_ANIMATION_STORAGE_KEY,
  isBackgroundAnimationControlDisabled,
  readStoredBackgroundAnimation,
} from "./backgroundAnimationPreference.ts";

test("background animation defaults on and uses a namespaced browser preference", () => {
  assert.equal(BACKGROUND_ANIMATION_STORAGE_KEY, "pins-hub-background-animation");
  assert.equal(readStoredBackgroundAnimation(null), true);
  assert.equal(readStoredBackgroundAnimation("false"), false);
  assert.equal(readStoredBackgroundAnimation("true"), true);
});

test("background animation controls remain disabled until the browser preference is ready", () => {
  assert.equal(isBackgroundAnimationControlDisabled(false, false), true);
  assert.equal(isBackgroundAnimationControlDisabled(true, false), false);
  assert.equal(isBackgroundAnimationControlDisabled(true, true), true);
});

test("background animation toggle disabled state is always a boolean", () => {
  assert.equal(isBackgroundAnimationControlDisabled(true, null), false);
  assert.equal(isBackgroundAnimationControlDisabled(null, false), true);
});
