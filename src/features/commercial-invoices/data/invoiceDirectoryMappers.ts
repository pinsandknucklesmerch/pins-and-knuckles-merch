import type { Tables } from "@/types/database.types";
import type { InvoiceCompany, ProductTypeInvoiceOption } from "../domain/directoryTypes";

type InvoiceCompanyRow = Tables<"invoice_companies">;
type ProductTypeRow = Tables<"product_types">;

function mapDefaultInvoiceCost(value: ProductTypeRow["default_invoice_cost"]): number | null {
  if (value === null) return null;

  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(
      "product_types.default_invoice_cost must be a finite numeric value.",
    );
  }
  return numberValue;
}

function mapInvoiceCurrencyCode(value: ProductTypeRow["invoice_currency_code"]): "GBP" | "EUR" | null {
  if (value === null) return null;
  if (value === "GBP" || value === "EUR") return value;
  throw new Error(
    `product_types.invoice_currency_code has unsupported value: ${value}`,
  );
}

export function mapInvoiceCompanyRow(row: InvoiceCompanyRow): InvoiceCompany {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    label: row.label,
    companyName: row.company_name,
    contactName: row.contact_name,
    country: row.country,
    eori: row.eori,
    vatNumber: row.vat_number,
    taxId: row.tax_id,
    telephone: row.telephone,
    email: row.email,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    region: row.region,
    postalCode: row.postal_code,
    notes: row.notes,
    isActive: row.is_active,
  };
}

export function mapProductTypeRow(row: ProductTypeRow): ProductTypeInvoiceOption {
  return {
    id: row.id,
    name: row.name,
    pricingCategory: row.pricing_category,
    commodityCode: row.commodity_code,
    countryOfOrigin: row.country_of_origin,
    invoiceDescription: row.invoice_description,
    defaultInvoiceCost: mapDefaultInvoiceCost(row.default_invoice_cost),
    invoiceCurrencyCode: mapInvoiceCurrencyCode(row.invoice_currency_code),
    isActive: row.is_active,
  };
}
