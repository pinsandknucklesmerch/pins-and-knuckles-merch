export type ProductTypeInvoiceValues = {
  commodityCode: string;
  countryOfOrigin: string;
  invoiceDescription: string;
  defaultInvoiceCost: string;
  invoiceCurrencyCode: string;
};

export type ValidatedProductTypeInvoiceValues = Omit<ProductTypeInvoiceValues, "defaultInvoiceCost" | "invoiceCurrencyCode"> & {
  defaultInvoiceCost: number | null;
  invoiceCurrencyCode: "GBP" | "EUR" | null;
};

export function validateProductTypeInvoiceFields(values: ProductTypeInvoiceValues) {
  const errors: Record<string, string> = {};
  const costText = values.defaultInvoiceCost.trim();
  const cost = costText ? Number(costText) : null;
  if (costText && (cost === null || !Number.isFinite(cost) || cost < 0)) errors.defaultInvoiceCost = "Default invoice cost must be a nonnegative number.";
  const currency = values.invoiceCurrencyCode.trim() || null;
  if (currency !== null && currency !== "GBP" && currency !== "EUR") errors.invoiceCurrencyCode = "Invoice currency must be GBP or EUR.";
  return {
    values: Object.keys(errors).length ? null : { ...values, defaultInvoiceCost: cost, invoiceCurrencyCode: currency as "GBP" | "EUR" | null },
    errors,
  } as { values: ValidatedProductTypeInvoiceValues | null; errors: Record<string, string> };
}
