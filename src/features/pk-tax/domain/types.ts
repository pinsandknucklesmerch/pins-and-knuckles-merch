export const PK_TAX_POOL_CONTRIBUTORS = ["Hardus", "Justin", "Bux", "Shannon"] as const;
export const PK_TAX_RECIPIENTS = ["Hardus", "Justin", "Bux"] as const;

export type PkTaxPoolContributor = (typeof PK_TAX_POOL_CONTRIBUTORS)[number];
export type PkTaxRecipient = (typeof PK_TAX_RECIPIENTS)[number];
export type PkTaxPerformance = {
  companyProfit: number;
  snuggleProfit: number;
  ordersHandled: number;
};

export type PkTaxInput = {
  overallTotal: number;
  totalSnuggleProfit: number;
  johanPkTax: number;
  pkTaxBroughtIn: Record<PkTaxPoolContributor, number>;
  performance: Record<PkTaxRecipient, PkTaxPerformance>;
};

export type PkTaxContribution = {
  person: PkTaxPoolContributor | "Snuggle";
  rate: number;
  amount: number;
};

export type PkTaxMetricShares = {
  companyProfit: number;
  snuggleProfit: number;
  pkTax: number;
  ordersHandled: number;
};

export type PkTaxRecipientAllocation = {
  person: PkTaxRecipient;
  metricShares: PkTaxMetricShares;
  weightedScore: number;
  unroundedAmount: number;
  amount: number | null;
};

export type PkTaxResult = {
  inputs: PkTaxInput;
  epccAllocation: number;
  adminAllocation: number;
  marketingAllocation: number;
  operationsAllocation: number;
  johanAllocation: number;
  contributions: PkTaxContribution[];
  salesTeamContribution: number;
  snuggleContribution: number;
  poolTotal: number;
  recipientAllocations: PkTaxRecipientAllocation[];
  validationError: string | null;
};
