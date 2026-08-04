import type { InvoiceCompanyRecord } from "../types";

function matches(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

export function filterInvoiceCompanies(records: InvoiceCompanyRecord[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return records;
  return records.filter((record) => [record.label, record.companyName, record.country, record.email, record.eori, record.vatNumber].some((value) => matches(value, normalized)));
}

export function sortInvoiceCompanies(records: InvoiceCompanyRecord[]) {
  return [...records].sort((left, right) => left.label.localeCompare(right.label));
}
