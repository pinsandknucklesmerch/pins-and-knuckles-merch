import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";
import type { InvoiceCompany, ProductTypeInvoiceOption } from "../domain/directoryTypes";
import { mapInvoiceCompanyRow, mapProductTypeRow } from "./invoiceDirectoryMappers.ts";

export type InvoiceDirectorySupabaseClient = SupabaseClient<Database>;
type OrganisationRow = Pick<Tables<"organisations">, "id">;
type InvoiceCompanyRow = Tables<"invoice_companies">;
type ProductTypeRow = Tables<"product_types">;

function throwQueryError(
  error: { message: string } | null,
  context: string,
): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

export async function resolveCanonicalInvoiceOrganisation(
  supabase: InvoiceDirectorySupabaseClient,
): Promise<string> {
  const response = await supabase
    .from("organisations")
    .select("id")
    .eq("slug", "pins-knuckles")
    .returns<OrganisationRow[]>();

  throwQueryError(response.error, "Failed to resolve Pins & Knuckles organisation");
  const organisations = response.data ?? [];
  if (organisations.length !== 1) {
    throw new Error(
      `Expected exactly one organisation with slug pins-knuckles; found ${organisations.length}.`,
    );
  }
  return organisations[0].id;
}

export async function loadActiveInvoiceCompanies(
  supabase: InvoiceDirectorySupabaseClient,
  organisationId: string,
): Promise<InvoiceCompany[]> {
  const response = await supabase
    .from("invoice_companies")
    .select("id,organisation_id,label,company_name,contact_name,country,eori,vat_number,tax_id,telephone,email,address_line_1,address_line_2,city,region,postal_code,notes,is_active")
    .eq("organisation_id", organisationId)
    .eq("is_active", true)
    .order("label", { ascending: true })
    .returns<InvoiceCompanyRow[]>();

  throwQueryError(response.error, "Failed to load active invoice companies");
  return (response.data ?? []).map(mapInvoiceCompanyRow);
}

export async function loadActiveProductTypes(
  supabase: InvoiceDirectorySupabaseClient,
  organisationId: string,
): Promise<ProductTypeInvoiceOption[]> {
  void organisationId;
  const response = await supabase
    .from("product_types")
    .select("id,name,pricing_category,commodity_code,country_of_origin,invoice_description,default_invoice_cost,invoice_currency_code,is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .returns<ProductTypeRow[]>();

  throwQueryError(response.error, "Failed to load active Product Types");
  return (response.data ?? []).map(mapProductTypeRow);
}
