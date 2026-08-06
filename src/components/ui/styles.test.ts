import assert from "node:assert/strict";
import test from "node:test";
import { controlClassName, freeEntryNumberClassName, nativeControlClassName, nativeSelectClassName } from "./styles.ts";

test("shared control styles expose browser-specific native control contracts", () => {
  assert.match(controlClassName, /hub-control/);
  assert.equal(nativeControlClassName, "hub-native-control");
  assert.equal(nativeSelectClassName, "hub-native-select");
  assert.equal(freeEntryNumberClassName, "hub-free-entry-number");
});
