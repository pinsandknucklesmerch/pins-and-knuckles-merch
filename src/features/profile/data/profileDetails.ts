import type { PinsHubAccessResult } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import type { ProfileDetails } from "../types";

export async function getProfileDetails(access: PinsHubAccessResult): Promise<ProfileDetails | null> {
  if (!access.user || !access.membership || !access.access) return null;
  const supabase = await createClient();
  const [profileResponse, organisationResponse] = await Promise.all([
    supabase.from("profiles").select("full_name,email").eq("id", access.user.id).maybeSingle(),
    supabase.from("organisations").select("name").eq("id", access.membership.organisation_id).maybeSingle(),
  ]);
  if (profileResponse.error || organisationResponse.error || !profileResponse.data || !organisationResponse.data) return null;
  return {
    displayName: profileResponse.data.full_name?.trim() || "Unavailable",
    email: profileResponse.data.email ?? access.user.email ?? "Unavailable",
    organisation: organisationResponse.data.name,
    accessRole: access.access.access_level,
  };
}
