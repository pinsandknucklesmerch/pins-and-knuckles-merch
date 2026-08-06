import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { hasAdminAccess, hasDeveloperAccess } from "./pinsHubAccess.ts";
import { hasPinsHubAccessLevel, isPinsHubAccessLevel } from "./pinsHubRoles.ts";

function access(level: "developer" | "admin" | "write" | "read", role: "owner" | "admin" = "admin") {
  return { access: { access_level: level }, membership: { role } } as never;
}

test("developer inherits administrator permissions and developer access", () => {
  assert.equal(isPinsHubAccessLevel("developer"), true);
  assert.equal(hasPinsHubAccessLevel("developer", "read"), true);
  assert.equal(hasPinsHubAccessLevel("developer", "write"), true);
  assert.equal(hasPinsHubAccessLevel("developer", "admin"), true);
  assert.equal(hasAdminAccess(access("developer")), true);
  assert.equal(hasDeveloperAccess(access("developer")), true);
});

test("admin does not gain developer access, while owner retains override", () => {
  assert.equal(hasAdminAccess(access("admin")), true);
  assert.equal(hasDeveloperAccess(access("admin")), false);
  assert.equal(hasDeveloperAccess(access("admin", "owner")), true);
});

test("developer navigation and routes use the central server-side permission helper", async () => {
  const [sidebar, landingRoute, feedbackRoute, diagnosticsRoute, userDialog] = await Promise.all([
    readFile("src/components/layout/SidebarNav.tsx", "utf8"),
    readFile("src/app/(hub)/hub/developer/page.tsx", "utf8"),
    readFile("src/app/(hub)/hub/developer/feedback/page.tsx", "utf8"),
    readFile("src/app/(hub)/hub/developer/diagnostics/page.tsx", "utf8"),
    readFile("src/features/team/components/UserEditDialog.tsx", "utf8"),
  ]);
  assert.match(sidebar, /canDeveloper \? renderItem\(hubDeveloperNavigation/);
  assert.match(feedbackRoute, /if \(!hasDeveloperAccess\(access\)\) redirect\("\/hub"\)/);
  assert.match(diagnosticsRoute, /if \(!hasDeveloperAccess\(access\)\) redirect\("\/hub"\)/);
  assert.match(landingRoute, /href="\/hub\/developer\/feedback"/);
  assert.match(landingRoute, /href="\/hub\/developer\/diagnostics"/);
  assert.match(userDialog, /pinsHubAccessLabels\[level\]/);
});
