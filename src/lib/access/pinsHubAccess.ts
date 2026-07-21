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

type ProfileAccessRow = {
  id: string;
  email: string | null;
  organisation_members: Array<Membership & {
    app_access: Array<{
      id: string;
      organisation_member_id: string;
      app_key: string;
      access_level: string;
    }>;
  }>;
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

    const { data: profiles, error: accessQueryError } = await supabase
      .from("profiles")
      .select("id,email,organisation_members!organisation_members_user_id_fkey(id,organisation_id,role,app_access(id,organisation_member_id,app_key,access_level))")
      .returns<ProfileAccessRow[]>();

    if (accessQueryError) {
      return {
        ...createUnauthenticatedResult(),
        error: accessQueryError.message,
        queryError: accessQueryError.message,
        accessDeniedReason: accessQueryError.message,
      };
    }

    const profile = profiles[0];

    if (!profile) {
      return {
        ...createUnauthenticatedResult(),
        accessDeniedReason: "No authenticated user.",
      };
    }

    const memberships = profile.organisation_members;
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

    if (!memberships.length) {
      return {
        ...baseResult,
        accessDeniedReason: "No organisation membership found.",
      };
    }

    const accessRow = memberships
      .flatMap((membership) => membership.app_access)
      .find((row) => row.app_key === "pins_hub" && VALID_PINS_HUB_ACCESS_LEVELS.has(row.access_level));
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
