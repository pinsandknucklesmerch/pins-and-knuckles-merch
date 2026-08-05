"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateDisplayName } from "../lib/profileValidation";
import type { ProfileActionState } from "../types";

export async function updateOwnDisplayName(value: string): Promise<ProfileActionState> {
  const validation = validateDisplayName(value);
  if (!validation.ok) return { ok: false, fieldError: validation.error };
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, message: "Could not update display name." };
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: validation.value })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, message: "Could not update display name." };
  revalidatePath("/hub/profile");
  return { ok: true, message: "Display name updated." };
}
