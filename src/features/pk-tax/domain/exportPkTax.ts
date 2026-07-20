import type { PkTaxResult } from "./types.ts";

const money = (value: number) => `£${value.toFixed(2)}`;
const percent = (value: number) => `${(value * 100).toFixed(0)}%`;

export function formatPkTaxExport(result: PkTaxResult) {
  const lines = [
    "PK Tax Summary",
    "",
    "Inputs",
    ...Object.entries(result.inputs).map(([person, value]) => `- ${person}: ${money(value)}`),
    "",
    "Allocations",
    `- EPCC (${percent(0.4)}): ${money(result.epccAllocation)}`,
    `- Johan (${percent(0.4)}): ${money(result.johanAllocation)}`,
    ...result.contributions.map(
      (contribution) => `- ${contribution.person} contribution (${percent(contribution.rate)}): ${money(contribution.amount)}`,
    ),
    `- Pool total: ${money(result.poolTotal)}`,
    ...result.recipientAllocations.map(
      (allocation) => `- ${allocation.person} pool allocation: ${money(allocation.amount)}`,
    ),
    `- Admin (${percent(0.1)}): ${money(result.adminAllocation)}`,
    `- Marketing (${percent(0.05)}): ${money(result.marketingAllocation)}`,
    `- Operations (${percent(0.05)}): ${money(result.operationsAllocation)}`,
    "",
    `Total input: ${money(result.totalInput)}`,
    `Total allocated: ${money(result.totalAllocated)}`,
    `Pool balance / difference: ${money(result.poolBalance)}`,
  ];

  return lines.join("\n");
}
