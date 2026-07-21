"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { upsertCompanyKpi, upsertMemberKpi } from "./data/salesDashboardRepository";
import { executeManualKpiSave, type ManualKpiActionState } from "./lib/manualKpiSave";

export type { ManualKpiActionState } from "./lib/manualKpiSave";

export async function saveManualKpis(_state: ManualKpiActionState, formData: FormData): Promise<ManualKpiActionState> {
  return executeManualKpiSave(formData, {
    getAccess: getCurrentPinsHubAccess,
    upsertCompany: upsertCompanyKpi,
    upsertMember: upsertMemberKpi,
    revalidate: revalidatePath,
    logWriteError: (operation, error) => console.error("Sales dashboard KPI write failed", { operation, ...error }),
  });
}
