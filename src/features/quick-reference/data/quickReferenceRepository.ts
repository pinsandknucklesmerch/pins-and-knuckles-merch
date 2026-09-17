import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentPinsHubAccess, type PinsHubAccessResult } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import type { Database, Tables } from "@/types/database.types";
import type { QuickReferenceRecord } from "../types";

type QuickReferenceClient = SupabaseClient<Database>;
type QuickReferenceRow = Tables<"quick_reference_records">;

function mapQuickReferenceRow(row: QuickReferenceRow): QuickReferenceRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    body: row.body,
    warning: row.warning,
    displayOrder: row.display_order,
    isActive: row.is_active,
  };
}

export async function getActiveQuickReferenceRecords(
  supabase: QuickReferenceClient,
  organisationId: string,
): Promise<QuickReferenceRecord[]> {
  const { data, error } = await supabase
    .from("quick_reference_records")
    .select("id,title,category,body,warning,display_order,is_active")
    .eq("organisation_id", organisationId)
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true })
    .order("title", { ascending: true })
    .returns<QuickReferenceRow[]>();

  if (error) throw new Error("Quick Reference could not be loaded.");
  return (data ?? []).map(mapQuickReferenceRow);
}

export async function getQuickReferenceManagementRecords(
  supabase: QuickReferenceClient,
  organisationId: string,
): Promise<QuickReferenceRecord[]> {
  const { data, error } = await supabase
    .from("quick_reference_records")
    .select("id,title,category,body,warning,display_order,is_active")
    .eq("organisation_id", organisationId)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true })
    .order("title", { ascending: true })
    .returns<QuickReferenceRow[]>();

  if (error) throw new Error("Quick Reference could not be loaded.");
  return (data ?? []).map(mapQuickReferenceRow);
}

export async function loadQuickReferenceData(): Promise<{
  access: PinsHubAccessResult;
  records: QuickReferenceRecord[];
}> {
  const [supabase, access] = await Promise.all([createClient(), getCurrentPinsHubAccess()]);
  const organisationId = access.membership?.organisation_id;

  return { access, records: organisationId ? await getActiveQuickReferenceRecords(supabase, organisationId) : [] };
}

export async function loadQuickReferenceManagementData(): Promise<{
  access: PinsHubAccessResult;
  records: QuickReferenceRecord[];
}> {
  const [supabase, access] = await Promise.all([createClient(), getCurrentPinsHubAccess()]);
  const organisationId = access.membership?.organisation_id;

  return { access, records: organisationId ? await getQuickReferenceManagementRecords(supabase, organisationId) : [] };
}
