import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

type OrganisationRole = "owner" | "admin" | "manager" | "staff" | "viewer";
type PinsHubAccessLevel = "admin" | "write" | "read";

type Membership = {
  id: string;
  organisation_id: string;
  role: OrganisationRole;
};

type PinsHubAppAccess = {
  id: string;
  organisation_member_id: string;
  app_key: "pins_hub";
  access_level: PinsHubAccessLevel;
};

export type PinsHubAccessResult = {
  authenticated: boolean;
  user: { id: string; email: string | null } | null;
  membership: Membership | null;
  access: PinsHubAppAccess | null;
  error: string | null;
  queryError: string | null;
  accessDeniedReason: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
};

type MembershipRow = {
  id: string;
  organisation_id: string;
  role: OrganisationRole;
};

type AppAccessRow = {
  id: string;
  organisation_member_id: string;
  app_key: string;
  access_level: string;
};

const VALID_PINS_HUB_ACCESS_LEVELS = new Set(["admin", "write", "read"]);

function createUnauthenticatedResult(): PinsHubAccessResult {
  return {
    authenticated: false,
    user: null,
    membership: null,
    access: null,
    error: null,
    queryError: null,
    accessDeniedReason: null,
  };
}

export const getCurrentPinsHubAccess = cache(
  async function getCurrentPinsHubAccess(): Promise<PinsHubAccessResult> {
    const supabase = await createClient();

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .returns<ProfileRow[]>();

    if (profileError) {
      return {
        ...createUnauthenticatedResult(),
        error: profileError.message,
        queryError: profileError.message,
        accessDeniedReason: profileError.message,
      };
    }

    const profile = profiles[0];

    if (!profile) {
      return {
        ...createUnauthenticatedResult(),
        accessDeniedReason: "No authenticated user.",
      };
    }

    const baseResult: PinsHubAccessResult = {
      authenticated: true,
      user: {
        id: profile.id,
        email: profile.email ?? null,
      },
      membership: null,
      access: null,
      error: null,
      queryError: null,
      accessDeniedReason: null,
    };

    const { data: memberships, error: membershipError } = await supabase
      .from("organisation_members")
      .select("id, organisation_id, role")
      .eq("user_id", profile.id)
      .returns<MembershipRow[]>();

    if (membershipError) {
      return {
        ...baseResult,
        error: membershipError.message,
        queryError: membershipError.message,
      };
    }

    if (!memberships.length) {
      return {
        ...baseResult,
        accessDeniedReason: "No organisation membership found.",
      };
    }

    const membershipIds = memberships.map((membership) => membership.id);
    const { data: accessRows, error: accessError } = await supabase
      .from("app_access")
      .select("id, organisation_member_id, app_key, access_level")
      .eq("app_key", "pins_hub")
      .in("organisation_member_id", membershipIds)
      .returns<AppAccessRow[]>();

    if (accessError) {
      return {
        ...baseResult,
        membership: memberships[0],
        error: accessError.message,
        queryError: accessError.message,
      };
    }

    const accessRow = accessRows.find((row) =>
      VALID_PINS_HUB_ACCESS_LEVELS.has(row.access_level),
    );
    const membership =
      memberships.find(
        (candidate) => candidate.id === accessRow?.organisation_member_id,
      ) ?? memberships[0];

    if (!accessRow) {
      return {
        ...baseResult,
        membership,
        accessDeniedReason: "No pins_hub app access found for authenticated user.",
      };
    }

    return {
      ...baseResult,
      membership,
      access: {
        id: accessRow.id,
        organisation_member_id: accessRow.organisation_member_id,
        app_key: "pins_hub",
        access_level: accessRow.access_level as PinsHubAccessLevel,
      },
    };
  },
);
