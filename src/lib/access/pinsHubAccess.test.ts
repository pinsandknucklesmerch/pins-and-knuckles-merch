import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  effectivePinsHubAccessLevel,
  hasAdminAccess,
  hasDeveloperAccess,
  resolvePinsHubAccess,
} from "./pinsHubAccess.ts";
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

test("owner receives effective admin access without changing stored access", () => {
  assert.equal(effectivePinsHubAccessLevel(access("read", "owner")), "admin");
  assert.equal(effectivePinsHubAccessLevel(access("write", "owner")), "admin");
  assert.equal(hasAdminAccess(access("read", "owner")), true);
  assert.equal(hasDeveloperAccess(access("read", "owner")), true);
});

test("access resolution selects the authenticated user's profile", async () => {
  let profileFilter: [string, string] | null = null;
  const authenticatedUserId = "authenticated-user";
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { id: authenticatedUserId } },
        error: null,
      }),
    },
    from: (table: string) => {
      assert.equal(table, "profiles");
      return {
        select: () => ({
          eq: (column: string, value: string) => {
            profileFilter = [column, value];
            return {
              returns: async () => ({
                data: [{
                  id: authenticatedUserId,
                  email: "authenticated@example.com",
                  last_active_at: null,
                  organisation_members: [{
                    id: "authenticated-membership",
                    organisation_id: "organisation-1",
                    role: "admin",
                    is_active: true,
                    app_access: [{
                      id: "authenticated-access",
                      organisation_member_id: "authenticated-membership",
                      app_key: "pins_hub",
                      access_level: "write",
                    }],
                  }],
                }],
                error: null,
              }),
            };
          },
        }),
      };
    },
  };

  const result = await resolvePinsHubAccess(client as never);

  assert.deepEqual(profileFilter, ["id", authenticatedUserId]);
  assert.equal(result.authenticated, true);
  assert.equal(result.user?.id, authenticatedUserId);
  assert.equal(result.membership?.id, "authenticated-membership");
  assert.equal(result.access?.id, "authenticated-access");
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
  assert.match(feedbackRoute, /hasDeveloperAccess\(access\).*redirect\("\/hub"\)/);
  assert.match(diagnosticsRoute, /hasDeveloperAccess\(access\).*redirect\("\/hub"\)/);
  assert.match(landingRoute, /href="\/hub\/developer\/feedback"/);
  assert.match(landingRoute, /href="\/hub\/developer\/diagnostics"/);
  assert.match(userDialog, /pinsHubAccessLabels\[level\]/);
});
