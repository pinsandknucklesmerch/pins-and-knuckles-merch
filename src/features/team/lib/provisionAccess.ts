type SupabaseError = unknown;

type MembershipLookup = {
  eq: (column: string, value: string) => MembershipLookup;
  maybeSingle: () => Promise<{ data: { id: string } | null; error: SupabaseError }>;
};

type AdminTable = {
  upsert: (values: Record<string, unknown>, options?: { onConflict: string }) => Promise<{ error: SupabaseError }>;
  select: (columns: string) => MembershipLookup;
};
type AdminDatabaseClient = {
  from: (table: "profiles" | "organisation_members" | "app_access") => AdminTable;
};

export type ProvisionAccessInput = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  accessLevel: string;
  organisationId: string;
};

export function logProvisioningFailure(step: "profiles" | "organisation_members" | "app_access", error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code ?? "unknown") : "unknown";
  console.error("team-invite-provisioning-failed", { operation: "team-invite-provision", step, code });
}

export async function provisionPinsHubAccess(admin: AdminDatabaseClient, input: ProvisionAccessInput) {
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: input.userId, email: input.email, full_name: input.fullName }, { onConflict: "id" });
  if (profileError) return { ok: false as const, step: "profiles" as const, error: profileError as SupabaseError };

  const { error: membershipError } = await admin
    .from("organisation_members")
    .upsert(
      { organisation_id: input.organisationId, user_id: input.userId, role: input.role },
      { onConflict: "organisation_id,user_id" },
    );
  if (membershipError) return { ok: false as const, step: "organisation_members" as const, error: membershipError as SupabaseError };

  const { data: membership, error: membershipLookupError } = await admin
    .from("organisation_members")
    .select("id")
    .eq("organisation_id", input.organisationId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (membershipLookupError || !membership) {
    return { ok: false as const, step: "organisation_members" as const, error: membershipLookupError as SupabaseError };
  }

  const { error: accessError } = await admin
    .from("app_access")
    .upsert(
      { organisation_member_id: membership.id, app_key: "pins_hub", access_level: input.accessLevel },
      { onConflict: "organisation_member_id,app_key" },
    );
  if (accessError) return { ok: false as const, step: "app_access" as const, error: accessError as SupabaseError };

  return { ok: true as const };
}
