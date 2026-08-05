import { unstable_cache } from "next/cache";
import { getSnuggleFailureCategory, SnuggleServiceError } from "./snuggleDiagnostics";
import { aggregateSnuggleProfit, type SnuggleBoard, type SnuggleItem, type SnuggleProfitData } from "../lib/snuggleProfit";

export { aggregateSnuggleProfit, parseCompletedSnuggleGroup } from "../lib/snuggleProfit";
export type { Person, SnuggleBoard, SnuggleItem, SnuggleMemberTotals, SnuggleMonth, SnuggleProfitData, SnuggleWarning } from "../lib/snuggleProfit";

const SNUGGLE_BOARD_ID = process.env.MONDAY_SNUGGLE_BOARD_ID?.trim() ?? "";
const SNUGGLE_WORKSPACE_ID = "13775293";
const EXPECTED_BOARD_NAME = "Snuggle Orders";
const PROFIT_COLUMN_ID = "formula_mm008w45";
const ACCOUNT_MANAGER_COLUMN_ID = "person";

type GraphQlResponse<T> = { data?: T; errors?: Array<{ message: string }> };
type SnugglePage = { cursor?: string | null; items: SnuggleItem[] };

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
