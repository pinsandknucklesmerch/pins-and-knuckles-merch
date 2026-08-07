import type { PinsHubAccessResult } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import type { ProfileDetails } from "../types";

export type ProfileIdentity = { fullName: string | null; email: string | null };

export async function getProfileIdentity(access: PinsHubAccessResult): Promise<ProfileIdentity | null> {
  if (!access.user) return null;
  const supabase = await createClient();
  const response = await supabase.from("profiles").select("full_name,email").eq("id", access.user.id).maybeSingle();
  return response.error || !response.data ? null : { fullName: response.data.full_name, email: response.data.email };
}

export async function getProfileDetails(access: PinsHubAccessResult, identity?: ProfileIdentity | null): Promise<ProfileDetails | null> {
  if (!access.user || !access.membership || !access.access) return null;
  const supabase = await createClient();
  const organisationResponse = await supabase.from("organisations").select("name").eq("id", access.membership.organisation_id).maybeSingle();
  if (!identity || organisationResponse.error || !organisationResponse.data) return null;
  return {
    displayName: identity.fullName?.trim() || "Unavailable",
    email: identity.email ?? access.user.email ?? "Unavailable",
    organisation: organisationResponse.data.name,
    accessRole: access.access.access_level,
  };
}
