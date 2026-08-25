import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("mobile navigation has a dismissible backdrop and focus-management hooks", async () => {
  const source = await readFile(new URL("./SidebarNav.tsx", import.meta.url), "utf8");

  assert.match(source, /aria-controls=\"mobile-sidebar-navigation\"/);
  assert.match(source, /aria-label=\"Close navigation\"/);
  assert.match(source, /fixed inset-0 z-40/);
  assert.match(source, /event\.key === \"Escape\"/);
  assert.match(source, /previousFocusRef\.current/);
  assert.match(source, /mobileTriggerRef\.current/);
  assert.match(source, /overflow-y-auto/);
});

test("app shell keeps page width constrained without clipping intentional surfaces", async () => {
  const source = await readFile(new URL("./AppShell.tsx", import.meta.url), "utf8");

  assert.match(source, /min-w-0/);
  assert.doesNotMatch(source, /overflow-x-clip/);
  assert.match(source, /h-\[100dvh\]/);
});

test("navigation skips prefetch only for its current route", async () => {
  const source = await readFile(new URL("./SidebarNav.tsx", import.meta.url), "utf8");

  assert.match(source, /const prefetchFor = \(href: string\) => pathname === href \? false : undefined/);
  assert.match(source, /prefetch=\{prefetchFor\(item\.href\)\}/);
  assert.match(source, /prefetch=\{prefetchFor\(child\.href\)\}/);
  assert.match(source, /prefetch=\{prefetchFor\("\/hub\/team"\)\}/);
  assert.match(source, /prefetch=\{prefetchFor\(hubProfileNavigation\.href\)\}/);
});
