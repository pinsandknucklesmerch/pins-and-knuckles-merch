import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess, getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { revalidatePath } from "next/cache";
import {
  cloneEpccReportTemplate,
  DEFAULT_EPCC_REPORT_TEMPLATE,
  type EpccReportTemplate,
  type EpccReportTemplateComponent,
  type EpccReportComponentId,
} from "./epccReportTemplate";

function isEpccReportComponentId(value: unknown): value is EpccReportComponentId {
  return typeof value === "string" && DEFAULT_EPCC_REPORT_TEMPLATE.components.some((component) => component.id === value);
}
type TemplateQuery = {
  select(columns: string): TemplateQuery;
  eq(column: string, value: string): TemplateQuery;
  maybeSingle(): Promise<{ data: { template: unknown } | null; error: unknown }>;
  upsert(values: Record<string, unknown>, options: { onConflict: string }): Promise<{ error: unknown }>;
};
type UntypedSupabase = { from(table: string): TemplateQuery };

export function normalizeEpccReportTemplate(value: unknown): EpccReportTemplate {
  if (!value || typeof value !== "object") return cloneEpccReportTemplate();
  const candidate = value as { version?: unknown; components?: unknown };
  if (candidate.version !== DEFAULT_EPCC_REPORT_TEMPLATE.version || !Array.isArray(candidate.components)) return cloneEpccReportTemplate();
  const defaults = cloneEpccReportTemplate();
  const overrides = new Map<EpccReportComponentId, Partial<EpccReportTemplateComponent>>();
  for (const item of candidate.components) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (!isEpccReportComponentId(row.id)) continue;
    const fallback = defaults.components.find((component) => component.id === row.id);
    if (!fallback || row.type !== fallback.type || row.page !== fallback.page || row.region !== fallback.region || typeof row.enabled !== "boolean" || typeof row.label !== "string" || typeof row.order !== "number" || !Number.isFinite(row.order)) continue;
    const rawLabels = row.labels;
    const labels = rawLabels && typeof rawLabels === "object" ? Object.fromEntries(Object.entries(rawLabels as Record<string, unknown>).filter(([key, label]) => ["bonus", "previousYear", "target", "varianceAbove", "varianceBelow"].includes(key) && typeof label === "string").map(([key, label]) => [key, (label as string).slice(0, 120)])) : undefined;
    overrides.set(row.id, { enabled: row.enabled, label: row.label.slice(0, 120), order: row.order, ...(labels ? { labels } : {}) });
  }
  const merged = defaults.components.map((component) => ({ ...component, ...overrides.get(component.id) }));
  const legacyYtd = merged.find((component) => component.id === "ytd-summary")?.labels;
  const legacyMonthly = merged.find((component) => component.id === "monthly-profit")?.labels;
  return {
    version: defaults.version,
    components: merged.map((component) => {
      if (component.id === "previous-year-ytd" && legacyYtd?.previousYear) return { ...component, label: legacyYtd.previousYear };
      if (component.id === "ytd-target" && legacyYtd?.target) return { ...component, label: legacyYtd.target };
      if (component.id === "target-variance" && legacyYtd?.varianceAbove) return { ...component, label: legacyYtd.varianceAbove, labels: { ...component.labels, varianceBelow: legacyYtd.varianceBelow ?? component.labels?.varianceBelow } };
      if (component.id === "bonus-profit" && legacyMonthly?.bonus) return { ...component, label: legacyMonthly.bonus };
      return component;
    }),
  };
}

export async function loadEpccReportTemplate(organisationId: string | null): Promise<EpccReportTemplate> {
  if (!organisationId) return cloneEpccReportTemplate();
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as UntypedSupabase).from("epcc_report_templates").select("template").eq("organisation_id", organisationId).maybeSingle();
  if (error || !data) return cloneEpccReportTemplate();
  return normalizeEpccReportTemplate(data.template);
}

export async function saveEpccReportTemplate(template: EpccReportTemplate): Promise<{ ok: boolean; message: string }> {
  const access = await getCurrentPinsHubAccess();
  if (!hasAdminAccess(access) || !access.membership?.organisation_id || !access.user?.id) return { ok: false, message: "Admin access required." };
  const normalized = normalizeEpccReportTemplate(template);
  const supabase = await createClient();
  const { error } = await (supabase as unknown as UntypedSupabase).from("epcc_report_templates").upsert({ organisation_id: access.membership.organisation_id, template: normalized, updated_by: access.user.id }, { onConflict: "organisation_id" });
  if (error) return { ok: false, message: "Report template could not be saved." };
  revalidatePath("/hub/reporting/epcc");
  return { ok: true, message: "Report template saved." };
}
