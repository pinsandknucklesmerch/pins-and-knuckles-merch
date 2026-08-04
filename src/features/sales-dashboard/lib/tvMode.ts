export const TV_DURATION_OPTIONS_SECONDS = [10, 20, 30, 45, 60] as const;
export const DEFAULT_TV_DURATION_SECONDS = 20;
export const TV_DATA_REFRESH_INTERVAL_MS = 5 * 60_000;
export type TvSlide = "profit-overview" | "sales-activity" | "ytd" | "year-comparison" | "snuggle";
export const TV_VIEWS = ["profit-overview", "sales-activity", "ytd", "year-comparison", "snuggle"] as const satisfies readonly TvSlide[];

export function parseTvDuration(value: string | string[] | undefined) {
  const candidate = Number(Array.isArray(value) ? value[0] : value);
  return TV_DURATION_OPTIONS_SECONDS.find((option) => option === candidate) ?? DEFAULT_TV_DURATION_SECONDS;
}

export function tvDurationMilliseconds(seconds: number) {
  return seconds * 1_000;
}

type TvUrlOptions = {
  year: number;
  month: number;
  view?: string;
  member?: string;
  durationSeconds?: number;
};

export function buildTvModeUrl({ year, month, view, member, durationSeconds = DEFAULT_TV_DURATION_SECONDS }: TvUrlOptions) {
  const params = new URLSearchParams({ month: String(month), year: String(year), tv: "1", duration: String(parseTvDuration(String(durationSeconds))) });
  if (view) params.set("view", view);
  if (member) params.set("member", member);
  return `/hub/sales-dashboard?${params.toString()}`;
}

export function buildNormalModeUrl({ year, month, view, member }: TvUrlOptions) {
  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (view) params.set("view", view);
  if (member) params.set("member", member);
  return `/hub/sales-dashboard?${params.toString()}`;
}

export function isTvMode(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) === "1";
}

export function nextTvView(current: TvSlide) {
  const index = TV_VIEWS.indexOf(current);
  return TV_VIEWS[(index + 1) % TV_VIEWS.length];
}

export function previousTvView(current: TvSlide) {
  const index = TV_VIEWS.indexOf(current);
  return TV_VIEWS[(index - 1 + TV_VIEWS.length) % TV_VIEWS.length];
}
