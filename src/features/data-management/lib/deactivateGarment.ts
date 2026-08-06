import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { canManagePinsHub } from "@/lib/access/pinsHubAccess";

type DeactivationResult = "deactivated" | "not_found" | "already_inactive" | "database_error";

export function canDeactivateGarment(accessLevel: string | null) {
  return canManagePinsHub(accessLevel);
}

export async function deactivateGarmentRecord(supabase: SupabaseClient<Database>, id: string): Promise<DeactivationResult> {
  const { data, error: readError } = await supabase.from("garments").select("id,is_active").eq("id", id).maybeSingle();
  if (readError) return "database_error";
  if (!data) return "not_found";
  if (!data.is_active) return "already_inactive";
  const { error: updateError } = await supabase.from("garments").update({ is_active: false }).eq("id", id);
  return updateError ? "database_error" : "deactivated";
}
