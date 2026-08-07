import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("MagicBento keeps GSAP behind the opt-in animation boundary", async () => {
  const source = await readFile(new URL("./MagicBento.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /import\s+\{\s*gsap\s*\}\s+from\s+["']gsap/);
  assert.match(source, /import\(["']gsap["']\)/);
  assert.match(source, /enableStars \|\| enableSpotlight \|\| enableTilt \|\| enableMagnetism \|\| clickEffect/);
  assert.match(source, /new ResizeObserver\(scheduleBoundsRefresh\)/);
  assert.match(source, /const cardRect = cardBounds\.get\(card\)/);
  assert.match(source, /<Link key=\{item\.id\}/);
});
