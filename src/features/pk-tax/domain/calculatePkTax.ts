import {
  PK_TAX_POOL_CONTRIBUTORS,
  PK_TAX_RECIPIENTS,
  type PkTaxInput,
  type PkTaxMetricShares,
  type PkTaxRecipient,
  type PkTaxRecipientAllocation,
  type PkTaxResult,
} from "./types.ts";

const WEIGHTS = {
  companyProfit: 0.4,
  snuggleProfit: 0.25,
  pkTax: 0.2,
  ordersHandled: 0.15,
} as const;

function nonNegative(value: number) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function toCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100);
}

export function createDefaultPkTaxInput(): PkTaxInput {
  return {
    overallTotal: 0,
    totalSnuggleProfit: 0,
    johanPkTax: 0,
    pkTaxBroughtIn: Object.fromEntries(PK_TAX_POOL_CONTRIBUTORS.map((person) => [person, 0])) as PkTaxInput["pkTaxBroughtIn"],
    performance: Object.fromEntries(PK_TAX_RECIPIENTS.map((person) => [person, { companyProfit: 0, snuggleProfit: 0, ordersHandled: 0 }])) as PkTaxInput["performance"],
  };
}

function normaliseInput(input: PkTaxInput): PkTaxInput {
  const defaults = createDefaultPkTaxInput();
  return {
    overallTotal: nonNegative(input.overallTotal),
    totalSnuggleProfit: nonNegative(input.totalSnuggleProfit),
    johanPkTax: nonNegative(input.johanPkTax),
    pkTaxBroughtIn: Object.fromEntries(PK_TAX_POOL_CONTRIBUTORS.map((person) => [person, nonNegative(input.pkTaxBroughtIn?.[person] ?? 0)])) as PkTaxInput["pkTaxBroughtIn"],
    performance: Object.fromEntries(PK_TAX_RECIPIENTS.map((person) => [person, {
      companyProfit: nonNegative(input.performance?.[person]?.companyProfit ?? defaults.performance[person].companyProfit),
      snuggleProfit: nonNegative(input.performance?.[person]?.snuggleProfit ?? defaults.performance[person].snuggleProfit),
      ordersHandled: nonNegative(input.performance?.[person]?.ordersHandled ?? defaults.performance[person].ordersHandled),
    }])) as PkTaxInput["performance"],
  };
}

function emptyShares(): PkTaxMetricShares {
  return { companyProfit: 0, snuggleProfit: 0, pkTax: 0, ordersHandled: 0 };
}

function distributeRoundedPool(poolTotal: number, allocations: PkTaxRecipientAllocation[]) {
  const poolCents = toCents(poolTotal);
  const rounded = allocations.map((allocation) => Math.floor((allocation.unroundedAmount + Number.EPSILON) * 100));
  let remainder = poolCents - rounded.reduce((sum, amount) => sum + amount, 0);
  const ranked = allocations
    .map((allocation, index) => ({ index, amount: allocation.unroundedAmount }))
    .sort((left, right) => right.amount - left.amount || left.index - right.index);

  for (const allocation of ranked) {
    if (remainder <= 0) break;
    rounded[allocation.index] += 1;
    remainder -= 1;
  }

  return allocations.map((allocation, index) => ({ ...allocation, amount: rounded[index] / 100 }));
}

export function calculatePkTax(input: PkTaxInput): PkTaxResult {
  const inputs = normaliseInput(input);
  const contributions = [
    ...PK_TAX_POOL_CONTRIBUTORS.map((person) => ({ person, rate: 0.4, amount: inputs.pkTaxBroughtIn[person] * 0.4 })),
    { person: "Snuggle" as const, rate: 0.07, amount: inputs.totalSnuggleProfit * 0.07 },
  ];
  const salesTeamContribution = contributions.slice(0, -1).reduce((sum, contribution) => sum + contribution.amount, 0);
  const snuggleContribution = contributions.at(-1)?.amount ?? 0;
  const poolTotal = salesTeamContribution + snuggleContribution;
  const totals = {
    companyProfit: PK_TAX_RECIPIENTS.reduce((sum, person) => sum + inputs.performance[person].companyProfit, 0),
    snuggleProfit: PK_TAX_RECIPIENTS.reduce((sum, person) => sum + inputs.performance[person].snuggleProfit, 0),
    pkTax: PK_TAX_RECIPIENTS.reduce((sum, person) => sum + inputs.pkTaxBroughtIn[person], 0),
    ordersHandled: PK_TAX_RECIPIENTS.reduce((sum, person) => sum + inputs.performance[person].ordersHandled, 0),
  };
  const recipientAllocations = PK_TAX_RECIPIENTS.map((person): PkTaxRecipientAllocation => {
    const metricShares = emptyShares();
    if (totals.companyProfit > 0) metricShares.companyProfit = inputs.performance[person].companyProfit / totals.companyProfit;
    if (totals.snuggleProfit > 0) metricShares.snuggleProfit = inputs.performance[person].snuggleProfit / totals.snuggleProfit;
    if (totals.pkTax > 0) metricShares.pkTax = inputs.pkTaxBroughtIn[person] / totals.pkTax;
    if (totals.ordersHandled > 0) metricShares.ordersHandled = inputs.performance[person].ordersHandled / totals.ordersHandled;
    const weightedScore = metricShares.companyProfit * WEIGHTS.companyProfit + metricShares.snuggleProfit * WEIGHTS.snuggleProfit + metricShares.pkTax * WEIGHTS.pkTax + metricShares.ordersHandled * WEIGHTS.ordersHandled;
    return { person, metricShares, weightedScore, unroundedAmount: 0, amount: null };
  });
  const scoreTotal = recipientAllocations.reduce((sum, allocation) => sum + allocation.weightedScore, 0);
  const allocations = scoreTotal > 0
    ? distributeRoundedPool(poolTotal, recipientAllocations.map((allocation) => ({
      ...allocation,
      weightedScore: allocation.weightedScore / scoreTotal,
      unroundedAmount: poolTotal * (allocation.weightedScore / scoreTotal),
    })))
    : recipientAllocations;

  return {
    inputs,
    epccAllocation: inputs.overallTotal * 0.4,
    adminAllocation: inputs.overallTotal * 0.1,
    marketingAllocation: inputs.overallTotal * 0.05,
    operationsAllocation: inputs.overallTotal * 0.05,
    johanAllocation: inputs.johanPkTax * 0.4,
    contributions,
    salesTeamContribution,
    snuggleContribution,
    poolTotal,
    recipientAllocations: allocations,
    validationError: scoreTotal === 0 ? "Performance data required." : null,
  };
}

export { WEIGHTS, type PkTaxRecipient };
