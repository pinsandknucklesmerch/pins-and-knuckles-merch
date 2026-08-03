"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { clearSalesKpiMonthFinalValue as clearFinalValue, saveSalesKpiMonthFinalValue as saveFinalValue, upsertSalesKpiTargets } from "./data/salesDashboardRepository";
import type { FinalisableSalesKpiCode } from "./domain/types";
import { validateSalesKpiMonthFinalValue } from "./lib/finalValue";
import { executeTargetSave, type TargetActionState, type TargetSavePeriod } from "./lib/targetSave";

export type { TargetActionState } from "./lib/targetSave";

export async function saveSalesKpiTargets(period: TargetSavePeriod, _state: TargetActionState, formData: FormData): Promise<TargetActionState> {
  return executeTargetSave(period, formData, {
    getAccess: getCurrentPinsHubAccess,
    upsertTargets: upsertSalesKpiTargets,
    revalidate: revalidatePath,
    logWriteError: (error) => console.error("Sales dashboard target write failed", error),
  });
}

export type FinalValueActionState = { ok: boolean; message: string };

export async function saveSalesKpiMonthFinalValue(period: { year: number; month: number }, _state: FinalValueActionState, formData: FormData): Promise<FinalValueActionState> {
  const rawMetricCode = String(formData.get("metricCode") ?? "");
  const raw = String(formData.get("value") ?? "").trim();
  const finalInput = validateSalesKpiMonthFinalValue(rawMetricCode, raw);
  if (!finalInput) return { ok: false, message: "Enter a valid final value." };
  const access = await getCurrentPinsHubAccess();
  if (access.queryError) return { ok: false, message: "Authentication is temporarily unavailable." };
  if (access.access?.access_level !== "admin" || !access.user) return { ok: false, message: "Admin access required." };
  if (!access.membership?.organisation_id) return { ok: false, message: "Organisation unavailable." };
  const { error } = await saveFinalValue({ organisationId: access.membership.organisation_id, userId: access.user.id, year: period.year, month: period.month, metricCode: finalInput.metricCode, value: finalInput.value });
  if (error) { console.error("Sales KPI final value save failed", error); return { ok: false, message: "Final value save failed." }; }
  revalidatePath("/hub/sales-dashboard");
  return { ok: true, message: "Final value saved." };
}

export async function clearSalesKpiMonthFinalValue(period: { year: number; month: number; metricCode: FinalisableSalesKpiCode }): Promise<FinalValueActionState> {
  const access = await getCurrentPinsHubAccess();
  if (access.queryError) return { ok: false, message: "Authentication is temporarily unavailable." };
  if (access.access?.access_level !== "admin") return { ok: false, message: "Admin access required." };
  if (!access.membership?.organisation_id) return { ok: false, message: "Organisation unavailable." };
  const { error } = await clearFinalValue({ organisationId: access.membership.organisation_id, year: period.year, month: period.month, metricCode: period.metricCode });
  if (error) { console.error("Sales KPI final value clear failed", error); return { ok: false, message: "Final value clear failed." }; }
  revalidatePath("/hub/sales-dashboard");
  return { ok: true, message: "Final value cleared." };
}
