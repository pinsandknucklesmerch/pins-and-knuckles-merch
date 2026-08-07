import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { PinsHubAccessResult } from "./pinsHubAccess";

export const ACTIVITY_THROTTLE_MS = 15 * 60 * 1000;

type ActivityClient = Pick<SupabaseClient<Database>, "auth" | "from">;
type TrustedActivityContext = { userId: string; lastActiveAt: string | null };

export function shouldUpdateLastActive(lastActiveAt: string | null, now: Date) {
  if (!lastActiveAt) return true;
  const previousActivity = new Date(lastActiveAt).getTime();
  return Number.isFinite(previousActivity) && now.getTime() - previousActivity >= ACTIVITY_THROTTLE_MS;
}

export async function recordLastActive(client: ActivityClient, now = new Date(), trustedContext?: TrustedActivityContext): Promise<void> {
  try {
    let userId = trustedContext?.userId;
    let lastActiveAt = trustedContext?.lastActiveAt;
    if (!userId) {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;
      userId = user.id;
      lastActiveAt = undefined;
      const { data: profile, error: profileError } = await client.from("profiles").select("last_active_at").eq("id", user.id).maybeSingle();
      if (profileError || !profile) return;
      lastActiveAt = profile.last_active_at;
    }
    if (!shouldUpdateLastActive(lastActiveAt ?? null, now)) return;

    const cutoff = new Date(now.getTime() - ACTIVITY_THROTTLE_MS).toISOString();
    await client
      .from("profiles")
      .update({ last_active_at: now.toISOString() })
      .eq("id", userId ?? "")
      .or(`last_active_at.is.null,last_active_at.lt.${cutoff}`);
  } catch {
    // Activity tracking is observational and must never affect Hub rendering.
  }
}

export async function updateCurrentUserLastActive(access?: PinsHubAccessResult): Promise<void> {
  await recordLastActive(await createClient(), new Date(), access?.user ? { userId: access.user.id, lastActiveAt: access.profileLastActiveAt ?? null } : undefined);
}
