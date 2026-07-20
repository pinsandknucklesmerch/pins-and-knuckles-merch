import {
  PK_TAX_PEOPLE,
  type PkTaxInput,
  type PkTaxResult,
} from "./types.ts";

const RECIPIENTS = ["Bux", "Hardus", "Justin"] as const;

function nonNegative(value: number) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function createDefaultPkTaxInput(): PkTaxInput {
  return Object.fromEntries(PK_TAX_PEOPLE.map((person) => [person, 0])) as PkTaxInput;
}

export function calculatePkTax(input: PkTaxInput): PkTaxResult {
  const inputs = Object.fromEntries(
    PK_TAX_PEOPLE.map((person) => [person, nonNegative(input[person])]),
  ) as PkTaxInput;
  const totalInput = PK_TAX_PEOPLE.reduce((sum, person) => sum + inputs[person], 0);
  const totalPkTaxBase = totalInput - inputs.Snuggle;
  const contributions = [
    { person: "Bux" as const, rate: 0.4, amount: inputs.Bux * 0.4 },
    { person: "Hardus" as const, rate: 0.4, amount: inputs.Hardus * 0.4 },
    { person: "Shannon" as const, rate: 0.4, amount: inputs.Shannon * 0.4 },
    { person: "Justin" as const, rate: 0.4, amount: inputs.Justin * 0.4 },
    { person: "Snuggle" as const, rate: 0.07, amount: inputs.Snuggle * 0.07 },
  ];
  const poolTotal = contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
  const recipientAllocations = RECIPIENTS.map((person) => ({
    person,
    amount: poolTotal / RECIPIENTS.length,
  }));
  const epccAllocation = inputs.EPCC * 0.4;
  const johanAllocation = inputs.Johan * 0.4;
  const adminAllocation = totalPkTaxBase * 0.1;
  const marketingAllocation = totalPkTaxBase * 0.05;
  const operationsAllocation = totalPkTaxBase * 0.05;
  const totalAllocated =
    epccAllocation +
    johanAllocation +
    recipientAllocations.reduce((sum, allocation) => sum + allocation.amount, 0) +
    adminAllocation +
    marketingAllocation +
    operationsAllocation;

  return {
    inputs,
    totalInput,
    totalPkTaxBase,
    epccAllocation,
    johanAllocation,
    contributions,
    poolTotal,
    recipientAllocations,
    adminAllocation,
    marketingAllocation,
    operationsAllocation,
    totalAllocated,
    poolBalance:
      poolTotal - recipientAllocations.reduce((sum, allocation) => sum + allocation.amount, 0),
  };
}
