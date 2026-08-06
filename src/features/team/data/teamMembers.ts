import { createAdminClient } from "@/lib/supabase/admin";
import { mondayIdentities } from "@/features/sales-dashboard/domain/memberIdentity";

type ProfileRecord = { full_name: string | null; email: string | null; created_at: string | null };
type AccessRecord = { app_key: string; access_level: string };
type MembershipRecord = { id: string; role: string; user_id: string | null; is_active: boolean; monday_member_id: string | null; created_at: string | null; profiles: ProfileRecord | ProfileRecord[] | null; app_access: AccessRecord[] | null };
type MembershipQuery = { select: (columns: string) => MembershipQuery; eq: (column: string, value: string) => MembershipQuery; order: (column: string) => Promise<{ data: unknown; error: unknown }> };

export type TeamMember = {
  id: string;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  role: string;
  accessLevel: string | null;
  status: "Pending" | "Active" | "Inactive";
  joinedDate: string | null;
  lastActive: string | null;
  mondayMemberId: string | null;
  mondayMemberName: string | null;
  isOwner: boolean;
};

const mondayNames = new Map(mondayIdentities().map((person) => [person.id, person.displayName]));

export async function getTeamMembers(organisationId: string): Promise<TeamMember[]> {
  const admin = createAdminClient();
  const membershipQuery = admin.from("organisation_members") as unknown as MembershipQuery;
  const { data: rawMemberships, error } = await membershipQuery
    .select("id,role,user_id,is_active,monday_member_id,created_at,profiles!organisation_members_user_id_fkey(full_name,email,created_at),app_access(app_key,access_level)")
    .eq("organisation_id", organisationId)
    .order("created_at");
  if (error || !rawMemberships) return [];
  const memberships = rawMemberships as MembershipRecord[];

  const authUsers = await Promise.all(memberships.map(async (member) => {
    if (!member.user_id) return null;
    const { data } = await admin.auth.admin.getUserById(member.user_id);
    return data.user ?? null;
  }));

  return memberships.map((member, index) => {
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    const authUser = authUsers[index];
    const accessLevel = member.app_access?.find((item) => item.app_key === "pins_hub")?.access_level ?? null;
    const timestamps = [member.created_at, profile?.created_at, authUser?.invited_at, authUser?.created_at].filter((value): value is string => Boolean(value)).map((value) => new Date(value).getTime()).filter(Number.isFinite);
    const joinedDate = timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null;
    return {
      id: member.id,
      userId: member.user_id ?? null,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? authUser?.email ?? null,
      role: member.role,
      accessLevel,
      status: member.is_active === false ? "Inactive" : (authUser?.invited_at && !authUser?.last_sign_in_at ? "Pending" : "Active"),
      joinedDate,
      lastActive: authUser?.last_sign_in_at ?? null,
      mondayMemberId: member.monday_member_id ?? null,
      mondayMemberName: member.monday_member_id ? mondayNames.get(member.monday_member_id) ?? "Unknown Monday user" : null,
      isOwner: member.role === "owner",
    } satisfies TeamMember;
  });
}
