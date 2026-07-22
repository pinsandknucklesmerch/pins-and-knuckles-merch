import { createAdminClient } from "@/lib/supabase/admin";

export type TeamMember = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string;
  accessLevel: string | null;
  status: "Invited" | "Active" | "Access only";
};

export async function getTeamMembers(organisationId: string): Promise<TeamMember[]> {
  const admin = createAdminClient();
  const { data: memberships, error } = await admin
    .from("organisation_members")
    .select("id,role,user_id,profiles!organisation_members_user_id_fkey(full_name,email),app_access(app_key,access_level)")
    .eq("organisation_id", organisationId)
    .order("created_at");
  if (error || !memberships) return [];

  const authUsers = await Promise.all(memberships.map(async (member) => {
    if (!member.user_id) return null;
    const { data } = await admin.auth.admin.getUserById(member.user_id);
    return data.user ?? null;
  }));

  return memberships.map((member, index) => {
    const profile = member.profiles as unknown as { full_name: string | null; email: string | null } | null;
    const access = member.app_access.find((item) => item.app_key === "pins_hub")?.access_level ?? null;
    return {
      id: member.id,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      role: member.role,
      accessLevel: access,
      status: !access ? "Access only" : (authUsers[index]?.invited_at && !authUsers[index]?.last_sign_in_at ? "Invited" : "Active"),
    };
  });
}
