import type { DeliveryRate } from "./types.ts";

export type EuDeliveryHelperInput = {
  country: string | null;
  boxCount: number;
  markupEnabled: boolean;
  markupPerBox: number;
};

export type EuDeliveryCalculation =
  | {
      ok: true;
      rate: DeliveryRate;
      boxCount: number;
      markupPerBox: number;
      deliveryBaseExclVat: number;
      deliveryMarkupExclVat: number;
      deliverySubtotalExclVat: number;
      deliveryVatAmount: number;
      deliveryTotalInclVat: number;
    }
  | { ok: false; error: string };

export function calculateEuDelivery(
  input: EuDeliveryHelperInput,
  deliveryRates: DeliveryRate[],
  deliveryRatesError?: string | null,
): EuDeliveryCalculation {
  if (deliveryRatesError || deliveryRates.length === 0) {
    return { ok: false, error: "Delivery rates unavailable." };
  }
  if (!input.country) return { ok: false, error: "Select a delivery area." };
  const rate = deliveryRates.find((candidate) => candidate.country === input.country);
  if (!rate) return { ok: false, error: "Delivery area unavailable." };
  if (!Number.isInteger(input.boxCount) || input.boxCount <= 0) {
    return { ok: false, error: "Enter a whole number of boxes." };
  }

  const markupPerBox = input.markupEnabled && Number.isFinite(input.markupPerBox)
    ? input.markupPerBox
    : 0;
  const deliveryBaseExclVat = input.boxCount * rate.costPerBox;
  const deliveryMarkupExclVat = input.boxCount * markupPerBox;
  const deliverySubtotalExclVat = deliveryBaseExclVat + deliveryMarkupExclVat;
  const deliveryVatAmount = deliverySubtotalExclVat * (rate.vatRate / 100);

  return {
    ok: true,
    rate,
    boxCount: input.boxCount,
    markupPerBox,
    deliveryBaseExclVat,
    deliveryMarkupExclVat,
    deliverySubtotalExclVat,
    deliveryVatAmount,
    deliveryTotalInclVat: deliverySubtotalExclVat + deliveryVatAmount,
  };
}

export function formatEuDeliveryCopy(delivery: Extract<EuDeliveryCalculation, { ok: true }>) {
  const money = (value: number) => `€${value.toFixed(2)}`;
  return [
    "Delivery Helper",
    "",
    `Delivery Country: ${delivery.rate.country}`,
    `Delivery Time: ${delivery.rate.deliveryTime}`,
    `Boxes: ${delivery.boxCount}`,
    // Legacy copy passes the full ex-VAT delivery subtotal into this label.
    `Cost Per Box: ${money(delivery.deliverySubtotalExclVat)} excl. VAT`,
    `Total Delivery Cost Incl. VAT: ${money(delivery.deliveryTotalInclVat)}`,
  ].join("\n");
}
