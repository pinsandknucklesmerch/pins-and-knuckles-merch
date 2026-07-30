import assert from "node:assert/strict";
import test from "node:test";
import { copyText } from "./copyText.ts";

test("uses the clipboard API for copy actions when available", async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const writes: string[] = [];
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText: async (value: string) => { writes.push(value); } } } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { isSecureContext: true } });
  try { await copyText("UK quote"); assert.deepEqual(writes, ["UK quote"]); }
  finally {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator); else delete (globalThis as { navigator?: unknown }).navigator;
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else delete (globalThis as { window?: unknown }).window;
  }
});
