import type { WeeklyChecklist } from "./checklist";

export const TV_DUTIES_PER_PAGE = 8;
export const TV_STAFF_PER_PAGE = 4;

// Status-only refreshes retain playback. A new week, order or task/team matrix restarts it.
export function checklistTvLayoutKey(checklist: WeeklyChecklist) {
  return JSON.stringify([checklist.weekId, checklist.duties.map((duty) => duty.id), checklist.staff.map((person) => person.id)]);
}

export function checklistTvPagePlan(checklist: WeeklyChecklist, durationSeconds: number) {
  const dutyPages = Math.max(1, Math.ceil(checklist.duties.length / TV_DUTIES_PER_PAGE));
  const staffPages = Math.max(1, Math.ceil(checklist.staff.length / TV_STAFF_PER_PAGE));
  const pageCount = dutyPages * staffPages;
  // Preserve the existing pacing; the controller extends playback when the minimum dwell needs longer.
  const pageDurationMs = Math.min(10_000, Math.max(1_000, (durationSeconds * 1_000 - 2_000) / pageCount));
  return { dutyPages, pageCount, pageDurationMs };
}
