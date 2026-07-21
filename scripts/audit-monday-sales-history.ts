import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MondayClient, dateCoverage, normalizeBoard, sampleItem, unresolvedMappingReport } from "./lib/monday/salesHistoryAudit.ts";

const output = "docs/imports/monday-sales-history";
function option(args: string[], name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }
function boardId(args: string[]) { const id = option(args, "--board-id") ?? process.env.MONDAY_SALES_BOARD_ID ?? process.env.MONDAY_QUOTES_BOARD_ID ?? process.env.MONDAY_ORDERS_BOARD_ID; if (!id) throw new Error("--board-id is required (or set a MONDAY_*_BOARD_ID server-only variable)."); return id; }
function client() { return new MondayClient(process.env.MONDAY_API_TOKEN ?? ""); }
async function writeJson(name: string, value: unknown) { await mkdir(resolve(output), { recursive: true }); await writeFile(resolve(output, name), `${JSON.stringify(value, null, 2)}\n`); }
async function main() {
  const [command = "help", ...args] = process.argv.slice(2); const monday = client();
  if (command === "boards") { const boards = (await monday.listBoards()).map(normalizeBoard); console.log(JSON.stringify(boards, null, 2)); return; }
  const id = boardId(args); const board = await monday.inspectBoard(id); if (!board) throw new Error(`Board ${id} was not found or is not accessible.`);
  if (command === "inspect" || command === "columns") { console.log(JSON.stringify(normalizeBoard(board), null, 2)); return; }
  const limit = Math.max(1, Math.min(Number(option(args, "--limit") ?? 20), 2_000)); const collected = await monday.collectItems(id, limit);
  if (command === "sample") { console.log(JSON.stringify({ board: normalizeBoard(board), sampleItems: collected.items.map(sampleItem), paginationRequired: collected.truncated }, null, 2)); return; }
  const coverage = dateCoverage(collected.items, option(args, "--date-column-id"));
  if (command === "coverage") { console.log(JSON.stringify({ boardId: id, ...coverage, paginationRequired: collected.truncated, note: "Use --date-column-id only after mapping review; otherwise this uses created_at." }, null, 2)); return; }
  if (command === "report") { const normalized = normalizeBoard(board); const inventory = { ...normalized, sampledActiveItemCount: collected.items.length, activeItemCount: collected.truncated ? null : collected.items.length, archivedItemAvailability: "unverified: this audit does not assume archived items are accessible", paginationRequired: collected.truncated }; await Promise.all([writeJson("boards.json", [inventory]), writeJson(`column-map-${id}.json`, normalized), writeJson(`sample-items-${id}.json`, { boardId: id, items: collected.items.map(sampleItem), paginationRequired: collected.truncated }), writeJson(`date-coverage-${id}.json`, { boardId: id, ...coverage, paginationRequired: collected.truncated }), writeJson("unresolved-mapping-report.json", unresolvedMappingReport(board))]); console.log(`Wrote read-only discovery report to ${output}`); return; }
  throw new Error("Use boards, inspect, columns, sample, coverage, or report.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
