export type MondayColumn = { id: string; title: string; type: string; settings_str?: string | null };
export type MondayItem = { id: string; name: string; created_at?: string | null; updated_at?: string | null; group?: { id: string; title: string } | null; column_values?: Array<{ id: string; text?: string | null; value?: string | null; type?: string | null }> };
export type MondayBoard = { id: string; name: string; state?: string | null; board_kind?: string | null; workspace?: { id: string; name: string } | null; groups?: Array<{ id: string; title: string }> | null; columns?: MondayColumn[] | null; items_page?: { cursor?: string | null; items?: MondayItem[] } | null };
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

export const MONTHLY_SALES_COLUMNS = { people: "people", channel: "status_16", dateInTouch: "date8", converted: "status" } as const;
const weeklyGroup = /^week\s+[1-4]$/i;
type Person = { id: string | null; name: string; normalizedName: string };
type SummaryItem = { item: MondayItem; people: Person[]; channel: string | null; channelNormalized: string; converted: boolean; date: string | null; dateMatchesBoardMonth: boolean };
type Month = { year: number; month: number; label: string };

function column(item: MondayItem, id: string) { return item.column_values?.find((value) => value.id === id); }
function boardMonth(name: string): Month | null {
  const match = name.trim().match(/^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})$/i); if (!match) return null;
  const month = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(match[1].toLowerCase()) + 1;
  return { year: Number(match[2]), month, label: `${match[1].toUpperCase()} ${match[2]}` };
}
function people(value: { text?: string | null; value?: string | null } | undefined): Person[] {
  const textNames = (value?.text ?? "").split(/\s*,\s*/).map((name) => name.trim()).filter(Boolean);
  let ids: string[] = []; try { ids = (JSON.parse(value?.value ?? "{}") as { personsAndTeams?: Array<{ id: string | number; kind?: string }> }).personsAndTeams?.filter((person) => !person.kind || person.kind === "person").map((person) => String(person.id)) ?? []; } catch { /* Text remains useful even if Monday supplies malformed People JSON. */ }
  return textNames.map((name, index) => ({ id: ids[index] ?? null, name, normalizedName: normalizeStatus(name) }));
}
function rate(converted: number, leads: number) { return leads === 0 ? 0 : Math.round((converted / leads) * 1000) / 10; }
function aggregate(items: SummaryItem[]) {
  const members = new Map<string, { displayName: string; mondayUserIds: string[]; leads: number; converted: number }>(); const channels = new Map<string, { displayLabel: string; leads: number; converted: number }>(); let blankChannelCount = 0; let blankAccountManagerCount = 0;
  for (const entry of items) {
    if (!entry.channelNormalized) blankChannelCount += 1; else { const current = channels.get(entry.channelNormalized) ?? { displayLabel: entry.channel ?? "", leads: 0, converted: 0 }; current.leads += 1; if (entry.converted) current.converted += 1; channels.set(entry.channelNormalized, current); }
    if (!entry.people.length) blankAccountManagerCount += 1;
    // Company and channel totals include every item. Member metrics only include exactly one owner.
    if (entry.people.length !== 1) continue;
    const person = entry.people[0]; const current = members.get(person.normalizedName) ?? { displayName: person.name, mondayUserIds: [], leads: 0, converted: 0 }; if (person.id && !current.mondayUserIds.includes(person.id)) current.mondayUserIds.push(person.id); current.leads += 1; if (entry.converted) current.converted += 1; members.set(person.normalizedName, current);
  }
  const memberRows = [...members.values()].map((member) => ({ ...member, mondayUserIds: member.mondayUserIds.sort(), conversionRate: rate(member.converted, member.leads) })).sort((a, b) => a.displayName.localeCompare(b.displayName));
  const channelRows = [...channels.values()].map((channel) => ({ ...channel, conversionRate: rate(channel.converted, channel.leads) })).sort((a, b) => a.displayLabel.localeCompare(b.displayLabel)); const converted = items.filter((item) => item.converted).length;
  return { totalLeadItems: items.length, convertedItems: converted, conversionRate: rate(converted, items.length), byAccountManager: memberRows, byChannel: channelRows, blankChannelCount, blankAccountManagerCount };
}
export function summarizeMonthlySalesBoard(board: Pick<MondayBoard, "id" | "name">, items: MondayItem[], resolvedColumns: Partial<typeof MONTHLY_SALES_COLUMNS> = {}) {
  const columns = { ...MONTHLY_SALES_COLUMNS, ...resolvedColumns };
  const expectedMonth = boardMonth(board.name); const excludedItems: Array<{ id: string; name: string; group: string | null; reason: string }> = []; const included: SummaryItem[] = [];
  for (const item of items) {
    const group = item.group?.title ?? null; if (!group || !weeklyGroup.test(group)) { excludedItems.push({ id: String(item.id), name: item.name, group, reason: group?.toLowerCase() === "profit tracking" ? "profit-tracking-group" : "non-weekly-group" }); continue; }
    const date = parseMondayDate(column(item, columns.dateInTouch)?.text ?? column(item, columns.dateInTouch)?.value); const dateMatchesBoardMonth = Boolean(date && expectedMonth && date.startsWith(`${expectedMonth.year}-${String(expectedMonth.month).padStart(2, "0")}-`));
    included.push({ item, people: people(column(item, columns.people)), channel: column(item, columns.channel)?.text?.trim() || null, channelNormalized: normalizeStatus(column(item, columns.channel)?.text), converted: normalizeStatus(column(item, columns.converted)?.text) === "yes", date, dateMatchesBoardMonth });
  }
  const validDates = included.filter((item) => item.dateMatchesBoardMonth); const salesInbox = (rows: SummaryItem[]) => rows.filter((item) => item.channelNormalized === "sales inbox"); const multiAccountManagers = included.filter((item) => item.people.length > 1).map((item) => ({ id: String(item.item.id), name: item.item.name, converted: item.converted, accountManagers: item.people }));
  const missingDates = included.filter((item) => !item.date).map((item) => ({ id: String(item.item.id), name: item.item.name, group: item.item.group?.title ?? null })); const mismatchedDates = included.filter((item) => item.date && !item.dateMatchesBoardMonth).map((item) => ({ sourceBoardId: String(board.id), sourceBoardMonth: expectedMonth?.label ?? board.name, itemId: String(item.item.id), itemName: item.item.name, group: item.item.group?.title ?? null, actualDateInTouch: item.date, includedInBoardMembershipTotals: true, includedInValidDateTotals: false, action: "review-in-monday" as const }));
  const multiManagerConvertedCount = multiAccountManagers.filter((item) => item.converted).length;
  return { board: { id: String(board.id), name: board.name, inferredMonth: expectedMonth }, fetch: { totalItemsFetched: items.length, includedWeeklyItems: included.length, excludedItems: excludedItems.length, deletedItems: "not returned by Monday item queries", inaccessibleItems: "not returned by Monday item queries", subitems: "not requested or included; Monday top-level item query only" }, scopes: { allLeads: { byBoardMembership: aggregate(included), byValidDateInTouchMonth: aggregate(validDates) }, salesInboxOnly: { byBoardMembership: aggregate(salesInbox(included)), byValidDateInTouchMonth: aggregate(salesInbox(validDates)) } }, validation: { missingDateCount: missingDates.length, mismatchedDateCount: mismatchedDates.length, validDateInTouchMonthCount: validDates.length, multiManagerItemCount: multiAccountManagers.length, multiManagerConvertedCount, excludedFromMemberMetricsCount: multiAccountManagers.length, blankAccountManagerItemCount: included.filter((item) => !item.people.length).length }, excludedItems, missingDates, mismatchedDates, multiAccountManagers };
}

export class MondayClient {
  private token: string;
  private request: typeof fetch;
  constructor(token: string, request: typeof fetch = fetch) { this.token = token; this.request = request; if (!token) throw new Error("MONDAY_API_TOKEN is required. Set it in your server-only shell environment; never use NEXT_PUBLIC_ variables."); }
  async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    assertReadOnlyQuery(query);
    let response: Response | null = null; let networkError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) { try { response = await this.request("https://api.monday.com/v2", { method: "POST", headers: { Authorization: this.token, "Content-Type": "application/json", "API-Version": "2024-10" }, body: JSON.stringify({ query, variables }) }); } catch (error) { networkError = error; } if (response && ![429, 502, 503].includes(response.status)) break; if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1))); }
    if (!response) throw new Error(`Monday API network request failed after 3 attempts: ${networkError instanceof Error ? networkError.message : "unknown error"}`);
    if (response.status === 429) throw new Error(`Monday API rate limit reached after 3 attempts. Retry after ${response.headers.get("retry-after") ?? "the provider's indicated delay"}.`);
    let payload: GraphQlResponse<T>; try { payload = await response.json() as GraphQlResponse<T>; } catch { throw new Error(`Monday API returned invalid JSON (HTTP ${response.status}).`); }
    if (!response.ok) throw new Error(`Monday API request failed (HTTP ${response.status}): ${payload.errors?.map((error) => error.message).join("; ") ?? "unknown error"}`);
    if (payload.errors?.length) throw new Error(`Monday GraphQL error: ${payload.errors.map((error) => error.message).join("; ")}`);
    if (!payload.data) throw new Error("Monday API response did not contain data.");
    return payload.data;
  }
  async listBoards() { return (await this.query<{ boards: MondayBoard[] }>("query { boards(limit: 100) { id name state board_kind workspace { id name } } } ")).boards; }
  async listAllBoards(maxPages = 100) { const boards: MondayBoard[] = []; for (let page = 1; page <= maxPages; page += 1) { const data = await this.query<{ boards: MondayBoard[] }>("query ($page: Int!) { boards(limit: 100, page: $page) { id name state board_kind workspace { id name } } }", { page }); boards.push(...data.boards); if (data.boards.length < 100) return boards; } throw new Error(`Monday board listing exceeded ${maxPages} pages.`); }
  async inspectBoard(boardId: string) { return (await this.query<{ boards: MondayBoard[] }>("query ($ids: [ID!]) { boards(ids: $ids) { id name state board_kind workspace { id name } groups { id title } columns { id title type settings_str } } }", { ids: [boardId] })).boards[0]; }
  async pageItems(boardId: string, cursor?: string | null, limit = 100) {
    const query = cursor ? "query ($cursor: String!, $limit: Int!) { next_items_page(cursor: $cursor, limit: $limit) { cursor items { id name created_at updated_at group { id title } column_values { id type text value } } } }" : "query ($ids: [ID!], $limit: Int!) { boards(ids: $ids) { items_page(limit: $limit) { cursor items { id name created_at updated_at group { id title } column_values { id type text value } } } } }";
    const data = await this.query<{ next_items_page?: { cursor?: string | null; items: MondayItem[] }; boards?: MondayBoard[] }>(query, cursor ? { cursor, limit } : { ids: [boardId], limit });
    const page = cursor ? data.next_items_page : data.boards?.[0]?.items_page;
    if (!page) throw new Error("Monday API response did not include an item page.");
    return page;
  }
  async collectItems(boardId: string, maxItems = Number.POSITIVE_INFINITY) { const items: MondayItem[] = []; let cursor: string | null | undefined; do { const page = await this.pageItems(boardId, cursor, Math.min(100, maxItems - items.length)); items.push(...(page.items ?? [])); cursor = page.cursor; if (cursor && !(page.items?.length)) throw new Error("Monday API returned a pagination cursor with no items; stopped to avoid an infinite loop."); } while (cursor && items.length < maxItems); return { items, cursor, truncated: Boolean(cursor) }; }
}

export function unresolvedMappingReport(board?: MondayBoard) { const columns = board?.columns ?? []; const find = (types: string[]) => columns.filter((column) => types.includes(column.type)).map((column) => ({ id: column.id, title: column.title, type: column.type })); return { status: "unresolved", decisions: ["Identify the Sales Inbox board and its enquiry date column.", "Confirm Converted status label and whether a historical conversion date exists.", "Confirm quote and order completion semantics, exclusions, and attribution dates.", "Confirm people ownership/reassignment history and member aliases.", "Profit is intentionally excluded: it will come from EPCC Gmail report emails."], candidateColumns: { status: find(["status", "color"]), dates: find(["date", "creation_log", "last_updated"]), people: find(["people", "person", "multiple-person"]), connected: find(["board-relation", "mirror"]) }, historicalAccuracy: "Unverified. Current Monday values must not be treated as historical event data until dates and status history are reviewed." }; }
