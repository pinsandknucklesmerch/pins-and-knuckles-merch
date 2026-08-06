"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPinsHubAccess, hasAdminAccess, resolvePinsHubAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import { validateTvSettings, type TvSettingsActionState, type TvSlideSetting } from "./lib/tvSettings";
import { clearSalesKpiMonthFinalValue as clearFinalValue, saveSalesKpiMonthFinalValue as saveFinalValue, upsertSalesKpiTargets } from "./data/salesDashboardRepository";
import type { FinalisableSalesKpiCode } from "./domain/types";
import { validateSalesKpiMonthFinalValue } from "./lib/finalValue";
import { executeTargetSave, type TargetActionState, type TargetSavePeriod } from "./lib/targetSave";
import type { FinalValueActionState } from "./lib/finalValue";

export async function saveSalesKpiTargets(period: TargetSavePeriod, _state: TargetActionState, formData: FormData): Promise<TargetActionState> {
  return executeTargetSave(period, formData, { getAccess: getCurrentPinsHubAccess, upsertTargets: upsertSalesKpiTargets, revalidate: revalidatePath, logWriteError: (error) => console.error("Sales dashboard target write failed", error) });
}

export async function saveSalesKpiMonthFinalValue(period: { year: number; month: number }, _state: FinalValueActionState, formData: FormData): Promise<FinalValueActionState> {
  const finalInput = validateSalesKpiMonthFinalValue(String(formData.get("metricCode") ?? ""), String(formData.get("value") ?? "").trim());
  if (!finalInput) return { ok: false, message: "Enter a valid final value." };
  const access = await getCurrentPinsHubAccess();
  if (access.queryError) return { ok: false, message: "Authentication is temporarily unavailable." };
  if (!hasAdminAccess(access) || !access.user) return { ok: false, message: "Admin access required." };
  if (!access.membership?.organisation_id) return { ok: false, message: "Organisation unavailable." };
  const { error } = await saveFinalValue({ organisationId: access.membership.organisation_id, userId: access.user.id, year: period.year, month: period.month, metricCode: finalInput.metricCode, value: finalInput.value });
  if (error) { console.error("Sales KPI final value save failed", error); return { ok: false, message: "Final value save failed." }; }
  revalidatePath("/hub/sales-dashboard");
  return { ok: true, message: "Final value saved." };
}

export async function clearSalesKpiMonthFinalValue(period: { year: number; month: number; metricCode: FinalisableSalesKpiCode }): Promise<FinalValueActionState> {
  const access = await getCurrentPinsHubAccess();
  if (access.queryError) return { ok: false, message: "Authentication is temporarily unavailable." };
  if (!hasAdminAccess(access)) return { ok: false, message: "Admin access required." };
  if (!access.membership?.organisation_id) return { ok: false, message: "Organisation unavailable." };
  const { error } = await clearFinalValue({ organisationId: access.membership.organisation_id, year: period.year, month: period.month, metricCode: period.metricCode });
  if (error) { console.error("Sales KPI final value clear failed", error); return { ok: false, message: "Final value clear failed." }; }
  revalidatePath("/hub/sales-dashboard");
  return { ok: true, message: "Final value cleared." };
}

function result(ok: boolean, message: string): TvSettingsActionState {
  return { ok, message };
}

function parsePayload(value: FormDataEntryValue | null): TvSlideSetting[] | null {
  if (typeof value !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const rows = parsed.map((row) => {
      if (!row || typeof row !== "object") throw new Error();
      const candidate = row as Record<string, unknown>;
      if (typeof candidate.slideKey !== "string" || typeof candidate.isEnabled !== "boolean" || typeof candidate.displayOrder !== "number" || typeof candidate.durationSeconds !== "number") throw new Error();
      return {
        slideKey: candidate.slideKey as TvSlideSetting["slideKey"],
        isEnabled: candidate.isEnabled,
        displayOrder: candidate.displayOrder,
        durationSeconds: candidate.durationSeconds,
      };
    });
    return validateTvSettings(rows) ? null : rows;
  } catch {
    return null;
  }
}

async function adminContext() {
  const supabase = await createClient();
  const access = await resolvePinsHubAccess(supabase);
  if (!hasAdminAccess(access) || !access.membership?.organisation_id || !access.user?.id) return null;
  return { supabase, organisationId: access.membership.organisation_id };
}

export async function saveSalesDashboardTvSettings(_: TvSettingsActionState, formData: FormData): Promise<TvSettingsActionState> {
  void _;
  const context = await adminContext();
  if (!context) return result(false, "Only Pins Hub administrators can change TV settings.");
  const settings = parsePayload(formData.get("settings"));
  if (!settings) return result(false, "TV settings are invalid. Check durations, order, and enabled slides.");
  const { error } = await context.supabase.rpc("save_sales_dashboard_tv_settings", {
    p_organisation_id: context.organisationId,
    p_settings: settings.map(({ slideKey, isEnabled, displayOrder, durationSeconds }) => ({ slide_key: slideKey, is_enabled: isEnabled, display_order: displayOrder, duration_seconds: durationSeconds })),
  });
  if (error) return result(false, "TV settings could not be saved. The settings transaction was rolled back.");
  revalidatePath("/hub/sales-dashboard");
  revalidatePath("/hub/sales-dashboard/tv/settings");
  return result(true, "TV settings saved.");
}

export async function resetSalesDashboardTvSettings(_: TvSettingsActionState, __: FormData): Promise<TvSettingsActionState> {
  void _;
  void __;
  const context = await adminContext();
  if (!context) return result(false, "Only Pins Hub administrators can reset TV settings.");
  const { error } = await context.supabase.rpc("reset_sales_dashboard_tv_settings", { p_organisation_id: context.organisationId });
  if (error) return result(false, "TV settings could not be reset. The reset transaction was rolled back.");
  revalidatePath("/hub/sales-dashboard");
  revalidatePath("/hub/sales-dashboard/tv/settings");
  return result(true, "TV settings reset to defaults.");
}
