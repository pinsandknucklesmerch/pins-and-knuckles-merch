"use server";
import { revalidatePath } from "next/cache";
import { getCurrentPinsHubAccess, hasDeveloperAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import { diagnosticStatuses, type DiagnosticStatus } from "./types";
export async function updateDiagnosticIssue(input: { id: string; status: string; notes: string }) {
  if (!hasDeveloperAccess(await getCurrentPinsHubAccess()) || !diagnosticStatuses.includes(input.status as DiagnosticStatus) || input.notes.length > 4000) return { ok: false, message: "Invalid diagnostic update." };
  const { error } = await (await createClient()).rpc("update_developer_diagnostic_issue", { p_id: input.id, p_status: input.status, p_developer_notes: input.notes.trim() || null });
  if (error) return { ok: false, message: "Diagnostic issue could not be updated." }; revalidatePath("/hub/developer/diagnostics"); return { ok: true, message: "Diagnostic issue updated." };
}
