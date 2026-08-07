import { createClient } from "@/lib/supabase/server";
import {
  loadActiveInvoiceCompanies,
  loadActiveProductTypes,
  resolveCanonicalInvoiceOrganisation,
  type InvoiceDirectorySupabaseClient,
} from "./invoiceDirectoryQueries";

export {
  loadActiveInvoiceCompanies,
  loadActiveProductTypes,
  resolveCanonicalInvoiceOrganisation,
} from "./invoiceDirectoryQueries";

export async function getActiveInvoiceCompanies() {
  const supabase = await createClient();
  const organisationId = await resolveCanonicalInvoiceOrganisation(supabase);
  return loadActiveInvoiceCompanies(supabase, organisationId);
}

export async function getActiveProductTypes() {
  const supabase = await createClient();
  const organisationId = await resolveCanonicalInvoiceOrganisation(supabase);
  return loadActiveProductTypes(supabase, organisationId);
}

export async function getInvoiceDirectory() {
  const supabase = await createClient();
  const organisationId = await resolveCanonicalInvoiceOrganisation(supabase);
  return Promise.all([
    loadActiveInvoiceCompanies(supabase, organisationId),
    loadActiveProductTypes(supabase, organisationId),
  ]);
}

export type { InvoiceDirectorySupabaseClient };
