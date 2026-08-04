import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePinsHubAccess, type PinsHubAccessResult } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { GarmentRecord, PricingCategory, ProductTypeRecord } from "../types";
import { fetchAllGarmentPages } from "../lib/garments";
import { resolveCanonicalInvoiceOrganisation } from "@/features/commercial-invoices/data/invoiceDirectoryQueries";

type CatalogClient = SupabaseClient<Database>;
export const GARMENT_PAGE_SIZE = 50;

function pricingCategory(value: string): PricingCategory {
  return value as PricingCategory;
}

export async function getProductTypes(supabase: CatalogClient): Promise<ProductTypeRecord[]> {
  const { data, error } = await supabase.from("product_types").select("id,name,commodity_code,country_of_origin,invoice_description,default_invoice_cost,invoice_currency_code,pricing_category,is_active").order("name");
  if (error) throw new Error("Product Types could not be loaded.");
  return data.map((row) => ({ id: row.id, name: row.name, commodityCode: row.commodity_code, countryOfOrigin: row.country_of_origin, invoiceDescription: row.invoice_description, defaultInvoiceCost: row.default_invoice_cost, invoiceCurrencyCode: invoiceCurrencyCode(row.invoice_currency_code), pricingCategory: pricingCategory(row.pricing_category), isActive: row.is_active }));
}

function invoiceCurrencyCode(value: string | null): "GBP" | "EUR" | null {
  if (value === null || value === "") return null;
  if (value === "GBP" || value === "EUR") return value;
  throw new Error(`Unsupported Product Type invoice currency: ${value}`);
}

export async function getGarments(supabase: CatalogClient): Promise<GarmentRecord[]> {
  return fetchAllGarmentPages(async (from, to) => {
    const { data, error } = await supabase.from("garments").select("id,code,alt_code,brand_name,name,colour,tags,eur_base_price,gbp_price,extra_size_cost,is_active,product_type_id,product_types(name)").eq("is_active", true).order("code", { ascending: true }).order("id", { ascending: true }).range(from, to);
    if (error) throw new Error("Garments could not be loaded.");
    return data.map((row) => {
      const productType = Array.isArray(row.product_types) ? row.product_types[0] : row.product_types;
      return {
        id: row.id, code: row.code, altCode: row.alt_code, brand: row.brand_name, name: row.name,
        colour: row.colour, tags: row.tags, eurBasePrice: row.eur_base_price, gbpPrice: row.gbp_price,
        extraSizeCost: row.extra_size_cost, isActive: row.is_active, productTypeId: row.product_type_id,
        productTypeName: productType?.name ?? null,
      };
    });
  }, GARMENT_PAGE_SIZE);
}

export async function loadDataManagementSummary(): Promise<{
  access: PinsHubAccessResult;
  garmentCount: number;
  productTypeCount: number;
  invoiceCompanyCount: number;
}> {
  const supabase = await createClient();
  const organisationId = await resolveCanonicalInvoiceOrganisation(supabase);
  const [access, garments, productTypes, invoiceCompanies] = await Promise.all([
    resolvePinsHubAccess(supabase),
    supabase.from("garments").select("id", { count: "exact", head: true }),
    supabase.from("product_types").select("id", { count: "exact", head: true }),
    supabase.from("invoice_companies").select("id", { count: "exact", head: true }).eq("organisation_id", organisationId).eq("is_active", true),
  ]);

  if (garments.error || productTypes.error || invoiceCompanies.error) {
    throw new Error("Data Management summary could not be loaded.");
  }

  return {
    access,
    garmentCount: garments.count ?? 0,
    productTypeCount: productTypes.count ?? 0,
    invoiceCompanyCount: invoiceCompanies.count ?? 0,
  };
}

export async function loadGarmentsData(): Promise<{
  access: PinsHubAccessResult;
  garments: GarmentRecord[];
  productTypes: ProductTypeRecord[];
}> {
  const supabase = await createClient();
  const [access, garments, productTypes] = await Promise.all([
    resolvePinsHubAccess(supabase),
    getGarments(supabase),
    getProductTypes(supabase),
  ]);
  return { access, garments, productTypes };
}

export async function loadProductTypesData(): Promise<{
  access: PinsHubAccessResult;
  productTypes: ProductTypeRecord[];
}> {
  const supabase = await createClient();
  const [access, productTypes] = await Promise.all([
    resolvePinsHubAccess(supabase),
    getProductTypes(supabase),
  ]);
  return { access, productTypes };
}
