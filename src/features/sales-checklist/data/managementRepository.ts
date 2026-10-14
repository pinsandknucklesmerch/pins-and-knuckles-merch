import "server-only";
import { getCurrentPinsHubAccess, hasAdminAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import { parseManagementData, type ChecklistManagement } from "../domain/management";

import { userDisplayName } from "@/features/team/lib/displayName";

export async function loadChecklistManagement() {
  const access = await getCurrentPinsHubAccess();
  let management: ChecklistManagement | null = null;
  let errorMessage: string | null = null;
  if (!access.access || !access.membership?.is_active || !hasAdminAccess(access)) return { access, management, errorMessage };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("read_sales_checklist_management", { p_organisation_id: access.membership.organisation_id });
  if (error) errorMessage = "Checklist management could not be loaded. Please try again.";
  else {
    try { const parsed = parseManagementData(data);
      management = { ...parsed, users: parsed.users.map((user) => ({ ...user, name: userDisplayName(user.name, user.email) })), staff: parsed.staff.map((person) => ({ ...person, name: userDisplayName(person.name) })) }; }
    catch { errorMessage = "Checklist management could not be loaded. Please try again."; }
  }
  return { access, management, errorMessage };
}
