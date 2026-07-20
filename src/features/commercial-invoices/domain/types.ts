export type InvoiceCurrency = "GBP" | "EUR";
export type PrintLocation = "" | "United Kingdom" | "Hungary";
export type DutiesPayableBy = "" | "Sender" | "Receiver";

export type InvoiceDetails = {
  reference: string;
  date: string;
  shipDate: string;
  tracking: string;
  boxCount: string;
  weight: string;
  currency: InvoiceCurrency;
  printLocation: PrintLocation;
  dutiesPayableBy: DutiesPayableBy;
};

export type InvoiceAddress = {
  companyName: string;
  contactName: string;
  address: string;
  country: string;
  eori: string;
  vat: string;
  ein: string;
  telephone: string;
  email: string;
  notes: string;
};

export type InvoiceLineItem = {
  id: string;
  product: string;
  designName: string;
  type: string;
  description: string;
  cost: string;
  quantity: string;
  commodityCode: string;
  countryOfOrigin: string;
};

export type CommercialInvoice = {
  details: InvoiceDetails;
  sender: InvoiceAddress;
  receiver: InvoiceAddress;
  lineItems: InvoiceLineItem[];
};

export type CalculatedLineItem = InvoiceLineItem & {
  costValue: number;
  quantityValue: number;
  total: number;
};

export type InvoiceTotals = {
  subtotal: number;
  grandTotal: number;
  totalQuantity: number;
};

export type CalculatedInvoice = Omit<CommercialInvoice, "lineItems"> & {
  lineItems: CalculatedLineItem[];
  totals: InvoiceTotals;
};

export type InvoiceValidationErrors = Record<string, string>;
