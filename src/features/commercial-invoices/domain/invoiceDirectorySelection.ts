import type { InvoiceCompany, ProductTypeInvoiceOption } from "./directoryTypes";
import type { InvoiceAddress, InvoiceCurrency, InvoiceLineItem } from "./types";

export function selectInvoiceCompany(
  current: InvoiceAddress,
  company: InvoiceCompany,
): InvoiceAddress {
  void current;
  const address = [
    company.addressLine1,
    company.addressLine2,
    company.city,
    company.region,
    company.postalCode,
  ]
    .filter((value) => value.trim().length > 0)
    .join("\n");

  return {
    companyId: company.id,
    companyName: company.companyName,
    contactName: company.contactName,
    address,
    country: company.country,
    eori: company.eori,
    vat: company.vatNumber,
    ein: company.taxId,
    telephone: company.telephone,
    email: company.email,
    notes: company.notes,
  };
}

export function selectProductType(
  current: InvoiceLineItem,
  product: ProductTypeInvoiceOption,
  invoiceCurrency: InvoiceCurrency,
): InvoiceLineItem {
  return {
    ...current,
    productTypeId: product.id,
    product: product.name,
    type: product.pricingCategory,
    description: product.invoiceDescription,
    commodityCode: product.commodityCode,
    // An empty master origin must not erase an existing nonblank invoice value.
    countryOfOrigin: product.countryOfOrigin,
    cost:
      product.defaultInvoiceCost !== null && product.invoiceCurrencyCode === invoiceCurrency
        ? String(product.defaultInvoiceCost)
        : current.cost,
  };
}

export function manuallyEditInvoiceCompanyName(
  current: InvoiceAddress,
  value: string,
): InvoiceAddress {
  return { ...current, companyId: null, companyName: value };
}

export function manuallyEditInvoiceName(
  current: InvoiceLineItem,
  value: string,
): InvoiceLineItem {
  return { ...current, productTypeId: null, product: value };
}
