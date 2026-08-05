import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../components/MonthlyProfitTshirt.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../components/MonthlyProfitTshirt.module.css", import.meta.url), "utf8");

test("T-shirt liquid uses the artwork coordinate system and clips every wave to the shirt silhouette", () => {
  assert.match(component, /viewBox=\{SHIRT_VIEW_BOX\}/);
  assert.match(component, /clipPathUnits="userSpaceOnUse"/);
  assert.match(component, /fillRule="evenodd"/);
  assert.match(component, /clipPath=\{`url\(#\$\{clipId\}\)`\}/);
  assert.match(component, /fillPercent > 0/);
  assert.match(styles, /\.liquid \{ overflow: hidden; \}/);
});

test("T-shirt liquid has layered waves, target colour, and a static reduced-motion state", () => {
  assert.match(component, /wavePrimary/);
  assert.match(component, /waveSecondary/);
  assert.match(styles, /\.targetMet \.waveFill \{ fill: #6fc49a; \}/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /\.fillLevel \{ transition: none; \}/);
  assert.match(styles, /\.waveSecondary \{ animation: none; \}/);
});
