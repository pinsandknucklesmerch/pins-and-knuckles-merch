import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { ActionButtonProps } from "./ActionButton";

const enabledLink = {
  children: "Open",
  href: "/hub",
} satisfies ActionButtonProps;

const disabledButton = {
  children: "Save",
  disabled: true,
} satisfies ActionButtonProps;

const disabledLink: ActionButtonProps = {
  children: "Unavailable",
  href: "/hub",
  disabled: true,
};

test("ActionButton contract keeps links enabled and buttons disableable", async () => {
  assert.equal(enabledLink.href, "/hub");
  assert.equal(disabledButton.disabled, true);
  assert.equal(disabledLink.disabled, true);
  const source = await readFile(new URL("./ActionButton.tsx", import.meta.url), "utf8");
  assert.match(source, /aria-disabled=\{disabled \|\| undefined\}/);
  assert.match(source, /tabIndex=\{disabled \? -1 : undefined\}/);
  assert.match(source, /event\.preventDefault\(\)/);
});
