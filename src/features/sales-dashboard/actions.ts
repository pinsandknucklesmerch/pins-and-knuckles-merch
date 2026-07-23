"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { upsertSalesKpiTargets } from "./data/salesDashboardRepository";
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
