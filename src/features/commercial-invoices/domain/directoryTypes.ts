export type InvoiceCompany = {
  id: string;
  organisationId: string;
  label: string;
  companyName: string;
  contactName: string;
  country: string;
  eori: string;
  vatNumber: string;
  taxId: string;
  telephone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  notes: string;
  isActive: boolean;
};

export type ProductTypeInvoiceOption = {
  id: string;
  name: string;
  pricingCategory: string;
  commodityCode: string;
  countryOfOrigin: string;
  invoiceDescription: string;
  defaultInvoiceCost: number | null;
  invoiceCurrencyCode: "GBP" | "EUR" | null;
  isActive: boolean;
};
