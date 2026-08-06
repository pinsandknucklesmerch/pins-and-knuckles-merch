import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import type { Database } from "../src/types/database.types.ts";
import { planAuthDisplayNameBackfill, type AuthDisplayNameBackfillProfile } from "./lib/authDisplayNameBackfill.ts";

function parseArgs(args: string[]) {
  if (args.some((arg) => arg !== "--apply")) throw new Error("Only --apply is supported. Run without arguments for a dry run.");
  return { apply: args.includes("--apply") };
}

export async function backfillAuthDisplayNames(args = process.argv.slice(2)) {
  const { apply } = parseArgs(args);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required in the server environment.");

  const admin = createClient<Database>(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data, error } = await admin.from("profiles").select("id,full_name").not("full_name", "is", null);
  if (error) throw new Error("Could not read Pins Hub profiles.");

  const summary = { eligible: 0, wouldUpdate: 0, updated: 0, skipped: 0, failed: 0 };
  for (const profile of (data ?? []) as AuthDisplayNameBackfillProfile[]) {
    if (!profile.id || !profile.full_name?.trim()) {
      summary.skipped += 1;
      continue;
    }
    summary.eligible += 1;
    const { data: authResult, error: authError } = await admin.auth.admin.getUserById(profile.id);
    if (authError || !authResult.user) {
      summary.failed += 1;
      continue;
    }
    const decision = planAuthDisplayNameBackfill(profile, authResult.user.user_metadata);
    if (decision.action === "skip") {
      summary.skipped += 1;
      continue;
    }
    summary.wouldUpdate += 1;
    if (!apply) continue;
    const { error: updateError } = await admin.auth.admin.updateUserById(decision.userId, { user_metadata: decision.metadata });
    if (updateError) summary.failed += 1;
    else summary.updated += 1;
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...summary }));
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  backfillAuthDisplayNames().catch((error) => {
    console.error(error instanceof Error ? error.message : "Auth display-name backfill failed.");
    process.exitCode = 1;
  });
}
