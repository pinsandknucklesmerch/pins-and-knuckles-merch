import type { PinsHubAccessResult } from "@/lib/access/pinsHubAccess";
import { hasAdminAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapMondayMember } from "@/features/sales-dashboard/domain/memberIdentity";
import { loadMemberPerformance, type MemberPerformanceData } from "@/features/sales-dashboard/data/memberPerformanceRepository";
import type { ProfileIdentity } from "./profileDetails";

export type ProfilePerformanceSubject = {
  displayName: string;
  email: string;
  role: string;
  mondayMemberName: string | null;
  performance: MemberPerformanceData | null;
};

export async function getOwnProfilePerformance(access: PinsHubAccessResult, identity?: ProfileIdentity | null): Promise<ProfilePerformanceSubject | null> {
  if (!access.user || !access.membership || !access.access) return null;
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("organisation_members")
    .select("monday_member_id,role")
    .eq("id", access.membership.id)
    .eq("organisation_id", access.membership.organisation_id)
    .eq("user_id", access.user.id)
    .maybeSingle();
  if (!membership || !identity) return null;
  const mondayIdentity = membership.monday_member_id ? mapMondayMember({ id: membership.monday_member_id }) : null;
  return {
    displayName: identity.fullName?.trim() || "Unavailable",
    email: identity.email ?? access.user.email ?? "Unavailable",
    role: membership.role,
    mondayMemberName: mondayIdentity?.displayName ?? null,
    performance: mondayIdentity ? await loadMemberPerformance(mondayIdentity.key, access.membership.organisation_id) : null,
  };
}

export async function getAdminProfilePerformance(access: PinsHubAccessResult, membershipId: string): Promise<ProfilePerformanceSubject | null> {
  if (!hasAdminAccess(access) || !access.membership?.organisation_id) return null;
  const admin = createAdminClient();
  const { data: membership, error } = await admin
    .from("organisation_members")
    .select("user_id,role,monday_member_id,profiles!organisation_members_user_id_fkey(full_name,email)")
    .eq("id", membershipId)
    .eq("organisation_id", access.membership.organisation_id)
    .maybeSingle();
  if (error || !membership || membership.role === "owner") return null;
  const profile = Array.isArray(membership.profiles) ? membership.profiles[0] : membership.profiles;
  const identity = membership.monday_member_id ? mapMondayMember({ id: membership.monday_member_id }) : null;
  return {
    displayName: profile?.full_name?.trim() || "Unavailable",
    email: profile?.email ?? "Unavailable",
    role: membership.role,
    mondayMemberName: identity?.displayName ?? null,
    performance: identity ? await loadMemberPerformance(identity.key, access.membership.organisation_id) : null,
  };
}
