import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";
import type {
  CalculatorProfileCode,
  CalculatorReferenceData,
  PriceKind,
} from "../domain/types.ts";
import {
  mapCalculatorFee,
  mapCalculatorGarmentMarkup,
  mapCalculatorProfile,
  mapCalculatorProfilePriceSet,
  mapDeliveryRate,
  mapEuEmbroideryPrice,
  mapEuPrintPriceTier,
  mapGarment,
} from "./mappers.ts";

type CalculatorSupabaseClient = SupabaseClient<Database>;

type CalculatorProfileRow = Tables<"calculator_profiles">;
type CalculatorProfilePriceSetRow = Tables<"calculator_profile_price_sets">;
type GarmentRow = Tables<"garments">;
type CalculatorGarmentMarkupRow = Tables<"calculator_garment_markups">;
type EuPrintPriceTierRow = Tables<"eu_print_price_tiers">;
type EuEmbroideryPriceRow = Tables<"eu_embroidery_pricing">;
type CalculatorFeeRow = Tables<"calculator_fees">;
type DeliveryRateRow = Tables<"delivery_rates">;

function throwIfError(error: { message: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function getPricingSetCode(
  priceSets: ReturnType<typeof mapCalculatorProfilePriceSet>[],
  priceKind: PriceKind,
) {
  return priceSets.find((priceSet) => priceSet.priceKind === priceKind)
    ?.pricingSetCode;
}

export type EffectiveDateRow = {
  valid_from: string;
  valid_to: string | null;
};

export function getUtcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function isEffectiveOnDate(row: EffectiveDateRow, effectiveDate: string) {
  return (
    row.valid_from <= effectiveDate &&
    (row.valid_to === null || row.valid_to >= effectiveDate)
  );
}

export type EuScopedRow = {
  region: string;
  currency_code: string;
};

export function isEuScopedRow(row: EuScopedRow) {
  return row.region === "EU" && row.currency_code === "EUR";
}

export async function loadCalculatorReferenceData(
  supabase: CalculatorSupabaseClient,
  profileCode: Extract<CalculatorProfileCode, "EU_STANDARD" | "EU_US_CLIENTS">,
): Promise<CalculatorReferenceData> {
  const effectiveDate = getUtcDateString();
  const validToFilter = `valid_to.is.null,valid_to.gte.${effectiveDate}`;

  const profileResponse = await supabase
    .from("calculator_profiles")
    .select("*")
    .eq("code", profileCode)
    .eq("region", "EU")
    .eq("currency_code", "EUR")
    .eq("is_active", true)
    .maybeSingle();

  throwIfError(profileResponse.error, "Failed to load calculator profile");

  if (!profileResponse.data) {
    throw new Error(`Calculator profile not found: ${profileCode}`);
  }

  const profile = mapCalculatorProfile(profileResponse.data as CalculatorProfileRow);

  const priceSetsResponse = await supabase
    .from("calculator_profile_price_sets")
    .select("*")
    .eq("calculator_profile_id", profile.id)
    .eq("region", "EU")
    .eq("currency_code", "EUR")
    .returns<CalculatorProfilePriceSetRow[]>();

  throwIfError(priceSetsResponse.error, "Failed to load calculator price sets");
  const priceSets = (priceSetsResponse.data ?? []).map(mapCalculatorProfilePriceSet);

  const printPricingSetCode = getPricingSetCode(priceSets, "print");
  const embroideryPricingSetCode = getPricingSetCode(priceSets, "embroidery");
  const deliveryPricingSetCode = getPricingSetCode(priceSets, "delivery");

  const garmentsResponse = await supabase
    .from("garments")
    .select("*")
    .eq("is_active", true)
    .order("code", { ascending: true })
    .returns<GarmentRow[]>();

  throwIfError(garmentsResponse.error, "Failed to load garments");

  const markupsResponse = await supabase
    .from("calculator_garment_markups")
    .select("*")
    .eq("calculator_profile_id", profile.id)
    .eq("is_active", true)
    .lte("valid_from", effectiveDate)
    .or(validToFilter)
    .returns<CalculatorGarmentMarkupRow[]>();

  throwIfError(markupsResponse.error, "Failed to load garment markups");

  const euPrintResponse = printPricingSetCode
    ? await supabase
        .from("eu_print_price_tiers")
        .select("*")
        .eq("pricing_set_code", printPricingSetCode)
        .eq("region", "EU")
        .eq("currency_code", "EUR")
        .eq("is_active", true)
        .lte("valid_from", effectiveDate)
        .or(validToFilter)
        .order("colour_count", { ascending: true })
        .order("quantity_min", { ascending: true })
        .returns<EuPrintPriceTierRow[]>()
    : { data: [], error: null };

  throwIfError(euPrintResponse.error, "Failed to load EU print tiers");

  const euEmbroideryResponse = embroideryPricingSetCode
    ? await supabase
        .from("eu_embroidery_pricing")
        .select("*")
        .eq("pricing_set_code", embroideryPricingSetCode)
        .eq("region", "EU")
        .eq("currency_code", "EUR")
        .eq("is_active", true)
        .lte("valid_from", effectiveDate)
        .or(validToFilter)
        .order("size_code", { ascending: true })
        .returns<EuEmbroideryPriceRow[]>()
    : { data: [], error: null };

  throwIfError(
    euEmbroideryResponse.error,
    "Failed to load EU embroidery pricing",
  );

  const feesResponse = await supabase
    .from("calculator_fees")
    .select("*")
    .eq("calculator_profile_id", profile.id)
    .eq("is_active", true)
    .lte("valid_from", effectiveDate)
    .or(validToFilter)
    .returns<CalculatorFeeRow[]>();

  throwIfError(feesResponse.error, "Failed to load calculator fees");

  const deliveryResponse = deliveryPricingSetCode
    ? await supabase
        .from("delivery_rates")
        .select("*")
        .eq("pricing_set_code", deliveryPricingSetCode)
        .eq("region", "EU")
        .eq("currency_code", "EUR")
        .eq("is_active", true)
        .lte("valid_from", effectiveDate)
        .or(validToFilter)
        .order("country", { ascending: true })
        .returns<DeliveryRateRow[]>()
    : { data: [], error: null };

  throwIfError(deliveryResponse.error, "Failed to load delivery rates");

  return {
    profile,
    priceSets,
    garments: (garmentsResponse.data ?? []).map(mapGarment),
    garmentMarkups: (markupsResponse.data ?? []).map(mapCalculatorGarmentMarkup),
    euPrintTiers: (euPrintResponse.data ?? []).map(mapEuPrintPriceTier),
    euEmbroideryPricing: (euEmbroideryResponse.data ?? []).map(
      mapEuEmbroideryPrice,
    ),
    fees: (feesResponse.data ?? []).map(mapCalculatorFee),
    deliveryRates: (deliveryResponse.data ?? []).map(mapDeliveryRate),
  };
}

export async function loadEuCalculatorReferenceData(
  supabase: CalculatorSupabaseClient,
  profileCode: Extract<CalculatorProfileCode, "EU_STANDARD" | "EU_US_CLIENTS">,
) {
  return loadCalculatorReferenceData(supabase, profileCode);
}
