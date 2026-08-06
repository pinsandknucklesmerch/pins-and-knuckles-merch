"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createAdminClient } from "@/lib/supabase/admin";
import { mondayIdentities } from "@/features/sales-dashboard/domain/memberIdentity";
import { initialUserAccessActionState, type UserAccessActionState } from "../types";
import { validateUserUpdateInput } from "../lib/updateUser";

const mondayIds = new Set(mondayIdentities().map((person) => person.id));
const fail = (message: string): UserAccessActionState => ({ status: "error", message });
const ok = (message: string): UserAccessActionState => { revalidatePath("/hub/team"); return { status: "success", message }; };

async function adminContext() {
  const current = await getCurrentPinsHubAccess();
  if (!current.authenticated || current.access?.access_level !== "admin" || !current.membership?.organisation_id || !current.user) return null;
  return current;
}

export async function updateUser(previousState: UserAccessActionState = initialUserAccessActionState, formData: FormData): Promise<UserAccessActionState> {
  void previousState;
  const current = await adminContext();
  if (!current) return fail("You do not have permission to manage User Access Management.");
  const user = current.user;
  const membership = current.membership;
  if (!user) return fail("Authenticated user could not be found.");
  if (!membership) return fail("Organisation membership could not be found.");
  const input = validateUserUpdateInput(formData);
  if ("error" in input) return fail(input.error);
  const { membershipId, fullName, role, accessLevel, mondayMemberId, isActive } = input;
  if (mondayMemberId && !mondayIds.has(mondayMemberId)) return fail("Select a known Monday account or Not linked.");

  const admin = createAdminClient();
  const { data: targetMembership, error } = await admin.from("organisation_members").select("id,user_id,role,is_active").eq("id", membershipId).eq("organisation_id", membership.organisation_id).maybeSingle();
  const { data: targetAccess } = targetMembership ? await admin.from("app_access").select("app_key,access_level").eq("organisation_member_id", targetMembership.id) : { data: [] };
  const target = targetMembership ? { ...targetMembership, app_access: targetAccess ?? [] } : null;
  if (error || !target) return fail("User could not be found.");
  if (role === "owner" && target.role !== "owner") return fail("Owner role cannot be assigned.");
  if (target.role === "owner" && role !== "owner") return fail("Owner access is protected.");
  const existingAccessLevel = target.app_access.find((item) => item.app_key === "pins_hub")?.access_level ?? null;
  if (target.role === "owner" && (!isActive || accessLevel !== existingAccessLevel)) return fail("Owner access is protected.");
  if (target.user_id === user.id && (!isActive || role !== "admin" || accessLevel !== "admin")) return fail("You cannot remove your own administrator access or deactivate yourself.");
  const { data: duplicate } = mondayMemberId ? await admin.from("organisation_members").select("id").eq("organisation_id", membership.organisation_id).eq("monday_member_id", mondayMemberId).neq("id", membershipId).maybeSingle() : { data: null };
  if (duplicate) return fail("That Monday account is already linked to another user.");

  const { error: profileError } = target.user_id ? await admin.from("profiles").update({ full_name: fullName }).eq("id", target.user_id) : { error: null };
  if (profileError) return fail("User could not be updated.");
  const { error: membershipError } = await admin.from("organisation_members").update({ role, is_active: isActive, monday_member_id: mondayMemberId }).eq("id", membershipId);
  if (membershipError) return fail("User access could not be updated.");
  const { error: accessError } = await admin.from("app_access").update({ access_level: accessLevel }).eq("organisation_member_id", membershipId).eq("app_key", "pins_hub");
  if (accessError) return fail("Pins Hub access could not be updated.");
  return ok(isActive ? "User updated." : "User deactivated.");
}

export async function resendInvite(_previousState: UserAccessActionState = initialUserAccessActionState, formData: FormData): Promise<UserAccessActionState> {
  void _previousState;
  const current = await adminContext();
  if (!current) return fail("You do not have permission to resend invitations.");
  const user = current.user;
  const membership = current.membership;
  if (!user) return fail("Authenticated user could not be found.");
  if (!membership) return fail("Organisation membership could not be found.");
  const admin = createAdminClient();
  const { data: target } = await admin.from("organisation_members").select("user_id").eq("id", String(formData.get("membership_id") ?? "")).eq("organisation_id", membership.organisation_id).maybeSingle();
  if (!target?.user_id) return fail("Pending invitation could not be found.");
  const { data: invitedUser } = await admin.auth.admin.getUserById(target.user_id);
  if (!invitedUser.user?.email) return fail("Pending invitation has no email address.");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : null);
  if (!siteUrl) return fail("Invitation could not be sent.");
  const { error } = await admin.auth.admin.inviteUserByEmail(invitedUser.user.email, { redirectTo: `${siteUrl.replace(/\/$/, "")}/auth/invite` });
  return error ? fail("Invitation could not be resent.") : ok("Invitation resent.");
}
