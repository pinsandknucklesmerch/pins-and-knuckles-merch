import "server-only";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import { parseWeeklyChecklist, type WeeklyChecklist } from "../domain/checklist";

import { resolveChecklistDisplayNames } from "./displayNames";

export async function loadSalesChecklist() {
  const access = await getCurrentPinsHubAccess();
  let checklist: WeeklyChecklist | null = null;
  let errorMessage: string | null = null;
  if (!access.access || !access.membership?.is_active) return { access, checklist, errorMessage };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("read_sales_checklist", {
    p_organisation_id: access.membership.organisation_id,
  });
  if (error) {
    errorMessage = error.code === "P0001"
      ? "Checklist setup is incomplete. Ask a Hub administrator to select organisation users in Checklist Management."
      : "The checklist could not be loaded. Please try again.";
  } else {
    try { checklist = await resolveChecklistDisplayNames(supabase, access.membership.organisation_id, parseWeeklyChecklist(data)); }
    catch { errorMessage = "The checklist could not be loaded. Please try again."; }
  }
  return { access, checklist, errorMessage };
}
