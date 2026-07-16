import type {
  CalculatorFee,
  CalculatorGarmentMarkup,
  EuEmbroideryPrice,
  EuEmbroiderySize,
  EuPrintPriceTier,
  GarmentType,
} from "./types.ts";

export function findEuPrintTier(
  tiers: EuPrintPriceTier[],
  pricingSetCode: string,
  colourCount: number,
  quantity: number,
) {
  return tiers.find(
    (tier) =>
      tier.pricingSetCode === pricingSetCode &&
      tier.colourCount === colourCount &&
      quantity >= tier.quantityMin &&
      quantity <= tier.quantityMax,
  );
}

export function findGarmentMarkup(
  markups: CalculatorGarmentMarkup[],
  calculatorProfileId: string,
  garmentType: GarmentType,
) {
  return markups.find(
    (markup) =>
      markup.calculatorProfileId === calculatorProfileId &&
      markup.garmentType === garmentType,
  );
}

export function findEuEmbroideryPrice(
  pricing: EuEmbroideryPrice[],
  pricingSetCode: string,
  sizeCode: EuEmbroiderySize,
) {
  return pricing.find(
    (price) =>
      price.pricingSetCode === pricingSetCode && price.sizeCode === sizeCode,
  );
}

export function findFee(
  fees: CalculatorFee[],
  calculatorProfileId: string,
  feeCode: CalculatorFee["feeCode"],
  costSide: CalculatorFee["costSide"],
) {
  return fees.find(
    (fee) =>
      fee.calculatorProfileId === calculatorProfileId &&
      fee.feeCode === feeCode &&
      fee.costSide === costSide,
  );
}
