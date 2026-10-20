import "server-only";
import { isEpccCronRequestAuthorised } from "@/features/sales-dashboard/server/epccCronAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!isEpccCronRequestAuthorised(request)) return Response.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("reset_all_sales_checklists");
    if (error || typeof data !== "number" || data < 0) return Response.json({ error: "Checklist reset failed for one or more organisations." }, { status: 500 });
    return Response.json({ ok: true, organisations: data });
  } catch { return Response.json({ error: "Checklist reset failed." }, { status: 500 }); }
}
