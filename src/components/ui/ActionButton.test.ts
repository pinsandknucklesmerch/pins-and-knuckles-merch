import assert from "node:assert/strict";
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

// @ts-expect-error Disabled links are intentionally rejected by the shared contract.
const disabledLink: ActionButtonProps = {
  children: "Unavailable",
  href: "/hub",
  disabled: true,
};

test("ActionButton contract keeps links enabled and buttons disableable", () => {
  assert.equal(enabledLink.href, "/hub");
  assert.equal(disabledButton.disabled, true);
  assert.equal(disabledLink.disabled, true);
});
