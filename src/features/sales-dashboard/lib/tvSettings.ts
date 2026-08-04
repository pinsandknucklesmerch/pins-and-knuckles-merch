import type { Database } from "@/types/database.types";

export const TV_SLIDE_KEYS = [
  "overview",
  "ytd",
  "year_comparison",
  "snuggle",
  "team_members",
] as const;

export type TvSlideKey = (typeof TV_SLIDE_KEYS)[number];
export type TvSettingsRow = Database["public"]["Tables"]["sales_dashboard_tv_settings"]["Row"];

export type TvSlideSetting = {
  slideKey: TvSlideKey;
  isEnabled: boolean;
  displayOrder: number;
  durationSeconds: number;
};

export type TvSettings = {
  slides: TvSlideSetting[];
  source: "database" | "defaults";
};

export type TvSettingsActionState = { ok: boolean; message: string };

export const DEFAULT_TV_SETTINGS: readonly TvSlideSetting[] = TV_SLIDE_KEYS.map((slideKey, displayOrder) => ({
  slideKey,
  isEnabled: true,
  displayOrder,
  durationSeconds: 30,
}));

// Temporary runtime guardrail: keep the Team Members dashboard tab available,
// but exclude it from TV playback until settings persistence is repaired.
export const TV_RUNTIME_FALLBACK_SETTINGS: readonly TvSlideSetting[] = DEFAULT_TV_SETTINGS.map((slide) => ({
  ...slide,
  isEnabled: slide.slideKey !== "team_members",
}));

const APPROVED_SLIDE_KEYS = new Set<string>(TV_SLIDE_KEYS);

export function validateTvSettings(rows: readonly TvSlideSetting[]): string | null {
  if (rows.length !== TV_SLIDE_KEYS.length) return "All five TV slides are required.";
  const keys = new Set<string>();
  const orders = new Set<number>();
  for (const row of rows) {
    if (!APPROVED_SLIDE_KEYS.has(row.slideKey)) return `Unsupported TV slide: ${row.slideKey}.`;
    if (keys.has(row.slideKey)) return "TV slide keys must be unique.";
    if (orders.has(row.displayOrder)) return "TV display orders must be unique.";
    if (!Number.isInteger(row.displayOrder) || row.displayOrder < 0) return "Display order must be a nonnegative whole number.";
    if (!Number.isInteger(row.durationSeconds) || row.durationSeconds < 10 || row.durationSeconds > 300) return "Duration must be a whole number between 10 and 300 seconds.";
    keys.add(row.slideKey);
    orders.add(row.displayOrder);
  }
  if (keys.size !== TV_SLIDE_KEYS.length || TV_SLIDE_KEYS.some((key) => !keys.has(key))) return "All five approved TV slides are required.";
  if (!rows.some((row) => row.isEnabled)) return "At least one TV slide must remain enabled.";
  return null;
}

export function sortTvSettings(rows: readonly TvSlideSetting[]) {
  return [...rows].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function mapTvSettingsRows(rows: readonly TvSettingsRow[]): TvSlideSetting[] {
  return sortTvSettings(rows.map((row) => ({
    slideKey: row.slide_key as TvSlideKey,
    isEnabled: row.is_enabled,
    displayOrder: row.display_order,
    durationSeconds: row.duration_seconds,
  })));
}

export function defaultTvSettings(): TvSettings {
  return { slides: DEFAULT_TV_SETTINGS.map((slide) => ({ ...slide })), source: "defaults" };
}

export function safeTvSettings(): TvSettings {
  return { slides: TV_RUNTIME_FALLBACK_SETTINGS.map((slide) => ({ ...slide })), source: "defaults" };
}
