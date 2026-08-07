import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("auth forms expose alert errors and polite status messages", async () => {
  const sources = await Promise.all(["LoginForm.tsx", "ForgotPasswordForm.tsx", "UpdatePasswordForm.tsx"].map((file) => readFile(new URL(`./${file}`, import.meta.url), "utf8")));
  for (const source of sources) {
    assert.match(source, /<p role="alert"/);
    assert.match(source, /<p aria-live="polite"/);
  }
});
