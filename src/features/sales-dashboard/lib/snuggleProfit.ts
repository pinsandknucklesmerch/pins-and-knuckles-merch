import { isDashboardAccountManager, mapMondayMember, type CanonicalMemberKey } from "../domain/memberIdentity.ts";

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

export type Person = { id: string; kind?: string | null; name?: string | null };
export type SnuggleItem = {
  id: string;
  name: string;
  group?: { id: string; title: string } | null;
  column_values?: Array<{
    id: string;
    type?: string | null;
    text?: string | null;
    value?: string | null;
    display_value?: string | null;
    persons_and_teams?: Person[] | null;
  }>;
};
export type SnuggleBoard = { id: string; name: string; workspace?: { id: string } | null; items_page?: { cursor?: string | null; items: SnuggleItem[] } };

export type SnuggleWarning = {
  kind: "invalid-profit" | "unassigned" | "unmapped" | "multi-assignee";
  itemId: string;
  itemName: string;
  group: string;
  detail?: string;
  resolvedYear?: number;
  resolvedMonth?: number;
  mondayPersonId?: string;
  mondayPersonName?: string;
  assignedPeople?: Array<{ id: string; name: string }>;
};

export type SnuggleMonth = { year: number; month: number; total: number };
export type SnuggleMemberTotals = { memberKey: CanonicalMemberKey; total: number; months: SnuggleMonth[] };
export type SnuggleProfitData = {
  months: SnuggleMonth[];
  members: SnuggleMemberTotals[];
  warnings: SnuggleWarning[];
  error: string | null;
};

export function parseCompletedSnuggleGroup(title: string): { year: number; month: number } | null {
  const match = title.trim().match(/^completed\s+orders\s*-?\s*([a-z]+)\s+(\d{4})$/i);
  if (!match) return null;
  const month = MONTHS[match[1].toLocaleLowerCase("en-GB")];
  const year = Number(match[2]);
  return month && year >= 2000 ? { year, month } : null;
}

function column(item: SnuggleItem, id: string) { return item.column_values?.find((candidate) => candidate.id === id); }
function groupLabel(item: SnuggleItem) { return item.group?.title ?? "(no group)"; }
function parseProfit(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().replace(/[£$€R,\s]/gi, "");
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
}

function people(item: SnuggleItem) {
  return (column(item, "person")?.persons_and_teams ?? []).filter((person) => !person.kind || person.kind === "person");
}

export function aggregateSnuggleProfit(input: { board: SnuggleBoard; items: SnuggleItem[] }): SnuggleProfitData {
  const groups = new Map<string, { year: number; month: number; title: string }>();
  for (const item of input.items) {
    const resolved = parseCompletedSnuggleGroup(groupLabel(item));
    if (!resolved) continue;
    const key = `${resolved.year}-${resolved.month}`;
    const existing = groups.get(key);
    if (existing && existing.title !== groupLabel(item)) return { months: [], members: [], warnings: [], error: `Multiple Snuggle groups resolve to ${resolved.year}-${resolved.month}.` };
    groups.set(key, { ...resolved, title: groupLabel(item) });
  }
  const months = new Map<string, SnuggleMonth>();
  const members = new Map<CanonicalMemberKey, SnuggleMemberTotals>();
  const warnings: SnuggleWarning[] = [];
  for (const item of input.items) {
    const resolved = parseCompletedSnuggleGroup(groupLabel(item));
    if (!resolved) continue;
    const assigned = people(item);
    const warningContext = { resolvedYear: resolved.year, resolvedMonth: resolved.month };
    if (!assigned.length) warnings.push({ kind: "unassigned", itemId: item.id, itemName: item.name, group: groupLabel(item), ...warningContext });
    else if (assigned.length !== 1) warnings.push({
      kind: "multi-assignee", itemId: item.id, itemName: item.name, group: groupLabel(item),
      detail: `${assigned.length} Account Manager assignments.`,
      assignedPeople: assigned.map((person) => ({ id: person.id, name: person.name?.trim() || "Unknown Monday member" })),
      ...warningContext,
    });
    const profitValue = column(item, "formula_mm008w45")?.display_value;
    const profit = parseProfit(profitValue);
    if (profit === null) {
      warnings.push({ kind: "invalid-profit", itemId: item.id, itemName: item.name, group: groupLabel(item), detail: "Profit display value is blank or non-numeric.", ...warningContext });
      continue;
    }
    const key = `${resolved.year}-${resolved.month}`;
    const month = months.get(key) ?? { ...resolved, total: 0 };
    month.total += profit;
    months.set(key, month);
    if (!assigned.length || assigned.length !== 1) continue;
    const identity = mapMondayMember({ id: assigned[0].id });
    if (!isDashboardAccountManager(identity.classification)) {
      warnings.push({
        kind: "unmapped", itemId: item.id, itemName: item.name, group: groupLabel(item),
        detail: `Monday person ID ${assigned[0].id} is not mapped to a dashboard member.`,
        mondayPersonId: assigned[0].id,
        mondayPersonName: assigned[0].name?.trim() || "Unknown Monday member",
        ...warningContext,
      });
      continue;
    }
    const member = members.get(identity.key) ?? { memberKey: identity.key, total: 0, months: [] };
    member.total += profit;
    const memberMonth = member.months.find((candidate) => candidate.year === resolved.year && candidate.month === resolved.month);
    if (memberMonth) memberMonth.total += profit; else member.months.push({ ...resolved, total: profit });
    members.set(identity.key, member);
  }
  return { months: [...months.values()].sort((a, b) => b.year - a.year || b.month - a.month), members: [...members.values()].map((member) => ({ ...member, months: member.months.sort((a, b) => b.year - a.year || b.month - a.month) })), warnings, error: null };
}
