import { classifyBoardPeriod, discoverMonthlyBoards } from "./monthlyBoardAudit.ts";
import { auditProfitTracking, shouldWriteMondayProfit, type ProfitTrackingAudit } from "./profitTracking.ts";
import { summarizeMonthlySalesBoard, type MondayBoard, type MondayItem } from "./salesHistoryAudit.ts";

export type MondaySnapshot = {
  organisation_id: string | null;
  year: number;
  month: number;
  quotes_done: number;
  orders_processed: number;
  sales_inbox_enquiries: number;
  converted: number;
  monthly_profit?: number;
  monthly_profit_source?: "monday";
  data_source: "monday";
  monday_sync_metadata: {
    sourceBoardId: string;
    fetchedAt: string;
    validation: Record<string, number>;
    mismatchedDates: Array<Record<string, unknown>>;
    scopeA: { leads: number; converted: number; conversionRate: number };
    profitTracking: ProfitTrackingAudit;
  };
};

export type SyncOutcome = {
  month: number;
  status: "inserted" | "updated" | "skipped" | "rejected" | "future" | "planned-insert" | "planned-update";
  reason?: string;
  snapshot?: MondaySnapshot;
  profitPreview?: ProfitTrackingAudit & { source: "monday" | "epcc_email"; willWrite: boolean; reason?: string };
  boardSelection?: { selectedBoardId: string; rejectedBoardIds: string[] };
};

type SyncInput = {
  year: number;
  months: number[];
  organisationId: string | null;
  boards: MondayBoard[];
  inspectBoard: (boardId: string) => Promise<MondayBoard | undefined>;
  existingMonths: Set<number>;
  collectItems: (boardId: string) => Promise<{ items: MondayItem[] }>;
  now: Date;
  force: boolean;
  apply: boolean;
  fetchedAt?: string;
  write?: (snapshot: MondaySnapshot) => Promise<void>;
};

export async function syncMondaySalesDashboard(input: SyncInput): Promise<SyncOutcome[]> {
  const indexed = await discoverMonthlyBoards(input.year, input.boards, input.inspectBoard, input.now);
  const outcomes: SyncOutcome[] = [];
  for (const month of input.months) {
    const entry = indexed.index[month - 1];
    const period = classifyBoardPeriod(input.year, month, entry?.board?.state, input.now);
    if (period === "future month") {
      outcomes.push({ month, status: "future", reason: "Future month; no board expected." });
      continue;
    }
    if (!entry || entry.status === "missing" || entry.status === "future") {
      outcomes.push({ month, status: "rejected", reason: "Monthly board is unavailable." });
      continue;
    }
    if (entry.status !== "ready" || !entry.board) {
      const issues = entry.structure?.issues.map((issue) => `${issue.code}: ${issue.message}`).join(" ") ?? "No validation details available.";
      outcomes.push({ month, status: "rejected", reason: `Monthly board is structurally invalid. ${issues}` });
      continue;
    }
    const boardSelection = { selectedBoardId: String(entry.board.id), rejectedBoardIds: (entry.rejectedCandidates ?? []).map((candidate) => String(candidate.board.id)) };
    if (period !== "current active month" && !input.force) {
      outcomes.push({ month, status: "skipped", reason: "Historical month protected; use --force after review." });
      continue;
    }

    let collected: { items: MondayItem[] };
    try {
      collected = await input.collectItems(String(entry.board.id));
    } catch {
      outcomes.push({ month, status: "rejected", reason: "Monday board collection failed." });
      continue;
    }
    const fetchedAt = input.fetchedAt ?? new Date().toISOString();
    const summary = summarizeMonthlySalesBoard(entry.board, collected.items, entry.structure?.resolvedColumns);
    const profitTracking = auditProfitTracking(entry.board, collected.items, fetchedAt);
    const willWriteMondayProfit = shouldWriteMondayProfit(input.year, month);
    const profitPreview = {
      ...profitTracking,
      source: willWriteMondayProfit ? "monday" as const : "epcc_email" as const,
      willWrite: willWriteMondayProfit,
      ...(willWriteMondayProfit ? {} : { reason: "Monday profit skipped at the configured EPCC cutoff." }),
    };
    const scopeA = summary.scopes.allLeads.byBoardMembership;
    const scopeB = summary.scopes.salesInboxOnly.byBoardMembership;
    const snapshot: MondaySnapshot = {
      organisation_id: input.organisationId,
      year: input.year,
      month,
      quotes_done: scopeA.totalLeadItems,
      orders_processed: scopeA.convertedItems,
      sales_inbox_enquiries: scopeB.totalLeadItems,
      converted: scopeB.convertedItems,
      data_source: "monday",
      monday_sync_metadata: { sourceBoardId: String(entry.board.id), fetchedAt, validation: summary.validation, mismatchedDates: summary.mismatchedDates, scopeA: { leads: scopeA.totalLeadItems, converted: scopeA.convertedItems, conversionRate: scopeA.conversionRate }, profitTracking },
    };
    if (willWriteMondayProfit && profitTracking.calculatedMonthlyTotal !== null) {
      snapshot.monthly_profit = profitTracking.calculatedMonthlyTotal;
      snapshot.monthly_profit_source = "monday";
    }
    const exists = input.existingMonths.has(month);
    if (!input.apply) {
      outcomes.push({ month, status: exists ? "planned-update" : "planned-insert", snapshot, boardSelection, profitPreview });
      continue;
    }
    try {
      await input.write?.(snapshot);
      outcomes.push({ month, status: exists ? "updated" : "inserted", snapshot, boardSelection, profitPreview });
    } catch {
      outcomes.push({ month, status: "rejected", reason: "Supabase write failed." });
    }
  }
  return outcomes;
}
