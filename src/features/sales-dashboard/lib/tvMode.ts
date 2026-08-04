import { TV_SLIDE_KEYS, type TvSlideKey } from "./tvSettings.ts";

export const TV_DURATION_OPTIONS_SECONDS = [10, 20, 30, 45, 60] as const;
export const DEFAULT_TV_DURATION_SECONDS = 30;
export const TV_DATA_REFRESH_INTERVAL_MS = 5 * 60_000;
export type TvSlide = TvSlideKey;
export const TV_VIEWS = TV_SLIDE_KEYS;

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
  durationSeconds?: number;
};

export function buildTvModeUrl({ year, month, durationSeconds = DEFAULT_TV_DURATION_SECONDS }: TvUrlOptions) {
  const params = new URLSearchParams({ month: String(month), year: String(year), tv: "1", duration: String(parseTvDuration(String(durationSeconds))) });
  return `/hub/sales-dashboard?${params.toString()}`;
}

export function buildNormalModeUrl({ year, month }: TvUrlOptions) {
  const params = new URLSearchParams({ month: String(month), year: String(year) });
  return `/hub/sales-dashboard?${params.toString()}`;
}

export function isTvMode(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) === "1";
}

export function nextTvView(current: TvSlide, views: readonly TvSlide[] = TV_VIEWS) {
  const index = views.indexOf(current);
  return views[(index + 1) % views.length];
}

export function previousTvView(current: TvSlide, views: readonly TvSlide[] = TV_VIEWS) {
  const index = views.indexOf(current);
  return views[(index - 1 + views.length) % views.length];
}
