import type { InvoiceAddress, InvoiceCurrency } from "./types.ts";

export function formatMoney(value: number, currency: InvoiceCurrency): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function sanitizeFilenamePart(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

export function getBaseFilename(reference: string, date: string): string {
  return `commercial-invoice-${sanitizeFilenamePart(reference || date, date)}`;
}

export function getAddressRows(address: InvoiceAddress): [string, string][] {
  return [
    ["Company", address.companyName],
    ["Contact", address.contactName],
    ["Address", address.address],
    ["Country", address.country],
    ["EORI", address.eori],
    ["VAT", address.vat],
    ["EIN", address.ein],
    ["Telephone", address.telephone],
    ["Email", address.email],
    ["Notes", address.notes],
  ];
}

export function getAddressBlock(address: InvoiceAddress): string[] {
  return getAddressRows(address)
    .filter(([, value]) => value.trim())
    .flatMap(([label, value]) =>
      value.split("\n").map((line, index) => `${index ? "" : `${label}: `}${line}`),
    );
}
