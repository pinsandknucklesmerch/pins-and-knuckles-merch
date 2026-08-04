"use server";

import { revalidatePath } from "next/cache";
import { resolveCanonicalInvoiceOrganisation } from "@/features/commercial-invoices/data/invoiceDirectoryQueries";
import { resolvePinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import type { DataManagementActionState } from "../types";
import { validateInvoiceCompany, type InvoiceCompanyFormValues } from "../lib/invoiceDirectoryValidation";

const PATHS = ["/hub/data", "/hub/data/invoice-companies", "/hub/data/invoice-products", "/hub/commercial-invoices"];

function result(ok: boolean, message: string, fieldErrors?: Record<string, string>): DataManagementActionState {
  return { ok, message, ...(fieldErrors && Object.keys(fieldErrors).length ? { fieldErrors } : {}) };
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function id(formData: FormData) {
  const value = text(formData, "id").trim();
  return value || null;
}

async function context() {
  const supabase = await createClient();
  const access = await resolvePinsHubAccess(supabase);
  const organisationId = await resolveCanonicalInvoiceOrganisation(supabase);
  const accessLevel = access.membership?.organisation_id === organisationId ? access.access?.access_level ?? null : null;
  return { supabase, accessLevel, organisationId };
}

function canWrite(accessLevel: string | null) { return accessLevel === "write" || accessLevel === "admin"; }
function canAdmin(accessLevel: string | null) { return accessLevel === "admin"; }

function companyValues(formData: FormData): InvoiceCompanyFormValues {
  return {
    label: text(formData, "label"), companyName: text(formData, "companyName"), contactName: text(formData, "contactName"), country: text(formData, "country"), eori: text(formData, "eori"), vatNumber: text(formData, "vatNumber"), taxId: text(formData, "taxId"), telephone: text(formData, "telephone"), email: text(formData, "email"), addressLine1: text(formData, "addressLine1"), addressLine2: text(formData, "addressLine2"), city: text(formData, "city"), region: text(formData, "region"), postalCode: text(formData, "postalCode"), notes: text(formData, "notes"),
  };
}

function duplicateResult(error: { code?: string; message: string }) {
  if (error.code !== "23505") return null;
  if (error.message.includes("active_label")) return result(false, "An active company already uses this label.", { label: "An active company already uses this label." });
  return result(false, "An active company already uses this label.", { label: "An active company already uses this label." });
}

function revalidateDirectories() { PATHS.forEach((path) => revalidatePath(path)); }

export async function createInvoiceCompanyAction(_: DataManagementActionState, formData: FormData): Promise<DataManagementActionState> {
  const { supabase, accessLevel, organisationId } = await context();
  if (!canWrite(accessLevel)) return result(false, "You do not have permission to add Invoice Companies.");
  const values = companyValues(formData);
  const validation = validateInvoiceCompany(values);
  if (!validation.values) return result(false, "Please correct the highlighted fields.", validation.errors);
  const response = await supabase.from("invoice_companies").insert({ organisation_id: organisationId, label: values.label, company_name: values.companyName, contact_name: values.contactName, country: values.country, eori: values.eori, vat_number: values.vatNumber, tax_id: values.taxId, telephone: values.telephone, email: values.email, address_line_1: values.addressLine1, address_line_2: values.addressLine2, city: values.city, region: values.region, postal_code: values.postalCode, notes: values.notes, is_active: true });
  if (response.error) return duplicateResult(response.error) ?? result(false, `Invoice Company could not be added: ${response.error.message}`);
  revalidateDirectories();
  return result(true, "Invoice Company added.");
}

export async function updateInvoiceCompanyAction(_: DataManagementActionState, formData: FormData): Promise<DataManagementActionState> {
  const { supabase, accessLevel, organisationId } = await context();
  if (!canWrite(accessLevel)) return result(false, "You do not have permission to edit Invoice Companies.");
  const recordId = id(formData);
  if (!recordId) return result(false, "Invoice Company could not be found.");
  const values = companyValues(formData);
  const validation = validateInvoiceCompany(values);
  if (!validation.values) return result(false, "Please correct the highlighted fields.", validation.errors);
  const response = await supabase.from("invoice_companies").update({ label: values.label, company_name: values.companyName, contact_name: values.contactName, country: values.country, eori: values.eori, vat_number: values.vatNumber, tax_id: values.taxId, telephone: values.telephone, email: values.email, address_line_1: values.addressLine1, address_line_2: values.addressLine2, city: values.city, region: values.region, postal_code: values.postalCode, notes: values.notes }).eq("id", recordId).eq("organisation_id", organisationId).select("id").maybeSingle();
  if (response.error) return duplicateResult(response.error) ?? result(false, `Invoice Company could not be saved: ${response.error.message}`);
  if (!response.data) return result(false, "Invoice Company could not be found.");
  revalidateDirectories();
  return result(true, "Invoice Company saved.");
}

export async function setInvoiceCompanyActiveAction(_: DataManagementActionState, formData: FormData): Promise<DataManagementActionState> {
  const { supabase, accessLevel, organisationId } = await context();
  if (!canAdmin(accessLevel)) return result(false, "Only administrators may change Invoice Company status.");
  const recordId = id(formData);
  if (!recordId) return result(false, "Invoice Company could not be found.");
  const isActive = text(formData, "isActive") === "true";
  const response = await supabase.from("invoice_companies").update({ is_active: isActive }).eq("id", recordId).eq("organisation_id", organisationId).select("id").maybeSingle();
  if (response.error) return duplicateResult(response.error) ?? result(false, `Invoice Company status could not be changed: ${response.error.message}`);
  if (!response.data) return result(false, "Invoice Company could not be found.");
  revalidateDirectories();
  return result(true, isActive ? "Invoice Company reactivated." : "Invoice Company deactivated.");
}

export async function deleteInvoiceCompanyAction(_: DataManagementActionState, formData: FormData): Promise<DataManagementActionState> {
  const { supabase, accessLevel, organisationId } = await context();
  if (!canAdmin(accessLevel)) return result(false, "Only administrators may delete Invoice Companies.");
  const recordId = id(formData);
  if (!recordId) return result(false, "Invoice Company could not be found.");
  const response = await supabase.from("invoice_companies").delete().eq("id", recordId).eq("organisation_id", organisationId).select("id").maybeSingle();
  if (response.error) return result(false, `Invoice Company could not be deleted: ${response.error.message}`);
  if (!response.data) return result(false, "Invoice Company could not be found.");
  revalidateDirectories();
  return result(true, "Invoice Company deleted.");
}
