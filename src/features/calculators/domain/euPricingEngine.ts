import { isEuProfileCode } from "./profiles.ts";
import {
  findEuEmbroideryPrice,
  findEuPrintTier,
  findFee,
  findGarmentMarkup,
} from "./priceLookup.ts";
import { validateEuPrintColour, validateEuQuantity } from "./validation.ts";
import type {
  CalculatorReferenceData,
  CalculatorValidationError,
  EuCalculatorInput,
  EuCalculatorItemResult,
  EuCalculatorResult,
  EuEmbroideryCostBreakdown,
  EuPrintCostBreakdown,
  PriceKind,
} from "./types.ts";

function getPricingSetCode(
  referenceData: CalculatorReferenceData,
  priceKind: PriceKind,
) {
  return referenceData.priceSets.find(
    (priceSet) =>
      priceSet.calculatorProfileId === referenceData.profile.id &&
      priceSet.priceKind === priceKind,
  )?.pricingSetCode;
}

function sumBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

export function calculateEuStandardPrice(
  input: EuCalculatorInput,
  referenceData: CalculatorReferenceData,
): EuCalculatorResult {
  const errors: CalculatorValidationError[] = [];

  if (
    input.profileCode !== referenceData.profile.code ||
    !isEuProfileCode(referenceData.profile.code)
  ) {
    errors.push({
      code: "INVALID_PROFILE",
      message: `Reference data profile ${referenceData.profile.code} does not match EU input profile ${input.profileCode}.`,
    });
  }

  const printPricingSetCode = getPricingSetCode(referenceData, "print");
  const embroideryPricingSetCode = getPricingSetCode(referenceData, "embroidery");
  const neckPrintProductionFee = findFee(
    referenceData.fees,
    referenceData.profile.id,
    "EU_NECK_PRINT",
    "production",
  );
  const neckPrintCustomerFee = findFee(
    referenceData.fees,
    referenceData.profile.id,
    "EU_NECK_PRINT",
    "customer",
  );
  const digitisingProductionFee = findFee(
    referenceData.fees,
    referenceData.profile.id,
    "EU_DIGITISING",
    "production",
  );
  const digitisingCustomerFee = findFee(
    referenceData.fees,
    referenceData.profile.id,
    "EU_DIGITISING",
    "customer",
  );

  if (!printPricingSetCode) {
    errors.push({
      code: "MISSING_PRINT_TIER",
      message: `Missing print pricing set for ${referenceData.profile.code}.`,
    });
  }

  if (!embroideryPricingSetCode) {
    errors.push({
      code: "MISSING_EMBROIDERY_PRICE",
      message: `Missing embroidery pricing set for ${referenceData.profile.code}.`,
    });
  }

  if (!neckPrintProductionFee) {
    errors.push({
      code: "MISSING_FEE",
      field: "EU_NECK_PRINT.production",
      message: "Missing EU neck print production fee.",
    });
  }

  if (!neckPrintCustomerFee) {
    errors.push({
      code: "MISSING_FEE",
      field: "EU_NECK_PRINT.customer",
      message: "Missing EU neck print customer fee.",
    });
  }

  if (!digitisingProductionFee) {
    errors.push({
      code: "MISSING_FEE",
      field: "EU_DIGITISING.production",
      message: "Missing EU digitising production fee.",
    });
  }

  if (!digitisingCustomerFee) {
    errors.push({
      code: "MISSING_FEE",
      field: "EU_DIGITISING.customer",
      message: "Missing EU digitising customer fee.",
    });
  }

  const itemResults: EuCalculatorItemResult[] = [];

  for (const item of input.items) {
    const quantityError = validateEuQuantity(item);
    if (quantityError) {
      errors.push(quantityError);
    }

    const garment = item.garmentId
      ? referenceData.garments.find((candidate) => candidate.id === item.garmentId)
      : undefined;

    if (!garment) {
      errors.push({
        code: "MISSING_GARMENT",
        itemId: item.id,
        field: "garmentId",
        message: "Missing garment.",
      });
    }

    if (garment && garment.eurBasePrice === null) {
      errors.push({
        code: "MISSING_GARMENT_PRICE",
        itemId: item.id,
        field: "garment.eurBasePrice",
        message: `Missing EUR garment price for ${garment.code}.`,
      });
    }

    const garmentMarkup = garment
      ? findGarmentMarkup(
          referenceData.garmentMarkups,
          referenceData.profile.id,
          garment.garmentType,
        )
      : undefined;

    if (garment && !garmentMarkup) {
      errors.push({
        code: "MISSING_GARMENT_MARKUP",
        itemId: item.id,
        field: "garmentMarkup",
        message: `Missing garment markup for ${garment.garmentType}.`,
      });
    }

    const printBreakdowns: EuPrintCostBreakdown[] = [];
    for (const print of item.printPositions) {
      const colourError = validateEuPrintColour(item, print);
      if (colourError) {
        errors.push(colourError);
        continue;
      }

      if (print.position === "NECK") {
        if (!neckPrintProductionFee || !neckPrintCustomerFee) {
          continue;
        }

        printBreakdowns.push({
          position: print.position,
          colourCount: null,
          productionUnitPrice: neckPrintProductionFee.amount,
          customerUnitPrice: neckPrintCustomerFee.amount,
          productionCost: neckPrintProductionFee.amount * item.quantity,
          customerCost: neckPrintCustomerFee.amount * item.quantity,
        });
        continue;
      }

      if (!printPricingSetCode || typeof print.colourCount !== "number") {
        continue;
      }

      const printTier = findEuPrintTier(
        referenceData.euPrintTiers,
        printPricingSetCode,
        print.colourCount,
        item.quantity,
      );

      if (!printTier) {
        errors.push({
          code: "MISSING_PRINT_TIER",
          itemId: item.id,
          field: `printPositions.${print.position}`,
          message: `Missing EU print tier for ${print.colourCount} colours at quantity ${item.quantity}.`,
        });
        continue;
      }

      printBreakdowns.push({
        position: print.position,
        colourCount: print.colourCount,
        productionUnitPrice: printTier.productionUnitPrice,
        customerUnitPrice: printTier.customerUnitPrice,
        productionCost: printTier.productionUnitPrice * item.quantity,
        customerCost: printTier.customerUnitPrice * item.quantity,
      });
    }

    const embroideryBreakdowns: EuEmbroideryCostBreakdown[] = [];
    for (const embroidery of item.embroideryItems ?? []) {
      if (!embroideryPricingSetCode) {
        continue;
      }

      const embroideryPrice = findEuEmbroideryPrice(
        referenceData.euEmbroideryPricing,
        embroideryPricingSetCode,
        embroidery.size,
      );

      if (!embroideryPrice) {
        errors.push({
          code: "MISSING_EMBROIDERY_PRICE",
          itemId: item.id,
          field: `embroideryItems.${embroidery.size}`,
          message: `Missing EU embroidery price for ${embroidery.size}.`,
        });
        continue;
      }

      if (!digitisingProductionFee || !digitisingCustomerFee) {
        continue;
      }

      embroideryBreakdowns.push({
        size: embroidery.size,
        productionUnitPrice: embroideryPrice.productionUnitPrice,
        customerUnitPrice: embroideryPrice.customerUnitPrice,
        productionCost: embroideryPrice.productionUnitPrice * item.quantity,
        customerCost: embroideryPrice.customerUnitPrice * item.quantity,
        digitisingProductionCost: digitisingProductionFee.amount,
        digitisingCustomerCost: digitisingCustomerFee.amount,
      });
    }

    if (!garment || garment.eurBasePrice === null || !garmentMarkup) {
      continue;
    }

    const baseCost = garment.eurBasePrice * item.quantity;
    const garmentMarkupCost = garmentMarkup.markupValue * item.quantity;
    const pkMarkupCost =
      item.pkMarkupEnabled === true ? (item.pkMarkupPerUnit ?? 0) * item.quantity : 0;
    const printProductionCost = sumBy(
      printBreakdowns,
      (breakdown) => breakdown.productionCost,
    );
    const printCustomerCost = sumBy(
      printBreakdowns,
      (breakdown) => breakdown.customerCost,
    );
    const embroideryProductionCost = sumBy(
      embroideryBreakdowns,
      (breakdown) => breakdown.productionCost,
    );
    const embroideryCustomerCost = sumBy(
      embroideryBreakdowns,
      (breakdown) => breakdown.customerCost,
    );
    const digitisingProductionCost = sumBy(
      embroideryBreakdowns,
      (breakdown) => breakdown.digitisingProductionCost,
    );
    const digitisingCustomerCost = sumBy(
      embroideryBreakdowns,
      (breakdown) => breakdown.digitisingCustomerCost,
    );
    const productionSubtotalExVat =
      printProductionCost + baseCost + embroideryProductionCost + digitisingProductionCost;
    const customerSubtotalExVat =
      printCustomerCost +
      baseCost +
      garmentMarkupCost +
      pkMarkupCost +
      embroideryCustomerCost +
      digitisingCustomerCost;

    itemResults.push({
      itemId: item.id,
      garmentId: garment.id,
      quantity: item.quantity,
      baseCost,
      garmentMarkupCost,
      pkMarkupCost,
      printProductionCost,
      printCustomerCost,
      embroideryProductionCost,
      embroideryCustomerCost,
      digitisingProductionCost,
      digitisingCustomerCost,
      productionSubtotalExVat,
      customerSubtotalExVat,
      profitExVat: customerSubtotalExVat - productionSubtotalExVat,
      printBreakdowns,
      embroideryBreakdowns,
    });
  }

  if (errors.length > 0) {
    return {
      ok: false,
      profileCode: input.profileCode,
      currencyCode: "EUR",
      items: [],
      totals: null,
      errors,
    };
  }

  const productionSubtotalExVat = sumBy(
    itemResults,
    (item) => item.productionSubtotalExVat,
  );
  const customerSubtotalExVat = sumBy(
    itemResults,
    (item) => item.customerSubtotalExVat,
  );
  const vatRate = referenceData.profile.vatRate ?? 0;
  const vatAmount = customerSubtotalExVat * (vatRate / 100);
  const customerTotalIncVat = customerSubtotalExVat + vatAmount;

  return {
    ok: true,
    profileCode: input.profileCode,
    currencyCode: "EUR",
    items: itemResults,
    totals: {
      productionSubtotalExVat,
      customerSubtotalExVat,
      vatRate,
      vatAmount,
      customerTotalIncVat,
      profitExVat: customerSubtotalExVat - productionSubtotalExVat,
    },
    errors: [],
  };
}
