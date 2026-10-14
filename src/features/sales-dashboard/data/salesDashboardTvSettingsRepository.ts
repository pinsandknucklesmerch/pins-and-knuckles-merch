import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { defaultTvSettings, mapTvSettingsRows, sortTvSettings, validateTvSettings, type TvSettings, type TvSlideSetting } from "../lib/tvSettings";

type TvSettingsClient = Pick<ReturnType<typeof createClient> extends Promise<infer Client> ? Client : never, "from">;

export function normaliseTvSettingsRows(rows: Database["public"]["Tables"]["sales_dashboard_tv_settings"]["Row"][]): TvSlideSetting[] | null {
  const existing = mapTvSettingsRows(rows);
  // Preserve six-slide settings during the migration rollout window.
  const mapped = existing.some((slide) => slide.slideKey === "sales_checklist") ? existing : [
    ...existing,
    { slideKey: "sales_checklist" as const, isEnabled: true, displayOrder: Math.max(-1, ...existing.map((slide) => slide.displayOrder)) + 1, durationSeconds: 30 },
  ];
  return validateTvSettings(mapped) ? null : sortTvSettings(mapped);
}

export function tvSettingsFromRows(rows: Database["public"]["Tables"]["sales_dashboard_tv_settings"]["Row"][]): TvSettings {
  const slides = normaliseTvSettingsRows(rows);
  return slides ? { slides, source: "database" } : defaultTvSettings();
}

export async function loadSalesDashboardTvSettings(organisationId: string | null, supabase?: TvSettingsClient): Promise<TvSettings> {
  if (!organisationId) return defaultTvSettings();
  const client = supabase ?? await createClient();
  const { data, error } = await client
    .from("sales_dashboard_tv_settings")
    .select("organisation_id,slide_key,is_enabled,display_order,duration_seconds,updated_by,updated_at")
    .eq("organisation_id", organisationId)
    .order("display_order", { ascending: true });
  if (error || !data) return defaultTvSettings();
  return tvSettingsFromRows(data);
}
