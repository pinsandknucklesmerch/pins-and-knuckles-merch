import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("resolves the authenticated root redirect before rendering landing content", () => {
  assert.match(page, /export default async function Home\(\)/);
  assert.match(page, /const landingPanel = await LandingPanel\(\)/);
  assert.match(page, /if \(user\) \{\s*redirect\("\/hub"\);\s*\}/);
  assert.doesNotMatch(page, /<Suspense/);
  assert.doesNotMatch(page, /href="\/hub"/);
});
