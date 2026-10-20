import { isUuid, record } from "./checklist";

export type ChecklistDutyConfiguration = { id: string; name: string; displayOrder: number; isActive: boolean };
export type ChecklistStaffConfiguration = { id: string; name: string; memberId: string | null; displayOrder: number; isActive: boolean };
export type ChecklistOrganisationUser = { id: string; name: string; email: string | null };
export type ChecklistManagement = {
  duties: ChecklistDutyConfiguration[];
  staff: ChecklistStaffConfiguration[];
  users: ChecklistOrganisationUser[];
};
export type ChecklistManagementInput = Pick<ChecklistManagement, "duties" | "staff">;
export type ChecklistManagementSaveResult = { ok: boolean; message: string };

function orderedRow(value: unknown): value is Record<string, unknown> & { id: string; displayOrder: number; isActive: boolean } {
  return record(value) && isUuid(value.id) && typeof value.displayOrder === "number"
    && Number.isInteger(value.displayOrder) && value.displayOrder >= 0 && typeof value.isActive === "boolean";
}

export function parseManagementInput(value: unknown): ChecklistManagementInput {
  if (!record(value) || !Array.isArray(value.duties) || !Array.isArray(value.staff)
    || value.duties.length > 100 || value.staff.length > 100) throw new Error("Invalid checklist configuration.");
  const duties = value.duties.map((duty: unknown) => {
    if (!orderedRow(duty) || typeof duty.name !== "string" || !duty.name.trim() || duty.name.trim().length > 120) throw new Error("Use duty names from 1 to 120 characters.");
    return { id: duty.id, name: duty.name.trim(), displayOrder: duty.displayOrder, isActive: duty.isActive };
  });
  const staff = value.staff.map((person: unknown) => {
    if (!orderedRow(person) || typeof person.name !== "string" || !(person.memberId === null || isUuid(person.memberId))
      || (person.isActive && person.memberId === null)) throw new Error("Select an organisation user for each active assignment.");
    return { id: person.id, name: person.name, memberId: person.memberId, displayOrder: person.displayOrder, isActive: person.isActive };
  });
  if (!staff.some((person) => person.isActive)) throw new Error("Keep at least one team member active.");
  for (const rows of [duties, staff]) {
    if (new Set(rows.map((row) => row.id)).size !== rows.length || new Set(rows.map((row) => row.displayOrder)).size !== rows.length) throw new Error("Each row must have a unique order.");
  }
  if (new Set(duties.map((duty) => duty.name.toLocaleLowerCase("en-ZA"))).size !== duties.length) throw new Error("Duty names must be unique.");
  const assigned = staff.map((person) => person.memberId).filter((id) => id !== null);
  if (new Set(assigned).size !== assigned.length) throw new Error("Assign each organisation user once.");
  return { duties, staff };
}

export function parseManagementData(value: unknown): ChecklistManagement {
  if (!record(value) || !Array.isArray(value.duties) || !Array.isArray(value.staff) || !Array.isArray(value.users)) throw new Error("Invalid management data.");
  // Bootstrap configurations can contain unlinked staff; saving requires selecting actual users.
  const duties = value.duties.map((duty: unknown) => {
    if (!orderedRow(duty) || typeof duty.name !== "string") throw new Error("Invalid duty.");
    return { id: duty.id, name: duty.name, displayOrder: duty.displayOrder, isActive: duty.isActive };
  });
  const staff = value.staff.map((person: unknown) => {
    if (!orderedRow(person) || typeof person.name !== "string" || !(person.memberId === null || isUuid(person.memberId))) throw new Error("Invalid staff assignment.");
    return { id: person.id, name: person.name, memberId: person.memberId, displayOrder: person.displayOrder, isActive: person.isActive };
  });
  const users = value.users.map((user: unknown) => {
    if (!record(user) || !isUuid(user.id) || typeof user.name !== "string" || !(user.email === null || typeof user.email === "string")) throw new Error("Invalid organisation user.");
    return { id: user.id, name: user.name, email: user.email };
  });
  return { duties, staff, users };
}

export function moveChecklistRow<T extends { displayOrder: number }>(rows: T[], index: number, direction: -1 | 1): T[] {
  const ordered = [...rows].sort((a, b) => a.displayOrder - b.displayOrder);
  const target = index + direction;
  if (target < 0 || target >= ordered.length) return rows;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  return ordered.map((row, displayOrder) => ({ ...row, displayOrder }));
}
