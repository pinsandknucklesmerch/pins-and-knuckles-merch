"use server";

import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { inviteFailureState, resolveSiteUrl, validateInviteInput } from "../lib/invite";
import { logProvisioningFailure, provisionPinsHubAccess } from "../lib/provisionAccess";
import { initialInviteActionState, type InviteActionState } from "../types";

async function provisionAccess(input: { userId: string; email: string; fullName: string; role: string; accessLevel: string; organisationId: string }) {
  const admin = createAdminClient() as unknown as Parameters<typeof provisionPinsHubAccess>[0];
  const result = await provisionPinsHubAccess(admin, input);
  if (!result.ok) logProvisioningFailure(result.step, result.error);
  return result.ok;
}

async function findExistingUserId(admin: ReturnType<typeof createAdminClient>, email: string) {
  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (profile) return profile.id;

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return null;
  return data.users.find((candidate) => candidate.email?.toLowerCase() === email)?.id ?? null;
}

export async function inviteMember(previousState: InviteActionState = initialInviteActionState, formData: FormData): Promise<InviteActionState> {
  void previousState;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "You do not have permission to invite team members." };
  const current = await getCurrentPinsHubAccess();
  if (!current.authenticated || current.access?.access_level !== "admin" || !current.membership?.organisation_id) {
    return { status: "error", message: "You do not have permission to invite team members." };
  }

  const input = validateInviteInput(formData);
  if (!input) return { status: "error", message: "Enter valid invitation details." };

  const siteUrl = resolveSiteUrl();
  if (!siteUrl) return { status: "error", message: "Invitation could not be sent." };

  const admin = createAdminClient();
  const existingUserId = await findExistingUserId(admin, input.email);
  if (existingUserId) {
    try {
      if (!await provisionAccess({ ...input, userId: existingUserId, organisationId: current.membership.organisation_id })) throw new Error();
      revalidatePath("/hub/team");
      return { status: "success", message: "Existing account granted access." };
    } catch {
      return { status: "error", message: "Invitation could not be sent." };
    }
  }
  const redirectTo = `${siteUrl}/auth/invite`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    redirectTo,
    data: { full_name: input.fullName },
  });

  if (error) {
    const failure = inviteFailureState(error);
    if (failure.status === "rate-limit") return failure;

    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      const existingUserIdAfterInvite = await findExistingUserId(admin, input.email);
      if (existingUserIdAfterInvite) {
        try {
          if (!await provisionAccess({ ...input, userId: existingUserIdAfterInvite, organisationId: current.membership.organisation_id })) throw new Error();
          revalidatePath("/hub/team");
          return { status: "success", message: "Existing account granted access." };
        } catch {
          return { status: "error", message: "Invitation could not be sent." };
        }
      }
      return { status: "error", message: "This account already exists. Access could not be updated." };
    }
    return failure;
  }

  if (!data.user) return { status: "error", message: "Invitation could not be sent." };
  try {
    if (!await provisionAccess({ ...input, userId: data.user.id, organisationId: current.membership.organisation_id })) {
      return { status: "error", message: "Invitation sent, but access provisioning failed." };
    }
    revalidatePath("/hub/team");
    return { status: "success", message: "Invitation sent." };
  } catch {
    return { status: "error", message: "Invitation sent, but access provisioning failed." };
  }
}
