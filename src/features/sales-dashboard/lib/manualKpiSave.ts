import type { PinsHubAccessResult } from "@/lib/access/pinsHubAccess";
import { normaliseTeamMemberKey, normaliseTeamMemberName } from "../domain/normaliseTeamMember.ts";
import type { CompanyKpiMonth, TeamMemberKpiMonth } from "../domain/types.ts";

export type ManualKpiActionState = { ok: boolean; message: string };
type WriteError = { code?: string; details?: string; hint?: string; message?: string };

export type ManualKpiSaveDependencies = {
  getAccess: () => Promise<PinsHubAccessResult>;
  upsertCompany: (input: CompanyKpiMonth, organisationId: string, updatedBy: string) => Promise<{ error: WriteError | null }>;
  upsertMember: (input: TeamMemberKpiMonth, organisationId: string, updatedBy: string) => Promise<{ error: WriteError | null }>;
  revalidate: (path: string) => void;
  logWriteError?: (operation: "company" | "member", error: WriteError) => void;
};

function optionalNumber(formData: FormData, key: string, integer = false): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) {
    throw new Error("KPI values must be non-negative numbers.");
  }
  return value;
}

function writeFailure(error: WriteError) {
  if (error.code === "42501") return "Database access denied.";
  if (error.code === "23503") return "Organisation or user profile is unavailable.";
  if (error.code === "57014" || error.message?.toLowerCase().includes("timeout")) return "Database write timed out.";
  return "Database write failed.";
}

export async function executeManualKpiSave(
  formData: FormData,
  dependencies: ManualKpiSaveDependencies,
): Promise<ManualKpiActionState> {
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
    const memberName = normaliseTeamMemberName(String(formData.get("team_member_name") ?? ""));
    const member: TeamMemberKpiMonth | null = memberName ? {
      year, month, teamMemberName: memberName, teamMemberKey: normaliseTeamMemberKey(memberName),
      quotesDone: optionalNumber(formData, "member_quotes_done", true),
      ordersProcessed: optionalNumber(formData, "member_orders_processed", true),
      salesInboxEnquiries: optionalNumber(formData, "member_sales_inbox_enquiries", true),
      converted: optionalNumber(formData, "member_converted", true),
      profit: optionalNumber(formData, "member_profit"), source: "manual",
    } : null;

    const access = await dependencies.getAccess();
    if (access.queryError) return { ok: false, message: "Authentication is temporarily unavailable." };
    if (access.access?.access_level !== "admin" || !access.user) return { ok: false, message: "Admin access required." };
    if (!access.membership?.organisation_id) return { ok: false, message: "Organisation unavailable." };

    const companyResult = await dependencies.upsertCompany(company, access.membership.organisation_id, access.user.id);
    if (companyResult.error) {
      dependencies.logWriteError?.("company", companyResult.error);
      return { ok: false, message: writeFailure(companyResult.error) };
    }

    if (member) {
      const memberResult = await dependencies.upsertMember(member, access.membership.organisation_id, access.user.id);
      if (memberResult.error) {
        dependencies.logWriteError?.("member", memberResult.error);
        return { ok: false, message: writeFailure(memberResult.error) };
      }
    }

    dependencies.revalidate("/hub/sales-dashboard");
    return { ok: true, message: "Monthly KPIs saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invalid KPI values." };
  }
}
