export const CHECKLIST_STATUSES = ["complete", "to_do", "na"] as const;
export type ChecklistStatus = typeof CHECKLIST_STATUSES[number];
export const STATUS_LABELS: Record<ChecklistStatus, string> = { complete: "Completed", to_do: "To Do", na: "N/A" };

const NEXT_CHECKLIST_STATUS: Record<ChecklistStatus, ChecklistStatus> = {
  to_do: "complete",
  complete: "na",
  na: "to_do",
};

export function nextChecklistStatus(status: ChecklistStatus): ChecklistStatus {
  return NEXT_CHECKLIST_STATUS[status];
}

export type WeeklyChecklist = {
  weekId: string;
  isCurrent: boolean;
  weeks: Array<{ id: string; startsAt: string }>;
  duties: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; name: string; canEdit: boolean }>;
  entries: Array<{ id: string; dutyId: string; staffId: string; status: ChecklistStatus }>;
};

export function isChecklistStatus(value: unknown): value is ChecklistStatus {
  return value === "complete" || value === "to_do" || value === "na";
}

export function checklistScore(statuses: ChecklistStatus[]) {
  const complete = statuses.filter((status) => status === "complete").length;
  const applicable = statuses.filter((status) => status !== "na").length;
  return { complete, applicable, percentage: applicable === 0 ? null : Math.round(complete / applicable * 100) };
}

export function weekLabel(startsAt: string) {
  return `Week of ${new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", day: "numeric", month: "short", year: "numeric" }).format(new Date(startsAt))}`;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Validate the JSON RPC boundary rather than asserting a generated JSON type is a domain object.
export function parseWeeklyChecklist(value: unknown): WeeklyChecklist {
  if (!record(value) || !isUuid(value.weekId) || typeof value.isCurrent !== "boolean"
    || !Array.isArray(value.weeks) || !Array.isArray(value.duties) || !Array.isArray(value.staff) || !Array.isArray(value.entries)) {
    throw new Error("Checklist data could not be loaded.");
  }
  const weeks = value.weeks.map((week: unknown) => {
    if (!record(week) || !isUuid(week.id) || typeof week.startsAt !== "string" || !Number.isFinite(Date.parse(week.startsAt))) throw new Error("Invalid checklist week.");
    return { id: week.id, startsAt: week.startsAt };
  });
  const duties = value.duties.map((duty: unknown) => {
    if (!record(duty) || !isUuid(duty.id) || typeof duty.name !== "string") throw new Error("Invalid checklist duty.");
    return { id: duty.id, name: duty.name };
  });
  const staff = value.staff.map((person: unknown) => {
    if (!record(person) || !isUuid(person.id) || typeof person.name !== "string" || typeof person.canEdit !== "boolean") throw new Error("Invalid checklist staff.");
    return { id: person.id, name: person.name, canEdit: person.canEdit };
  });
  const entries = value.entries.map((entry: unknown) => {
    if (!record(entry) || !isUuid(entry.id) || !isUuid(entry.dutyId) || !isUuid(entry.staffId) || !isChecklistStatus(entry.status)) throw new Error("Invalid checklist entry.");
    return { id: entry.id, dutyId: entry.dutyId, staffId: entry.staffId, status: entry.status };
  });
  return { weekId: value.weekId, isCurrent: value.isCurrent, weeks, duties, staff, entries };
}
