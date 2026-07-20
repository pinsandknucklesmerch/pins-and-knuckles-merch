"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { normaliseTeamMemberKey, normaliseTeamMemberName } from "./domain/normaliseTeamMember";
import { upsertCompanyKpi, upsertMemberKpi } from "./data/salesDashboardRepository";
import type { CompanyKpiMonth, TeamMemberKpiMonth } from "./domain/types";

export type ManualKpiActionState = { ok: boolean; message: string };

function optionalNumber(formData: FormData, key: string, integer = false): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) throw new Error(`${key} must be a non-negative ${integer ? "whole number" : "number"}.`);
  return value;
}

export async function saveManualKpis(_state: ManualKpiActionState, formData: FormData): Promise<ManualKpiActionState> {
  const access = await getCurrentPinsHubAccess();
  if (access.access?.access_level !== "admin" || !access.user) return { ok: false, message: "Admin access required." };
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!Number.isInteger(year) || year < 2020) return { ok: false, message: "Year must be 2020 or later." };
  if (!Number.isInteger(month) || month < 1 || month > 12) return { ok: false, message: "Month must be between 1 and 12." };
  try {
    const company: CompanyKpiMonth = {
      year, month,
      monthlyProfit: optionalNumber(formData, "monthly_profit"),
      quotesDone: optionalNumber(formData, "quotes_done", true),
      ordersProcessed: optionalNumber(formData, "orders_processed", true),
      salesInboxEnquiries: optionalNumber(formData, "sales_inbox_enquiries", true),
      converted: optionalNumber(formData, "converted", true),
      notes: String(formData.get("notes") ?? "").trim() || null,
      source: "manual",
    };
    const companyResult = await upsertCompanyKpi(company, access.membership?.organisation_id ?? null, access.user.id);
    if (companyResult.error) return { ok: false, message: companyResult.error.message };

    const memberName = normaliseTeamMemberName(String(formData.get("team_member_name") ?? ""));
    if (memberName) {
      const member: TeamMemberKpiMonth = {
        year, month, teamMemberName: memberName, teamMemberKey: normaliseTeamMemberKey(memberName),
        quotesDone: optionalNumber(formData, "member_quotes_done", true),
        ordersProcessed: optionalNumber(formData, "member_orders_processed", true),
        salesInboxEnquiries: optionalNumber(formData, "member_sales_inbox_enquiries", true),
        converted: optionalNumber(formData, "member_converted", true),
        profit: optionalNumber(formData, "member_profit"), source: "manual",
      };
      const memberResult = await upsertMemberKpi(member, access.membership?.organisation_id ?? null, access.user.id);
      if (memberResult.error) return { ok: false, message: memberResult.error.message };
    }
    revalidatePath("/hub/sales-dashboard");
    return { ok: true, message: "Monthly KPIs saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invalid KPI values." };
  }
}
