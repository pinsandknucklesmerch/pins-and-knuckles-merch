import type {
  CalculatedInvoice,
  CommercialInvoice,
  InvoiceLineItem,
  InvoiceValidationErrors,
} from "./types.ts";

export function parseNonNegativeNumber(value: string): number {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineTotal(item: InvoiceLineItem): number {
  return roundMoney(
    parseNonNegativeNumber(item.cost) * parseNonNegativeNumber(item.quantity),
  );
}

export function calculateInvoice(invoice: CommercialInvoice): CalculatedInvoice {
  const lineItems = invoice.lineItems.map((item) => ({
    ...item,
    costValue: parseNonNegativeNumber(item.cost),
    quantityValue: parseNonNegativeNumber(item.quantity),
    total: calculateLineTotal(item),
  }));
  const subtotal = roundMoney(
    lineItems.reduce((sum, item) => sum + item.total, 0),
  );

  return {
    ...invoice,
    lineItems,
    totals: {
      subtotal,
      grandTotal: subtotal,
      totalQuantity: lineItems.reduce(
        (sum, item) => sum + item.quantityValue,
        0,
      ),
    },
  };
}

export function hasLineContent(item: InvoiceLineItem): boolean {
  return Object.entries(item).some(
    ([key, value]) => key !== "id" && value.trim().length > 0,
  );
}

export function validateInvoice(invoice: CommercialInvoice): InvoiceValidationErrors {
  const errors: InvoiceValidationErrors = {};
  if (!invoice.details.reference.trim()) errors.reference = "Required";
  if (!invoice.details.printLocation) errors.printLocation = "Required";
  if (!invoice.details.dutiesPayableBy) errors.dutiesPayableBy = "Required";
  if (!invoice.sender.companyName.trim()) errors["sender.companyName"] = "Required";
  if (!invoice.sender.address.trim()) errors["sender.address"] = "Required";
  if (!invoice.receiver.companyName.trim()) errors["receiver.companyName"] = "Required";
  if (!invoice.receiver.address.trim()) errors["receiver.address"] = "Required";

  const contentLines = invoice.lineItems.filter(hasLineContent);
  if (!contentLines.length) errors.lineItems = "Add at least one item";
  contentLines.forEach((item) => {
    if (!item.product.trim()) errors[`${item.id}.product`] = "Required";
    const cost = Number(item.cost);
    if (!item.cost.trim() || !Number.isFinite(cost) || cost < 0) {
      errors[`${item.id}.cost`] = "Enter 0 or more";
    }
    const quantity = Number(item.quantity);
    if (
      !item.quantity.trim() ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      errors[`${item.id}.quantity`] = "Enter a whole number above 0";
    }
  });
  return errors;
}

export function createLineItem(id: string): InvoiceLineItem {
  return {
    id,
    product: "",
    designName: "",
    type: "",
    description: "",
    cost: "",
    quantity: "",
    commodityCode: "",
    countryOfOrigin: "",
  };
}

export function addLineItem(
  items: InvoiceLineItem[],
  id: string,
): InvoiceLineItem[] {
  return [...items, createLineItem(id)];
}

export function removeLineItem(
  items: InvoiceLineItem[],
  id: string,
): InvoiceLineItem[] {
  return items.length > 1 ? items.filter((item) => item.id !== id) : items;
}
