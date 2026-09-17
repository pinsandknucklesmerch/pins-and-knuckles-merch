"use server";

import { revalidatePath } from "next/cache";
import { effectivePinsHubAccessLevel, getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { hasPinsHubAccessLevel } from "@/lib/access/pinsHubRoles";
import { createClient } from "@/lib/supabase/server";
import { quickReferenceId, validateQuickReference } from "./lib/quickReferenceValidation";
import type { QuickReferenceActionState } from "./types";

const PATHS = ["/hub/reference", "/hub/reference/manage"];

function result(ok: boolean, message: string, fieldErrors?: Record<string, string>): QuickReferenceActionState {
  return { ok, message, ...(fieldErrors && Object.keys(fieldErrors).length ? { fieldErrors } : {}) };
}

function revalidateQuickReference() {
  PATHS.forEach((path) => revalidatePath(path));
}

async function actionContext() {
  const [supabase, access] = await Promise.all([createClient(), getCurrentPinsHubAccess()]);
  return {
    supabase,
    organisationId: access.membership?.organisation_id ?? null,
    accessLevel: effectivePinsHubAccessLevel(access),
  };
}

export async function createQuickReferenceAction(_: QuickReferenceActionState, formData: FormData): Promise<QuickReferenceActionState> {
  const { supabase, organisationId, accessLevel } = await actionContext();
  if (!organisationId || !hasPinsHubAccessLevel(accessLevel, "write")) return result(false, "You do not have permission to add Quick Reference records.");
  const validation = validateQuickReference(formData);
  if (!validation.values) return result(false, "Please correct the highlighted fields.", validation.errors);

  const { error } = await supabase.from("quick_reference_records").insert({
    organisation_id: organisationId,
    title: validation.values.title,
    category: validation.values.category,
    body: validation.values.body,
    warning: validation.values.warning,
    display_order: validation.values.displayOrder,
    is_active: true,
  });
  if (error) return result(false, error.code === "23505" ? "A Quick Reference record already uses this title." : "Quick Reference could not be added.", error.code === "23505" ? { title: "A record already uses this title." } : undefined);
  revalidateQuickReference();
  return result(true, "Quick Reference record added.");
}

export async function updateQuickReferenceAction(_: QuickReferenceActionState, formData: FormData): Promise<QuickReferenceActionState> {
  const { supabase, organisationId, accessLevel } = await actionContext();
  if (!organisationId || !hasPinsHubAccessLevel(accessLevel, "write")) return result(false, "You do not have permission to edit Quick Reference records.");
  const recordId = quickReferenceId(formData);
  if (!recordId) return result(false, "Quick Reference record could not be found.");
  const validation = validateQuickReference(formData);
  if (!validation.values) return result(false, "Please correct the highlighted fields.", validation.errors);

  const { data, error } = await supabase.from("quick_reference_records").update({
    title: validation.values.title,
    category: validation.values.category,
    body: validation.values.body,
    warning: validation.values.warning,
    display_order: validation.values.displayOrder,
  }).eq("id", recordId).eq("organisation_id", organisationId).select("id").maybeSingle();
  if (error) return result(false, error.code === "23505" ? "A Quick Reference record already uses this title." : "Quick Reference could not be saved.", error.code === "23505" ? { title: "A record already uses this title." } : undefined);
  if (!data) return result(false, "Quick Reference record could not be found.");
  revalidateQuickReference();
  return result(true, "Quick Reference record saved.");
}

export async function setQuickReferenceActiveAction(_: QuickReferenceActionState, formData: FormData): Promise<QuickReferenceActionState> {
  const { supabase, organisationId, accessLevel } = await actionContext();
  if (!organisationId || !hasPinsHubAccessLevel(accessLevel, "admin")) return result(false, "Only administrators may change Quick Reference status.");
  const recordId = quickReferenceId(formData);
  if (!recordId) return result(false, "Quick Reference record could not be found.");
  const isActiveValue = String(formData.get("isActive") ?? "");
  if (isActiveValue !== "true" && isActiveValue !== "false") return result(false, "Quick Reference status is invalid.");

  const { data, error } = await supabase.from("quick_reference_records").update({ is_active: isActiveValue === "true" }).eq("id", recordId).eq("organisation_id", organisationId).select("id").maybeSingle();
  if (error) return result(false, "Quick Reference status could not be changed.");
  if (!data) return result(false, "Quick Reference record could not be found.");
  revalidateQuickReference();
  return result(true, isActiveValue === "true" ? "Quick Reference record reactivated." : "Quick Reference record deactivated.");
}

export async function deleteQuickReferenceAction(_: QuickReferenceActionState, formData: FormData): Promise<QuickReferenceActionState> {
  const { supabase, organisationId, accessLevel } = await actionContext();
  if (!organisationId || !hasPinsHubAccessLevel(accessLevel, "admin")) return result(false, "Only administrators may delete Quick Reference records.");
  const recordId = quickReferenceId(formData);
  if (!recordId) return result(false, "Quick Reference record could not be found.");

  const { data, error } = await supabase.from("quick_reference_records").delete().eq("id", recordId).eq("organisation_id", organisationId).select("id").maybeSingle();
  if (error) return result(false, "Quick Reference record could not be deleted.");
  if (!data) return result(false, "Quick Reference record could not be found.");
  revalidateQuickReference();
  return result(true, "Quick Reference record deleted.");
}
