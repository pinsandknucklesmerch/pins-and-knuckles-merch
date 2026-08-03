export const TV_ROTATION_INTERVAL_MS = 20_000;
export const TV_DATA_REFRESH_INTERVAL_MS = 5 * 60_000;
export type TvSlide = "profit-overview" | "sales-activity" | "ytd" | "year-comparison" | "snuggle";
export const TV_VIEWS = ["profit-overview", "sales-activity", "ytd", "year-comparison", "snuggle"] as const satisfies readonly TvSlide[];

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
