import type { Tables } from "@/types/database.types";
import type {
  CalculatorFee,
  CalculatorGarmentMarkup,
  CalculatorProfile,
  CalculatorProfileCode,
  CalculatorProfilePriceSet,
  CalculatorRegion,
  CurrencyCode,
  DeliveryRate,
  EuEmbroideryPrice,
  EuEmbroiderySize,
  EuPrintPriceTier,
  Garment,
  GarmentType,
  PriceKind,
} from "../domain/types.ts";

type CalculatorProfileRow = Tables<"calculator_profiles">;
type CalculatorProfilePriceSetRow = Tables<"calculator_profile_price_sets">;
type GarmentRow = Tables<"garments">;
type CalculatorGarmentMarkupRow = Tables<"calculator_garment_markups">;
type EuPrintPriceTierRow = Tables<"eu_print_price_tiers">;
type EuEmbroideryPriceRow = Tables<"eu_embroidery_pricing">;
type CalculatorFeeRow = Tables<"calculator_fees">;
type DeliveryRateRow = Tables<"delivery_rates">;

function toFiniteNumber(value: unknown, fieldName: string): number {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numberValue)) {
    throw new Error(`Invalid numeric value for ${fieldName}: ${String(value)}`);
  }

  return numberValue;
}

function toNullableFiniteNumber(value: unknown, fieldName: string): number | null {
  if (value === null) {
    return null;
  }

  return toFiniteNumber(value, fieldName);
}

function assertCalculatorProfileCode(value: string): CalculatorProfileCode {
  if (value === "EU_STANDARD" || value === "EU_US_CLIENTS" || value === "UK_TRADE") {
    return value;
  }

  throw new Error(`Unsupported calculator profile code: ${value}`);
}

function assertCalculatorRegion(value: string): CalculatorRegion {
  if (value === "EU" || value === "UK") {
    return value;
  }

  throw new Error(`Unsupported calculator region: ${value}`);
}

function assertCurrencyCode(value: string): CurrencyCode {
  if (value === "EUR" || value === "GBP") {
    return value;
  }

  throw new Error(`Unsupported currency code: ${value}`);
}

function assertPriceKind(value: string): PriceKind {
  if (value === "print" || value === "embroidery" || value === "delivery") {
    return value;
  }

  throw new Error(`Unsupported price kind: ${value}`);
}

function assertGarmentType(value: string): GarmentType {
  if (value === "TSHIRT" || value === "LONGSLEEVE" || value === "HOODIE") {
    return value;
  }

  throw new Error(`Unsupported garment type: ${value}`);
}

function assertEuEmbroiderySize(value: string): EuEmbroiderySize {
  if (value === "small" || value === "medium" || value === "large") {
    return value;
  }

  throw new Error(`Unsupported EU embroidery size: ${value}`);
}

function assertCalculatorFeeCode(value: string): CalculatorFee["feeCode"] {
  if (
    value === "EU_DIGITISING" ||
    value === "EU_NECK_PRINT" ||
    value === "UK_SCREEN_SETUP" ||
    value === "UK_EMBROIDERY_SETUP"
  ) {
    return value;
  }

  throw new Error(`Unsupported calculator fee code: ${value}`);
}

function assertAppliesPer(value: string): CalculatorFee["appliesPer"] {
  if (value === "embroidery_item" || value === "unit" || value === "screen") {
    return value;
  }

  throw new Error(`Unsupported fee applies_per value: ${value}`);
}

function assertCostSide(value: string): CalculatorFee["costSide"] {
  if (value === "production" || value === "customer" || value === "trade") {
    return value;
  }

  throw new Error(`Unsupported fee cost side: ${value}`);
}

export function mapCalculatorProfile(row: CalculatorProfileRow): CalculatorProfile {
  return {
    id: row.id,
    code: assertCalculatorProfileCode(row.code),
    name: row.name,
    region: assertCalculatorRegion(row.region),
    currencyCode: assertCurrencyCode(row.currency_code),
    vatRate: toNullableFiniteNumber(row.vat_rate, "calculator_profiles.vat_rate"),
    minQuantity: toFiniteNumber(row.min_quantity, "calculator_profiles.min_quantity"),
    maxQuantity: toNullableFiniteNumber(
      row.max_quantity,
      "calculator_profiles.max_quantity",
    ),
    maxColours: toNullableFiniteNumber(
      row.max_colours,
      "calculator_profiles.max_colours",
    ),
    tierStrategy: row.tier_strategy === "range" ? "range" : "floor",
    copyFormatterCode: row.copy_formatter_code,
    supportsDelivery: row.supports_delivery,
    supportsPkMarkup: row.supports_pk_markup,
    supportsEmbroidery: row.supports_embroidery,
    supportsScreenSetup: row.supports_screen_setup,
    isActive: row.is_active,
    isDeferred: row.is_deferred,
  };
}

export function mapCalculatorProfilePriceSet(
  row: CalculatorProfilePriceSetRow,
): CalculatorProfilePriceSet {
  return {
    calculatorProfileId: row.calculator_profile_id,
    priceKind: assertPriceKind(row.price_kind),
    pricingSetCode: row.pricing_set_code,
    region: assertCalculatorRegion(row.region),
    currencyCode: assertCurrencyCode(row.currency_code),
  };
}

export function mapGarment(row: GarmentRow): Garment {
  return {
    id: row.id,
    code: row.code,
    altCode: row.alt_code,
    brandName: row.brand_name,
    name: row.name,
    colour: row.colour,
    garmentType: assertGarmentType(row.garment_type),
    eurBasePrice: toNullableFiniteNumber(row.eur_base_price, "garments.eur_base_price"),
    gbpPrice: toNullableFiniteNumber(row.gbp_price, "garments.gbp_price"),
    extraSizeCost: toNullableFiniteNumber(
      row.extra_size_cost,
      "garments.extra_size_cost",
    ),
    tags: row.tags,
  };
}

export function mapCalculatorGarmentMarkup(
  row: CalculatorGarmentMarkupRow,
): CalculatorGarmentMarkup {
  return {
    calculatorProfileId: row.calculator_profile_id,
    garmentType: assertGarmentType(row.garment_type),
    markupValue: toFiniteNumber(
      row.markup_value,
      "calculator_garment_markups.markup_value",
    ),
  };
}

export function mapEuPrintPriceTier(row: EuPrintPriceTierRow): EuPrintPriceTier {
  if (row.currency_code !== "EUR") {
    throw new Error(`EU print tier must use EUR, received ${row.currency_code}`);
  }

  return {
    pricingSetCode: row.pricing_set_code,
    colourCount: toFiniteNumber(row.colour_count, "eu_print_price_tiers.colour_count"),
    quantityMin: toFiniteNumber(
      row.quantity_min,
      "eu_print_price_tiers.quantity_min",
    ),
    quantityMax: toFiniteNumber(
      row.quantity_max,
      "eu_print_price_tiers.quantity_max",
    ),
    productionUnitPrice: toFiniteNumber(
      row.production_unit_price,
      "eu_print_price_tiers.production_unit_price",
    ),
    customerUnitPrice: toFiniteNumber(
      row.customer_unit_price,
      "eu_print_price_tiers.customer_unit_price",
    ),
    currencyCode: row.currency_code,
  };
}

export function mapEuEmbroideryPrice(row: EuEmbroideryPriceRow): EuEmbroideryPrice {
  if (row.currency_code !== "EUR") {
    throw new Error(`EU embroidery price must use EUR, received ${row.currency_code}`);
  }

  return {
    pricingSetCode: row.pricing_set_code,
    sizeCode: assertEuEmbroiderySize(row.size_code),
    label: row.label,
    productionUnitPrice: toFiniteNumber(
      row.production_unit_price,
      "eu_embroidery_pricing.production_unit_price",
    ),
    customerUnitPrice: toFiniteNumber(
      row.customer_unit_price,
      "eu_embroidery_pricing.customer_unit_price",
    ),
    currencyCode: row.currency_code,
  };
}

export function mapCalculatorFee(row: CalculatorFeeRow): CalculatorFee {
  return {
    calculatorProfileId: row.calculator_profile_id,
    feeCode: assertCalculatorFeeCode(row.fee_code),
    feeLabel: row.fee_label,
    amount: toFiniteNumber(row.amount, "calculator_fees.amount"),
    currencyCode: assertCurrencyCode(row.currency_code),
    appliesPer: assertAppliesPer(row.applies_per),
    costSide: assertCostSide(row.cost_side),
  };
}

export function mapDeliveryRate(row: DeliveryRateRow): DeliveryRate {
  if (row.currency_code !== "EUR") {
    throw new Error(`EU delivery rate must use EUR, received ${row.currency_code}`);
  }

  return {
    pricingSetCode: row.pricing_set_code,
    country: row.country,
    currencyCode: row.currency_code,
    costPerBox: toFiniteNumber(row.cost_per_box, "delivery_rates.cost_per_box"),
    deliveryTime: row.delivery_time,
    vatRate: toFiniteNumber(row.vat_rate, "delivery_rates.vat_rate"),
  };
}
