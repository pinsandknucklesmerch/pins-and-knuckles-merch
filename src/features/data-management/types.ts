export const PRICING_CATEGORIES = ["TSHIRT", "LONGSLEEVE", "HOODIE", "OTHER"] as const;

export type PricingCategory = (typeof PRICING_CATEGORIES)[number];
export type AccessLevel = "developer" | "admin" | "write" | "read";

export type InvoiceCompanyRecord = import("@/features/commercial-invoices/domain/directoryTypes").InvoiceCompany;
export type ProductTypeRecord = {
  id: string;
  name: string;
  commodityCode: string;
  countryOfOrigin: string;
  invoiceDescription: string;
  defaultInvoiceCost: number | null;
  invoiceCurrencyCode: "GBP" | "EUR" | null;
  pricingCategory: PricingCategory;
  isActive: boolean;
};

export type GarmentRecord = {
  id: string;
  code: string;
  altCode: string | null;
  brand: string | null;
  name: string;
  colour: string | null;
  tags: string | null;
  eurBasePrice: number | null;
  gbpPrice: number | null;
  extraSizeCost: number | null;
  isActive: boolean;
  productTypeId: string | null;
  productTypeName: string | null;
};

export type DataManagementActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export const initialDataManagementActionState: DataManagementActionState = { ok: false, message: "" };
