import type { PinsHubAccessResult } from "@/lib/access/pinsHubAccess";
import type { SalesKpiTargets, SalesMetricCode } from "../domain/types.ts";

export type TargetActionState = { ok: boolean; message: string };
type WriteError = { code?: string; details?: string; hint?: string; message?: string };

const TARGET_CODES = ["MONTHLY_PROFIT", "QUOTES_DONE", "ORDERS_PROCESSED", "CONVERSION_RATE"] as const satisfies readonly SalesMetricCode[];

export type TargetSaveDependencies = {
  getAccess: () => Promise<PinsHubAccessResult>;
  upsertTargets: (targets: Required<SalesKpiTargets>, organisationId: string, effectiveFrom: string) => Promise<{ error: WriteError | null }>;
  revalidate: (path: string) => void;
  logWriteError?: (error: WriteError) => void;
};

export type TargetSavePeriod = { year: number; month: number };

function number(formData: FormData, key: SalesMetricCode, integer = false, maximum?: number) {
  const raw = String(formData.get(key) ?? "").trim();
  const value = Number(raw);
  if (!raw || !Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value)) || (maximum !== undefined && value > maximum)) {
    throw new Error("Targets must use valid non-negative values.");
  }
  return value;
}

function rejectUnsupportedFields(formData: FormData) {
  for (const key of formData.keys()) {
    if (!TARGET_CODES.includes(key as SalesMetricCode) && !key.startsWith("$ACTION_")) {
      throw new Error("Unsupported target field.");
    }
  }
}

function writeFailure(error: WriteError) {
  if (error.code === "42501") return "Database access denied.";
  if (error.code === "23503") return "Organisation or user profile is unavailable.";
  if (error.code === "57014" || error.message?.toLowerCase().includes("timeout")) return "Database write timed out.";
  return "Target save failed.";
}

export async function executeTargetSave(
  period: TargetSavePeriod,
  formData: FormData,
  dependencies: TargetSaveDependencies,
): Promise<TargetActionState> {
  if (!Number.isInteger(period.year) || period.year < 2020) return { ok: false, message: "Year must be 2020 or later." };
  if (!Number.isInteger(period.month) || period.month < 1 || period.month > 12) return { ok: false, message: "Month must be between 1 and 12." };

  try {
    rejectUnsupportedFields(formData);
    const targets: Required<SalesKpiTargets> = {
      MONTHLY_PROFIT: number(formData, "MONTHLY_PROFIT"),
      QUOTES_DONE: number(formData, "QUOTES_DONE", true),
      ORDERS_PROCESSED: number(formData, "ORDERS_PROCESSED", true),
      CONVERSION_RATE: number(formData, "CONVERSION_RATE", false, 100),
    };
    const access = await dependencies.getAccess();
    if (access.queryError) return { ok: false, message: "Authentication is temporarily unavailable." };
    if (access.access?.access_level !== "admin" || !access.user) return { ok: false, message: "Admin access required." };
    if (!access.membership?.organisation_id) return { ok: false, message: "Organisation unavailable." };

    const result = await dependencies.upsertTargets(
      targets,
      access.membership.organisation_id,
      `${period.year}-${String(period.month).padStart(2, "0")}-01`,
    );
    if (result.error) {
      dependencies.logWriteError?.(result.error);
      return { ok: false, message: writeFailure(result.error) };
    }

    dependencies.revalidate("/hub/sales-dashboard");
    return { ok: true, message: "Targets updated for this month and future months." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invalid target values." };
  }
}
