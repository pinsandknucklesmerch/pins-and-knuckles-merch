export const PK_TAX_PEOPLE = [
  "EPCC",
  "Johan",
  "Bux",
  "Hardus",
  "Shannon",
  "Justin",
  "Snuggle",
] as const;

export type PkTaxPerson = (typeof PK_TAX_PEOPLE)[number];
export type PkTaxInput = Record<PkTaxPerson, number>;

export type PkTaxContribution = {
  person: PkTaxPerson;
  rate: number;
  amount: number;
};

export type PkTaxRecipientAllocation = {
  person: "Bux" | "Hardus" | "Justin";
  amount: number;
};

export type PkTaxResult = {
  inputs: PkTaxInput;
  totalInput: number;
  totalPkTaxBase: number;
  epccAllocation: number;
  johanAllocation: number;
  contributions: PkTaxContribution[];
  poolTotal: number;
  recipientAllocations: PkTaxRecipientAllocation[];
  adminAllocation: number;
  marketingAllocation: number;
  operationsAllocation: number;
  totalAllocated: number;
  poolBalance: number;
};
