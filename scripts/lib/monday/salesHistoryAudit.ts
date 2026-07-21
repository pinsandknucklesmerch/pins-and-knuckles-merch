export type MondayColumn = { id: string; title: string; type: string; settings_str?: string | null };
export type MondayItem = { id: string; name: string; created_at?: string | null; updated_at?: string | null; group?: { id: string; title: string } | null; column_values?: Array<{ id: string; text?: string | null; value?: string | null; type?: string | null }> };
export type MondayBoard = { id: string; name: string; state?: string | null; workspace?: { id: string; name: string } | null; groups?: Array<{ id: string; title: string }> | null; columns?: MondayColumn[] | null; items_page?: { cursor?: string | null; items?: MondayItem[] } | null };
export type GraphQlResponse<T> = { data?: T; errors?: Array<{ message: string; extensions?: { code?: string; status_code?: number } }> };

const mutation = /\b(mutation|create_|update_|delete_|archive_|duplicate_|move_|change_)\b/i;
export function assertReadOnlyQuery(query: string) { if (mutation.test(query)) throw new Error("Monday audit only permits read-only GraphQL queries."); }
export function redactToken(value: string) { return value ? "[REDACTED]" : value; }
export function normalizeStatus(value: string | null | undefined) { return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase(); }
export function normalizePeople(value: string | null | undefined) {
  if (!value) return [] as Array<{ id: string; name: string }>;
  try { const parsed = JSON.parse(value) as { personsAndTeams?: Array<{ id: number | string; kind?: string }> }; return (parsed.personsAndTeams ?? []).filter((person) => !person.kind || person.kind === "person").map((person) => ({ id: String(person.id), name: "" })); } catch { return []; }
}
export function parseMondayDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = value.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (!candidate || Number.isNaN(Date.parse(`${candidate}T00:00:00Z`))) return null;
  return candidate;
}
export function dateCoverage(items: MondayItem[], dateColumnId?: string) {
  const dates = items.map((item) => dateColumnId ? item.column_values?.find((column) => column.id === dateColumnId)?.text ?? null : item.created_at ?? null).map(parseMondayDate).filter((date): date is string => Boolean(date)).sort();
  return { earliestUsableItemDate: dates[0] ?? null, latestUsableItemDate: dates.at(-1) ?? null, datedItemCount: dates.length, undatedItemCount: items.length - dates.length };
}
export function normalizeBoard(board: MondayBoard) { return { id: String(board.id), name: board.name, state: board.state ?? null, workspace: board.workspace ? { id: String(board.workspace.id), name: board.workspace.name } : null, groups: (board.groups ?? []).map((group) => ({ id: String(group.id), title: group.title })), columns: (board.columns ?? []).map((column) => ({ id: column.id, title: column.title, type: column.type, settings: column.settings_str ?? null })) }; }
export function sampleItem(item: MondayItem) { return { id: String(item.id), name: item.name, createdAt: item.created_at ?? null, updatedAt: item.updated_at ?? null, group: item.group ? { id: String(item.group.id), title: item.group.title } : null, columnValues: (item.column_values ?? []).map((column) => ({ id: column.id, type: column.type ?? null, text: column.text ?? null, value: column.value ?? null })) }; }

export class MondayClient {
  private token: string;
  private request: typeof fetch;
  constructor(token: string, request: typeof fetch = fetch) { this.token = token; this.request = request; if (!token) throw new Error("MONDAY_API_TOKEN is required. Set it in your server-only shell environment; never use NEXT_PUBLIC_ variables."); }
  async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    assertReadOnlyQuery(query);
    let response: Response;
    try { response = await this.request("https://api.monday.com/v2", { method: "POST", headers: { Authorization: this.token, "Content-Type": "application/json", "API-Version": "2024-10" }, body: JSON.stringify({ query, variables }) }); } catch (error) { throw new Error(`Monday API network request failed: ${error instanceof Error ? error.message : "unknown error"}`); }
    if (response.status === 429) throw new Error(`Monday API rate limit reached. Retry after ${response.headers.get("retry-after") ?? "the provider's indicated delay"}.`);
    let payload: GraphQlResponse<T>; try { payload = await response.json() as GraphQlResponse<T>; } catch { throw new Error(`Monday API returned invalid JSON (HTTP ${response.status}).`); }
    if (!response.ok) throw new Error(`Monday API request failed (HTTP ${response.status}): ${payload.errors?.map((error) => error.message).join("; ") ?? "unknown error"}`);
    if (payload.errors?.length) throw new Error(`Monday GraphQL error: ${payload.errors.map((error) => error.message).join("; ")}`);
    if (!payload.data) throw new Error("Monday API response did not contain data.");
    return payload.data;
  }
  async listBoards() { return (await this.query<{ boards: MondayBoard[] }>("query { boards(limit: 100) { id name state workspace { id name } } } ")).boards; }
  async inspectBoard(boardId: string) { return (await this.query<{ boards: MondayBoard[] }>("query ($ids: [ID!]) { boards(ids: $ids) { id name state workspace { id name } groups { id title } columns { id title type settings_str } } }", { ids: [boardId] })).boards[0]; }
  async pageItems(boardId: string, cursor?: string | null, limit = 100) {
    const query = cursor ? "query ($cursor: String!, $limit: Int!) { next_items_page(cursor: $cursor, limit: $limit) { cursor items { id name created_at updated_at group { id title } column_values { id type text value } } } }" : "query ($ids: [ID!], $limit: Int!) { boards(ids: $ids) { items_page(limit: $limit) { cursor items { id name created_at updated_at group { id title } column_values { id type text value } } } } }";
    const data = await this.query<{ next_items_page?: { cursor?: string | null; items: MondayItem[] }; boards?: MondayBoard[] }>(query, cursor ? { cursor, limit } : { ids: [boardId], limit });
    const page = cursor ? data.next_items_page : data.boards?.[0]?.items_page;
    if (!page) throw new Error("Monday API response did not include an item page.");
    return page;
  }
  async collectItems(boardId: string, maxItems = 2_000) { const items: MondayItem[] = []; let cursor: string | null | undefined; do { const page = await this.pageItems(boardId, cursor, Math.min(100, maxItems - items.length)); items.push(...(page.items ?? [])); cursor = page.cursor; } while (cursor && items.length < maxItems); return { items, cursor, truncated: Boolean(cursor) }; }
}

export function unresolvedMappingReport(board?: MondayBoard) { const columns = board?.columns ?? []; const find = (types: string[]) => columns.filter((column) => types.includes(column.type)).map((column) => ({ id: column.id, title: column.title, type: column.type })); return { status: "unresolved", decisions: ["Identify the Sales Inbox board and its enquiry date column.", "Confirm Converted status label and whether a historical conversion date exists.", "Confirm quote and order completion semantics, exclusions, and attribution dates.", "Confirm people ownership/reassignment history and member aliases.", "Profit is intentionally excluded: it will come from EPCC Gmail report emails."], candidateColumns: { status: find(["status", "color"]), dates: find(["date", "creation_log", "last_updated"]), people: find(["people", "person", "multiple-person"]), connected: find(["board-relation", "mirror"]) }, historicalAccuracy: "Unverified. Current Monday values must not be treated as historical event data until dates and status history are reviewed." }; }
