import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePinsHubAccess, type PinsHubAccessResult } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import { resolveCanonicalInvoiceOrganisation } from "@/features/commercial-invoices/data/invoiceDirectoryQueries";
import { mapInvoiceCompanyRow } from "@/features/commercial-invoices/data/invoiceDirectoryMappers";
import type { Database, Tables } from "@/types/database.types";
import type { InvoiceCompanyRecord } from "../types";

type Client = SupabaseClient<Database>;

export async function getInvoiceCompanies(supabase: Client, organisationId: string): Promise<InvoiceCompanyRecord[]> {
  const { data, error } = await supabase.from("invoice_companies").select("*").eq("organisation_id", organisationId).order("label", { ascending: true }).returns<Tables<"invoice_companies">[]>();
  if (error) throw new Error(`Invoice Companies could not be loaded: ${error.message}`);
  return (data ?? []).map(mapInvoiceCompanyRow);
}

export async function loadInvoiceCompaniesData(): Promise<{ access: PinsHubAccessResult; companies: InvoiceCompanyRecord[] }> {
  const supabase = await createClient();
  const [access, organisationId] = await Promise.all([resolvePinsHubAccess(supabase), resolveCanonicalInvoiceOrganisation(supabase)]);
  return { access, companies: await getInvoiceCompanies(supabase, organisationId) };
}
