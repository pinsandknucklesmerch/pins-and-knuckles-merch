"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPinsHubAccess, hasAdminAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import { isChecklistStatus, isUuid } from "./domain/checklist";
import { parseManagementInput, type ChecklistManagementInput, type ChecklistManagementSaveResult } from "./domain/management";
import { loadSalesChecklist } from "./data/checklistRepository";

export async function saveChecklistStatus(entryId: string, status: string): Promise<{ ok: boolean; message: string }> {
  if (!isUuid(entryId) || !isChecklistStatus(status)) return { ok: false, message: "Select a valid checklist status." };
  const access = await getCurrentPinsHubAccess();
  if (!access.access || !access.membership?.is_active) return { ok: false, message: "You do not have checklist access." };
  const supabase = await createClient();
  // Invoker RPC applies RLS: current week, organisation, active membership, own column/admin.
  const { data, error } = await supabase.rpc("update_sales_checklist_status", {
    p_organisation_id: access.membership.organisation_id,
    p_entry_id: entryId,
    p_status: status,
  });
  if (error || !data) return { ok: false, message: "Status could not be saved. Check your access and that this is the current week, then try again." };
  revalidatePath("/hub/sales-checklist");
  revalidatePath("/hub/sales-dashboard");
  return { ok: true, message: "Status saved." };
}

export async function readChecklistForTv() {
  const { checklist, errorMessage } = await loadSalesChecklist();
  return { checklist, errorMessage: errorMessage ?? (checklist ? null : "Checklist access unavailable.") };
}

export async function saveChecklistManagement(payload: unknown): Promise<ChecklistManagementSaveResult> {
  const access = await getCurrentPinsHubAccess();
  if (!access.access || !access.membership?.is_active || !hasAdminAccess(access)) return { ok: false, message: "Only Hub administrators may manage the checklist." };
  let input: ChecklistManagementInput;
  try { input = parseManagementInput(payload); }
  catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Invalid checklist configuration." }; }
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_sales_checklist_management", {
    p_organisation_id: access.membership.organisation_id,
    p_expected_revision: input.revision,
    p_expected_effective_from: input.effectiveFrom,
    p_duties: input.duties,
    p_staff: input.staff,
  });
  if (error?.code === "P0001" && error.hint === "effective_week_changed") return { ok: false, message: "The effective week changed. Refresh configuration before saving.", refreshRequired: true };
  if (error?.code === "40001") return { ok: false, message: "Another administrator changed the configuration. Reload before saving.", refreshRequired: true };
  if (error) return { ok: false, message: "Checklist configuration could not be saved. Check that assigned users still have active Hub access." };
  revalidatePath("/hub/sales-checklist");
  revalidatePath("/hub/sales-checklist/manage");
  revalidatePath("/hub/sales-dashboard");
  return { ok: true, message: "Checklist configuration saved." };
}
