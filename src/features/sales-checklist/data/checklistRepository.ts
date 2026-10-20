import "server-only";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import { parseSalesChecklist, type SalesChecklist } from "../domain/checklist";

function checklistLoadFailureCategory(code: string | undefined) {
  if (code === "42501") return "permission_denied";
  if (code === "42883" || code === "PGRST202") return "rpc_unavailable";
  return "database_error";
}

function checklistPayloadShape(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { payloadType: Array.isArray(value) ? "array" : typeof value };
  }

  const payload = value as Record<string, unknown>;
  return {
    payloadType: "object",
    canClearType: typeof payload.canClear,
    dutiesCount: Array.isArray(payload.duties) ? payload.duties.length : null,
    staffCount: Array.isArray(payload.staff) ? payload.staff.length : null,
    entriesCount: Array.isArray(payload.entries) ? payload.entries.length : null,
  };
}

export async function loadSalesChecklist() {
  const access = await getCurrentPinsHubAccess();
  let checklist: SalesChecklist | null = null;
  let errorMessage: string | null = null;
  if (!access.access || !access.membership?.is_active) return { access, checklist, errorMessage };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("read_sales_checklist", {
    p_organisation_id: access.membership.organisation_id,
  });
  if (error) {
    console.error("sales-checklist-load-rpc-failed", {
      operation: "read_sales_checklist",
      code: error.code || "unknown",
      category: checklistLoadFailureCategory(error.code),
      hasDetails: Boolean(error.details),
      hasHint: Boolean(error.hint),
    });
    errorMessage = error.code === "P0001"
      ? "Checklist setup is incomplete. Ask a Hub administrator to select organisation users in Checklist Management."
      : "The checklist could not be loaded. Please try again.";
  } else {
    try { checklist = parseSalesChecklist(data); }
    catch (parseError) {
      console.error("sales-checklist-load-invalid-payload", {
        operation: "read_sales_checklist",
        reason: parseError instanceof Error ? parseError.message : "unknown_parse_error",
        ...checklistPayloadShape(data),
      });
      errorMessage = "The checklist could not be loaded. Please try again.";
    }
  }
  return { access, checklist, errorMessage };
}
