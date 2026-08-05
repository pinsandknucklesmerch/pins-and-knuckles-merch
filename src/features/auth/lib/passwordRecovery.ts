import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function sendPasswordRecoveryEmail(supabase: SupabaseClient<Database>, email: string, origin: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/auth/update-password`,
  });
}
