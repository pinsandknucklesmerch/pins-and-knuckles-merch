import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";
import type {
  CalculatorProfileCode,
  CalculatorReferenceData,
  UkTradeReferenceData,
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
type UkTradePrintTierRow = Tables<"uk_trade_print_price_tiers">;
type UkTradeEmbroideryTierRow = Tables<"uk_trade_embroidery_pricing">;

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

export async function loadUkTradeCalculatorReferenceData(supabase: CalculatorSupabaseClient): Promise<UkTradeReferenceData> {
  const effectiveDate = getUtcDateString();
  const validToFilter = `valid_to.is.null,valid_to.gte.${effectiveDate}`;
  const base = await loadProfileBase(supabase, "UK_TRADE", effectiveDate, validToFilter);
  const printSet = getPricingSetCode(base.priceSets, "print");
  const embroiderySet = getPricingSetCode(base.priceSets, "embroidery");
  const [prints, embroidery] = await Promise.all([
    supabase.from("uk_trade_print_price_tiers").select("*").eq("pricing_set_code", printSet ?? "").eq("is_active", true).lte("valid_from", effectiveDate).or(validToFilter).returns<UkTradePrintTierRow[]>(),
    supabase.from("uk_trade_embroidery_pricing").select("*").eq("pricing_set_code", embroiderySet ?? "").eq("is_active", true).lte("valid_from", effectiveDate).or(validToFilter).returns<UkTradeEmbroideryTierRow[]>(),
  ]);
  throwIfError(prints.error, "Failed to load UK print tiers"); throwIfError(embroidery.error, "Failed to load UK embroidery tiers");
  return { ...base, printTiers: (prints.data ?? []).map((row) => ({ pricingSetCode: row.pricing_set_code, positionCode: row.position_code as "STANDARD" | "NECK_PRINT_STANDARD" | "NECK_PRINT_TRANSFER", colourCount: row.colour_count, quantityTier: Number(row.quantity_tier), unitPrice: Number(row.unit_price), setupScreenCountStrategy: row.setup_screen_count_strategy as "colour_count" | "one" | "none" })), embroideryTiers: (embroidery.data ?? []).map((row) => ({ pricingSetCode: row.pricing_set_code, stitchCount: Number(row.stitch_count), isExtra1000Stitches: row.is_extra_1000_stitches, quantityTier: Number(row.quantity_tier), unitPrice: Number(row.unit_price) })) };
}

async function loadProfileBase(supabase: CalculatorSupabaseClient, code: "UK_TRADE", effectiveDate: string, validToFilter: string) {
  const profileResponse = await supabase.from("calculator_profiles").select("*").eq("code", code).eq("is_active", true).maybeSingle();
  throwIfError(profileResponse.error, "Failed to load calculator profile"); if (!profileResponse.data) throw new Error(`Calculator profile not found: ${code}`);
  const profile = mapCalculatorProfile(profileResponse.data as CalculatorProfileRow);
  const [sets, garments, fees] = await Promise.all([
    supabase.from("calculator_profile_price_sets").select("*").eq("calculator_profile_id", profile.id).returns<CalculatorProfilePriceSetRow[]>(),
    supabase.from("garments").select("*").eq("is_active", true).order("code").returns<GarmentRow[]>(),
    supabase.from("calculator_fees").select("*").eq("calculator_profile_id", profile.id).eq("is_active", true).lte("valid_from", effectiveDate).or(validToFilter).returns<CalculatorFeeRow[]>(),
  ]);
  throwIfError(sets.error, "Failed to load calculator price sets"); throwIfError(garments.error, "Failed to load garments"); throwIfError(fees.error, "Failed to load calculator fees");
  return { profile, priceSets: (sets.data ?? []).map(mapCalculatorProfilePriceSet), garments: (garments.data ?? []).map(mapGarment), fees: (fees.data ?? []).map(mapCalculatorFee) };
}
