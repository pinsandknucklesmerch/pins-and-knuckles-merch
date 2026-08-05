import type { SnuggleWarning } from "./snuggleProfit.ts";

export type UnmappedSnuggleGroup = {
  personId: string;
  personName: string;
  itemCount: number;
  months: string[];
  groups: string[];
  items: SnuggleWarning[];
};

export function groupUnmappedSnuggleWarnings(warnings: SnuggleWarning[]): UnmappedSnuggleGroup[] {
  const groups = new Map<string, UnmappedSnuggleGroup>();
  for (const warning of warnings) {
    if (warning.kind !== "unmapped" || !warning.mondayPersonId) continue;
    const group = groups.get(warning.mondayPersonId) ?? {
      personId: warning.mondayPersonId,
      personName: warning.mondayPersonName || "Unknown Monday member",
      itemCount: 0,
      months: [],
      groups: [],
      items: [],
    };
    group.itemCount += 1;
    group.items.push(warning);
    const month = warning.resolvedYear && warning.resolvedMonth
      ? new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(warning.resolvedYear, warning.resolvedMonth - 1, 1)))
      : warning.group;
    if (!group.months.includes(month)) group.months.push(month);
    if (!group.groups.includes(warning.group)) group.groups.push(warning.group);
    groups.set(warning.mondayPersonId, group);
  }
  return [...groups.values()].sort((a, b) => b.itemCount - a.itemCount || a.personName.localeCompare(b.personName, "en-GB") || a.personId.localeCompare(b.personId));
}

export function formatSnuggleDiagnostics(warnings: SnuggleWarning[]) {
  return warnings.map((warning) => {
    const people = warning.assignedPeople?.map((person) => `${person.name} (${person.id})`).join(", ");
    return [warning.kind, warning.itemId, warning.itemName, warning.group, people].filter(Boolean).join(" | ");
  }).join("\n");
}
