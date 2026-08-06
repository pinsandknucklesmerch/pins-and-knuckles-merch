import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export const ACTIVITY_THROTTLE_MS = 15 * 60 * 1000;

type ActivityClient = Pick<SupabaseClient<Database>, "auth" | "from">;

export function shouldUpdateLastActive(lastActiveAt: string | null, now: Date) {
  if (!lastActiveAt) return true;
  const previousActivity = new Date(lastActiveAt).getTime();
  return Number.isFinite(previousActivity) && now.getTime() - previousActivity >= ACTIVITY_THROTTLE_MS;
}

export async function recordLastActive(client: ActivityClient, now = new Date()): Promise<void> {
  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("last_active_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || !shouldUpdateLastActive(profile.last_active_at, now)) return;

    const cutoff = new Date(now.getTime() - ACTIVITY_THROTTLE_MS).toISOString();
    await client
      .from("profiles")
      .update({ last_active_at: now.toISOString() })
      .eq("id", user.id)
      .or(`last_active_at.is.null,last_active_at.lt.${cutoff}`);
  } catch {
    // Activity tracking is observational and must never affect Hub rendering.
  }
}

export async function updateCurrentUserLastActive(): Promise<void> {
  await recordLastActive(await createClient());
}
