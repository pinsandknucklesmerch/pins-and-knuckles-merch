"use server";

import { revalidatePath } from "next/cache";
import { canManagePinsHub, resolvePinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import { PRICING_CATEGORIES, type DataManagementActionState } from "./types";
import { canDeactivateGarment, deactivateGarmentRecord } from "./lib/deactivateGarment";
import { validateProductTypeInvoiceFields } from "./lib/productTypeValidation";

const PATHS = ["/hub/data", "/hub/data/garments", "/hub/data/product-types", "/hub/calculators", "/hub/calculators/eu/standard", "/hub/calculators/eu/us-clients", "/hub/calculators/uk/trade"];
const normalise = (value: string | null | undefined) => (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const nullable = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  return text || null;
};
const numberValue = (value: FormDataEntryValue | null, label: string) => {
  const text = nullable(value);
  if (text === null) return { value: null as number | null };
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0) return { error: `${label} must be a nonnegative number.` };
  return { value: number };
};

function state(ok: boolean, message: string, fieldErrors?: Record<string, string>): DataManagementActionState { return { ok, message, ...(fieldErrors && Object.keys(fieldErrors).length ? { fieldErrors } : {}) }; }
function revalidateDataManagement() { PATHS.forEach((path) => revalidatePath(path)); }
async function actionContext() {
  const supabase = await createClient();
  const access = await resolvePinsHubAccess(supabase);
  return { supabase, accessLevel: access.access?.access_level ?? null };
}

export async function saveProductType(_: DataManagementActionState, formData: FormData): Promise<DataManagementActionState> {
  const { supabase, accessLevel } = await actionContext();
  if (!canManagePinsHub(accessLevel) && accessLevel !== "write") return state(false, "You do not have permission to change Product Types.");
  const id = nullable(formData.get("id"));
  const name = nullable(formData.get("name"));
  const commodityCode = nullable(formData.get("commodity_code"));
  const invoiceFields = validateProductTypeInvoiceFields({
    commodityCode: commodityCode ?? "",
    countryOfOrigin: String(formData.get("country_of_origin") ?? "").trim(),
    invoiceDescription: String(formData.get("invoice_description") ?? "").trim(),
    defaultInvoiceCost: String(formData.get("default_invoice_cost") ?? ""),
    invoiceCurrencyCode: String(formData.get("invoice_currency_code") ?? ""),
  });
  const pricingCategory = nullable(formData.get("pricing_category"));
  const isActive = formData.get("is_active") === "true";
  if (!name || !pricingCategory || !PRICING_CATEGORIES.includes(pricingCategory as typeof PRICING_CATEGORIES[number])) return state(false, "Name and a valid pricing category are required.");
  if (!invoiceFields.values) return state(false, "Please correct the invoice fields.", invoiceFields.errors);
  const { data: activeTypes, error: loadError } = await supabase.from("product_types").select("id,name").eq("is_active", true);
  if (loadError) return state(false, "Product Type validation could not be completed.");
  if (isActive && activeTypes.some((row) => row.id !== id && normalise(row.name) === normalise(name))) return state(false, "An active Product Type already uses this name.");
  if (id && !isActive) {
    const { count, error } = await supabase.from("garments").select("id", { count: "exact", head: true }).eq("product_type_id", id).eq("is_active", true);
    if (error) return state(false, "Product Type dependencies could not be checked.");
    if ((count ?? 0) > 0) return state(false, `Cannot deactivate: ${count} active garment${count === 1 ? "" : "s"} still reference this Product Type.`);
  }
  const payload = { name, commodity_code: commodityCode ?? "", country_of_origin: invoiceFields.values.countryOfOrigin, invoice_description: invoiceFields.values.invoiceDescription, default_invoice_cost: invoiceFields.values.defaultInvoiceCost, invoice_currency_code: invoiceFields.values.invoiceCurrencyCode, pricing_category: pricingCategory, is_active: isActive };
  const result = id ? await supabase.from("product_types").update(payload).eq("id", id) : await supabase.from("product_types").insert(payload);
  if (result.error) return state(false, "Product Type could not be saved.");
  revalidateDataManagement();
  return state(true, id ? "Product Type saved." : "Product Type added.");
}

export async function deleteProductType(_: DataManagementActionState, formData: FormData): Promise<DataManagementActionState> {
  const { supabase, accessLevel } = await actionContext();
  if (!canManagePinsHub(accessLevel)) return state(false, "You do not have permission to delete Product Types.");
  const id = nullable(formData.get("id"));
  if (!id) return state(false, "Product Type is required.");
  const { count, error: dependencyError } = await supabase.from("garments").select("id", { count: "exact", head: true }).eq("product_type_id", id);
  if (dependencyError) return state(false, "Product Type dependencies could not be checked.");
  if ((count ?? 0) > 0) return state(false, `Cannot delete: ${count} garment${count === 1 ? "" : "s"} reference this Product Type.`);
  const { error } = await supabase.from("product_types").delete().eq("id", id);
  if (error) return state(false, "Product Type could not be deleted.");
  revalidateDataManagement();
  return state(true, "Product Type deleted.");
}

export async function saveGarment(_: DataManagementActionState, formData: FormData): Promise<DataManagementActionState> {
  const { supabase, accessLevel } = await actionContext();
  if (!canManagePinsHub(accessLevel) && accessLevel !== "write") return state(false, "You do not have permission to change garments.");
  const id = nullable(formData.get("id"));
  const code = nullable(formData.get("code"));
  const name = nullable(formData.get("name"));
  const productTypeId = nullable(formData.get("product_type_id"));
  const brandName = nullable(formData.get("brand_name"));
  const colour = nullable(formData.get("colour"));
  const eur = numberValue(formData.get("eur_base_price"), "EUR price");
  const gbp = numberValue(formData.get("gbp_price"), "GBP price");
  const extra = numberValue(formData.get("extra_size_cost"), "Extra size cost");
  const isActive = true;
  if (!code || !name || !productTypeId) return state(false, "Code, name, and Product Type are required.");
  if (eur.error || gbp.error || extra.error) return state(false, eur.error ?? gbp.error ?? extra.error ?? "Invalid price.");
  if (isActive && eur.value === null && gbp.value === null) return state(false, "An active garment needs a EUR or GBP price.");
  const { data: productType, error: typeError } = await supabase.from("product_types").select("id,pricing_category,is_active").eq("id", productTypeId).maybeSingle();
  if (typeError || !productType?.is_active) return state(false, "Select an active Product Type.");
  const { data: garments, error: garmentError } = await supabase.from("garments").select("id,code,brand_name,name,colour,is_active").eq("is_active", true);
  if (garmentError) return state(false, "Garment validation could not be completed.");
  const identity = [code, brandName, name, colour].map(normalise).join("|");
  if (isActive && garments.some((row) => row.id !== id && [row.code, row.brand_name, row.name, row.colour].map(normalise).join("|") === identity)) return state(false, "An active garment already uses this code, brand, name, and colour.");
  const payload = {
    code, alt_code: nullable(formData.get("alt_code")), brand_name: brandName, name, colour,
    product_type_id: productType.id, garment_type: productType.pricing_category,
    tags: nullable(formData.get("tags")), eur_base_price: eur.value, gbp_price: gbp.value,
    extra_size_cost: extra.value, is_active: isActive,
  };
  if (id) {
    const { data, error } = await supabase.from("garments").update(payload).eq("id", id).eq("is_active", true).select("id").maybeSingle();
    if (error || !data) return state(false, "Garment could not be saved.");
  } else {
    const { error } = await supabase.from("garments").insert({ ...payload, organisation_id: null });
    if (error) return state(false, "Garment could not be saved.");
  }
  revalidateDataManagement();
  return state(true, id ? "Garment saved." : "Garment added.");
}

export async function deactivateGarment(_: DataManagementActionState, formData: FormData): Promise<DataManagementActionState> {
  const { supabase, accessLevel } = await actionContext();
  if (!canDeactivateGarment(accessLevel)) return state(false, "Only administrators can deactivate garments.");
  const id = nullable(formData.get("id"));
  if (!id) return state(false, "Garment could not be found.");
  const result = await deactivateGarmentRecord(supabase, id);
  if (result === "not_found") return state(false, "Garment could not be found.");
  if (result === "already_inactive") return state(false, "Garment is already inactive.");
  if (result === "database_error") return state(false, "Garment could not be deactivated.");
  revalidateDataManagement();
  return state(true, "Garment deactivated.");
}
