import "server-only";
import { createClient } from "@/lib/supabase/server";
import { trimFullName } from "@/features/team/lib/authDisplayName";
import { userDisplayName } from "@/features/team/lib/displayName";
import type { WeeklyChecklist } from "../domain/checklist";

type Client = Awaited<ReturnType<typeof createClient>>;

export async function resolveChecklistDisplayNames(supabase: Client, organisationId: string, checklist: WeeklyChecklist): Promise<WeeklyChecklist> {
  // Use the captured weekly identities, not current assignments or ordering.
  // Name enrichment is optional and session/RLS scoped; saved names remain a fallback.
  const { data: staff, error: staffError } = await supabase.from("sales_checklist_week_staff").select("id,user_id").eq("organisation_id", organisationId).eq("week_id", checklist.weekId);
  const users = new Map<string, string>();
  if (!staffError) for (const person of staff ?? []) if (person.user_id) users.set(person.id, person.user_id);
  const ids = [...new Set(users.values())];
  const profiles = new Map<string, { full_name: string | null; email: string | null }>();
  if (ids.length) {
    const { data, error } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
    if (!error) for (const profile of data ?? []) profiles.set(profile.id, profile);
  }
  return { ...checklist, staff: checklist.staff.map((person) => {
    const profile = profiles.get(users.get(person.id) ?? "");
    return { ...person, name: userDisplayName(trimFullName(profile?.full_name) || person.name, profile?.email) };
  }) };
}
