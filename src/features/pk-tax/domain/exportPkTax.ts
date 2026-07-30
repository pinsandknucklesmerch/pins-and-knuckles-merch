import type { PkTaxResult } from "./types.ts";

const money = (value: number) => `£${value.toFixed(2)}`;
const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

export function formatPkTaxExport(result: PkTaxResult) {
  const lines = [
    "PK Tax Summary",
    "",
    "Fixed allocations",
    `- EPCC (40%): ${money(result.epccAllocation)}`,
    `- Admin (10%): ${money(result.adminAllocation)}`,
    `- Marketing (5%): ${money(result.marketingAllocation)}`,
    `- Ops (5%): ${money(result.operationsAllocation)}`,
    `- Johan (40%): ${money(result.johanAllocation)}`,
    "",
    "PK pool",
    `- Sales-team PK Tax contribution: ${money(result.salesTeamContribution)}`,
    `- Snuggle contribution: ${money(result.snuggleContribution)}`,
    `- Total PK pool: ${money(result.poolTotal)}`,
    "",
    "Weighted allocations",
    ...result.recipientAllocations.flatMap((allocation) => [
      `- ${allocation.person}`,
      `  Company profit share: ${percent(allocation.metricShares.companyProfit)}`,
      `  Snuggle profit share: ${percent(allocation.metricShares.snuggleProfit)}`,
      `  PK Tax share: ${percent(allocation.metricShares.pkTax)}`,
      `  Orders share: ${percent(allocation.metricShares.ordersHandled)}`,
      `  Final weighted score: ${percent(allocation.weightedScore)}`,
      `  Pool allocation: ${allocation.amount === null ? "Not calculated" : money(allocation.amount)}`,
    ]),
  ];

  return lines.join("\n");
}
