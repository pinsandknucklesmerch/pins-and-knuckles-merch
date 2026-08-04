import { unstable_cache } from "next/cache";
import { isDashboardAccountManager, mapMondayMember, type CanonicalMemberKey } from "../domain/memberIdentity";
import { getSnuggleFailureCategory, SnuggleServiceError } from "./snuggleDiagnostics";

const SNUGGLE_BOARD_ID = process.env.MONDAY_SNUGGLE_BOARD_ID?.trim() ?? "";
const SNUGGLE_WORKSPACE_ID = "13775293";
const EXPECTED_BOARD_NAME = "Snuggle Orders";
const PROFIT_COLUMN_ID = "formula_mm008w45";
const ACCOUNT_MANAGER_COLUMN_ID = "person";
const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

type GraphQlResponse<T> = { data?: T; errors?: Array<{ message: string }> };
type Person = { id: string; kind?: string | null; name?: string | null };
type SnuggleItem = {
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
type SnugglePage = { cursor?: string | null; items: SnuggleItem[] };
type SnuggleBoard = { id: string; name: string; workspace?: { id: string } | null; items_page?: SnugglePage };

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
  return (column(item, ACCOUNT_MANAGER_COLUMN_ID)?.persons_and_teams ?? []).filter((person) => !person.kind || person.kind === "person");
}

async function queryMonday<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = process.env.MONDAY_API_TOKEN?.trim();
  if (!token) throw new SnuggleServiceError("missing configuration");
  let response: Response;
  try {
    response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json", "API-Version": "2024-10" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch {
    throw new SnuggleServiceError("GraphQL response failure");
  }
  let payload: GraphQlResponse<T>;
  try {
    payload = await response.json() as GraphQlResponse<T>;
  } catch {
    throw new SnuggleServiceError(response.status === 401 || response.status === 403 ? "authentication failure" : "GraphQL response failure");
  }
  if (response.status === 401 || response.status === 403) throw new SnuggleServiceError("authentication failure");
  if (!response.ok || payload.errors?.length || !payload.data) throw new SnuggleServiceError("GraphQL response failure");
  return payload.data;
}

async function collectItems(): Promise<{ board: SnuggleBoard; items: SnuggleItem[] }> {
  if (!SNUGGLE_BOARD_ID) throw new SnuggleServiceError("missing configuration");
  const boardQuery = `query ($ids: [ID!], $limit: Int!) {
    boards(ids: $ids) {
      id name workspace { id }
      items_page(limit: $limit) { cursor items { id name group { id title } column_values(ids: ["${PROFIT_COLUMN_ID}", "${ACCOUNT_MANAGER_COLUMN_ID}"]) {
        id type text value ... on FormulaValue { display_value } ... on PeopleValue { persons_and_teams { id kind } }
      } } }
    }
  }`;
  const first = await queryMonday<{ boards: SnuggleBoard[] }>(boardQuery, { ids: [SNUGGLE_BOARD_ID], limit: 100 });
  const board = first.boards[0];
  if (!board || board.name.trim().toLocaleLowerCase("en-GB") !== EXPECTED_BOARD_NAME.toLocaleLowerCase("en-GB") || board.workspace?.id !== SNUGGLE_WORKSPACE_ID) {
    throw new SnuggleServiceError("board/workspace validation failure");
  }
  const items = [...(board.items_page?.items ?? [])];
  let cursor = board.items_page?.cursor ?? null;
  while (cursor) {
    const page = await queryMonday<{ next_items_page: SnugglePage }>(`query ($cursor: String!, $limit: Int!) {
      next_items_page(cursor: $cursor, limit: $limit) { cursor items { id name group { id title } column_values(ids: ["${PROFIT_COLUMN_ID}", "${ACCOUNT_MANAGER_COLUMN_ID}"]) {
        id type text value ... on FormulaValue { display_value } ... on PeopleValue { persons_and_teams { id kind } }
      } } }
    }`, { cursor, limit: 100 });
    items.push(...page.next_items_page.items);
    if (cursor === page.next_items_page.cursor && !page.next_items_page.items.length) throw new SnuggleServiceError("GraphQL response failure");
    cursor = page.next_items_page.cursor ?? null;
  }
  return { board, items };
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
    const profitValue = column(item, PROFIT_COLUMN_ID)?.display_value;
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

async function loadSnuggleProfit(): Promise<SnuggleProfitData> {
  const data = aggregateSnuggleProfit(await collectItems());
  if (data.error) throw new SnuggleServiceError("board/workspace validation failure");
  const invalidFormulaCount = data.warnings.filter((warning) => warning.kind === "invalid-profit").length;
  if (invalidFormulaCount > 0) console.warn("Snuggle data quality warning", { category: "invalid FormulaValue response", count: invalidFormulaCount });
  return data;
}

const cachedSnuggleProfit = unstable_cache(loadSnuggleProfit, ["sales-dashboard-snuggle-profit", SNUGGLE_BOARD_ID], { revalidate: 600 });
export async function getSnuggleProfit(): Promise<SnuggleProfitData> {
  try {
    return await cachedSnuggleProfit();
  } catch (error) {
    console.error("Snuggle profit load failed", { category: getSnuggleFailureCategory(error) });
    return { months: [], members: [], warnings: [], error: "Snuggle profit is currently unavailable." };
  }
}
