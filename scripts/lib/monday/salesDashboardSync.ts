import { classifyBoardPeriod, discoverMonthlyBoards } from "./monthlyBoardAudit.ts";
import { auditProfitTracking, shouldWriteMondayProfit, type ProfitTrackingAudit } from "./profitTracking.ts";
import { summarizeMonthlySalesBoard, type MondayBoard, type MondayItem } from "./salesHistoryAudit.ts";
import type { MemberClassification } from "../../../src/features/sales-dashboard/domain/memberIdentity.ts";
import { canonicalMemberIdentities } from "../../../src/features/sales-dashboard/domain/memberIdentity.ts";

export type MondayMemberSnapshot = {
  organisation_id: string | null;
  year: number;
  month: number;
  team_member_key: string;
  team_member_name: string;
  member_classification: MemberClassification;
  quotes_done: number;
  orders_processed: number;
  monday_source_metadata: {
    sourceBoardId: string;
    reportingPeriod: { year: number; month: number };
    includedItemCount: number;
    dateInTouchCount: number;
    createdAtFallbackCount: number;
    excludedItemCount: number;
    multiAssigneeItemCount: number;
    unassignedItemCount: number;
    unmappedItemCount: number;
    sourcePeople: Array<{ id: string | null; name: string }>;
  };
};

export type MondayMemberWritePayload = Pick<MondayMemberSnapshot, "quotes_done" | "orders_processed" | "monday_source_metadata">;

/** This patch deliberately excludes every EPCC-owned member field. */
export function mondayMemberWritePayload(snapshot: MondayMemberSnapshot): MondayMemberWritePayload {
  return {
    quotes_done: snapshot.quotes_done,
    orders_processed: snapshot.orders_processed,
    monday_source_metadata: snapshot.monday_source_metadata,
  };
}

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
  memberSnapshots: MondayMemberSnapshot[];
  data_source: "monday";
  monday_sync_metadata: {
    sourceBoardId: string;
    fetchedAt: string;
    validation: Record<string, number>;
    dateSourceCounts: { date_in_touch: number; created_at_fallback: number };
    reportingPeriod?: { year: number; month: number };
    quotesDone?: number;
    ordersProcessed?: number;
    trigger?: "cron";
    mismatchedDates: Array<Record<string, unknown>>;
    scopeA: { leads: number; converted: number; conversionRate: number };
    profitTracking: ProfitTrackingAudit;
  };
};

export type MondaySalesWritePayload = Pick<MondaySnapshot, "organisation_id" | "year" | "month" | "quotes_done" | "orders_processed" | "sales_inbox_enquiries" | "converted" | "monday_sync_metadata"> & {
  monthly_profit?: number;
  monthly_profit_source?: "monday";
};

function completeMondayMemberSnapshots(snapshots: MondayMemberSnapshot[], organisationId: string | null, year: number, month: number, sourceBoardId: string): MondayMemberSnapshot[] {
  const byKey = new Map(snapshots.map((snapshot) => [snapshot.team_member_key, snapshot]));
  return canonicalMemberIdentities().map((member) => byKey.get(member.key) ?? {
    organisation_id: organisationId,
    year,
    month,
    team_member_key: member.key,
    team_member_name: member.displayName,
    member_classification: member.classification,
    quotes_done: 0,
    orders_processed: 0,
    monday_source_metadata: {
      sourceBoardId,
      reportingPeriod: { year, month },
      includedItemCount: 0,
      dateInTouchCount: 0,
      createdAtFallbackCount: 0,
      excludedItemCount: 0,
      multiAssigneeItemCount: 0,
      unassignedItemCount: 0,
      unmappedItemCount: 0,
      sourcePeople: [],
    },
  });
}

/** A patch payload deliberately omits unavailable profit fields so existing values survive. */
export function mondaySalesWritePayload(snapshot: MondaySnapshot): MondaySalesWritePayload {
  const payload: MondaySalesWritePayload = {
    organisation_id: snapshot.organisation_id,
    year: snapshot.year,
    month: snapshot.month,
    quotes_done: snapshot.quotes_done,
    orders_processed: snapshot.orders_processed,
    sales_inbox_enquiries: snapshot.sales_inbox_enquiries,
    converted: snapshot.converted,
    monday_sync_metadata: snapshot.monday_sync_metadata,
  };
  if (!shouldWriteMondayProfit(snapshot.year, snapshot.month)) {
    return payload;
  }
  return {
    ...payload,
    ...(snapshot.monthly_profit === undefined ? {} : { monthly_profit: snapshot.monthly_profit }),
    ...(snapshot.monthly_profit_source === undefined ? {} : { monthly_profit_source: snapshot.monthly_profit_source }),
  };
}

export type SyncOutcome = {
  month: number;
  status: "inserted" | "updated" | "skipped" | "rejected" | "future" | "planned-insert" | "planned-update";
  reason?: string;
  snapshot?: MondaySnapshot;
  profitPreview?: ProfitTrackingAudit & { source: "monday" | "epcc_email"; willWrite: boolean; reason?: string };
  boardSelection?: { selectedBoardId: string; rejectedBoardIds: string[] };
  audit?: {
    resolvedWeeklyGroups: Array<{ id: string; title: string }>;
    resolvedColumns: Record<string, string>;
    validation: Record<string, number>;
    dateSourceCounts: { date_in_touch: number; created_at_fallback: number };
    missingDates: Array<Record<string, unknown>>;
    mismatchedDates: Array<Record<string, unknown>>;
    multiAccountManagers: Array<Record<string, unknown>>;
    safety: { safe: boolean; reasons: string[] };
  };
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
  trigger?: "cron";
  fetchedAt?: string;
  write?: (snapshot: MondaySnapshot, exists: boolean) => Promise<void>;
  writeMembers?: (snapshots: MondayMemberSnapshot[]) => Promise<void>;
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
    if (input.apply && period !== "current active month" && !input.force && input.trigger !== "cron") {
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
    const safetyReasons: string[] = [];
    if (summary.validation.missingDateCount) safetyReasons.push(`${summary.validation.missingDateCount} weekly item(s) have no valid reporting date.`);
    if (summary.validation.blankAccountManagerItemCount) safetyReasons.push(`${summary.validation.blankAccountManagerItemCount} weekly item(s) have no account manager.`);
    if (summary.validation.blankChannelItemCount) safetyReasons.push(`${summary.validation.blankChannelItemCount} weekly item(s) have no channel.`);
    if (profitTracking.excludedRows.some((row) => row.reason === "invalid-profit")) safetyReasons.push("Profit Tracking contains invalid profit values.");
    const audit = {
      resolvedWeeklyGroups: (entry.board.groups ?? []).filter((group) => /^week\s+[1-5]$/i.test(group.title)).map((group) => ({ id: String(group.id), title: group.title })),
      resolvedColumns: entry.structure.resolvedColumns,
      validation: summary.validation,
      dateSourceCounts: summary.dateSourceCounts,
      missingDates: summary.missingDates,
      mismatchedDates: summary.mismatchedDates,
      multiAccountManagers: summary.multiAccountManagers,
      safety: { safe: safetyReasons.length === 0, reasons: safetyReasons },
    };
    const willWriteMondayProfit = shouldWriteMondayProfit(input.year, month);
    const profitPreview = {
      ...profitTracking,
      source: willWriteMondayProfit ? "monday" as const : "epcc_email" as const,
      willWrite: willWriteMondayProfit,
      ...(willWriteMondayProfit ? {} : { reason: "Monday profit skipped at the configured EPCC cutoff." }),
    };
    const scopeA = summary.scopes.allLeads.byBoardMembership;
    const scopeB = summary.scopes.salesInboxOnly.byBoardMembership;
    const observedMemberSnapshots = summary.memberKpiRows.map((member) => ({
      organisation_id: input.organisationId,
      year: input.year,
      month,
      team_member_key: member.teamMemberKey,
      team_member_name: member.teamMemberName,
      member_classification: member.memberClassification,
      quotes_done: member.quotesDone,
      orders_processed: member.ordersProcessed,
      monday_source_metadata: {
        sourceBoardId: String(entry.board.id), reportingPeriod: { year: input.year, month },
        includedItemCount: member.includedItemCount, dateInTouchCount: member.dateInTouchCount,
        createdAtFallbackCount: member.createdAtFallbackCount, excludedItemCount: summary.fetch.excludedItems,
        multiAssigneeItemCount: member.multiAssigneeItemCount, unassignedItemCount: member.unassignedItemCount,
        unmappedItemCount: member.unmappedItemCount, sourcePeople: member.sourcePeople,
      },
    }));
    const memberSnapshots = completeMondayMemberSnapshots(observedMemberSnapshots, input.organisationId, input.year, month, String(entry.board.id));
    const snapshot: MondaySnapshot = {
      organisation_id: input.organisationId,
      year: input.year,
      month,
      quotes_done: scopeA.totalLeadItems,
      orders_processed: scopeA.convertedItems,
      sales_inbox_enquiries: scopeB.totalLeadItems,
      converted: scopeB.convertedItems,
      data_source: "monday",
      memberSnapshots,
      monday_sync_metadata: { sourceBoardId: String(entry.board.id), fetchedAt, validation: summary.validation, dateSourceCounts: summary.dateSourceCounts, mismatchedDates: summary.mismatchedDates, scopeA: { leads: scopeA.totalLeadItems, converted: scopeA.convertedItems, conversionRate: scopeA.conversionRate }, profitTracking, ...(input.trigger === "cron" ? { reportingPeriod: { year: input.year, month }, quotesDone: scopeA.totalLeadItems, ordersProcessed: scopeA.convertedItems, trigger: "cron" as const } : {}) },
    };
    if (willWriteMondayProfit && profitTracking.calculatedMonthlyTotal !== null) {
      snapshot.monthly_profit = profitTracking.calculatedMonthlyTotal;
      snapshot.monthly_profit_source = "monday";
    }
    const exists = input.existingMonths.has(month);
    if (!input.apply) {
      outcomes.push({ month, status: exists ? "planned-update" : "planned-insert", snapshot, boardSelection, profitPreview, audit });
      continue;
    }
    if (!audit.safety.safe) {
      outcomes.push({ month, status: "rejected", reason: `Unsafe historical import: ${audit.safety.reasons.join(" ")}`, snapshot, boardSelection, profitPreview, audit });
      continue;
    }
    try {
      await input.write?.(snapshot, exists);
    } catch {
      outcomes.push({ month, status: "rejected", reason: "Supabase company KPI write failed." });
      continue;
    }
    try {
      await input.writeMembers?.(snapshot.memberSnapshots);
      outcomes.push({ month, status: exists ? "updated" : "inserted", snapshot, boardSelection, profitPreview, audit });
    } catch {
      outcomes.push({ month, status: "rejected", reason: "Supabase member KPI write failed." });
    }
  }
  return outcomes;
}
