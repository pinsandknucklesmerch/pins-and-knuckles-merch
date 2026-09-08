import assert from "node:assert/strict";
import test from "node:test";
import { BACKGROUND_ANIMATION_STORAGE_KEY, readStoredBackgroundAnimation } from "./backgroundAnimationPreference.ts";

test("background animation defaults on and uses a namespaced browser preference", () => {
  assert.equal(BACKGROUND_ANIMATION_STORAGE_KEY, "pins-hub-background-animation");
  assert.equal(readStoredBackgroundAnimation(null), true);
  assert.equal(readStoredBackgroundAnimation("false"), false);
  assert.equal(readStoredBackgroundAnimation("true"), true);
});
