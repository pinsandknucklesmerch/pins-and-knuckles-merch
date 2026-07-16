export type CalculatorProfileCode = "EU_STANDARD" | "EU_US_CLIENTS" | "UK_TRADE";

export type CalculatorRegion = "EU" | "UK";

export type CurrencyCode = "EUR" | "GBP";

export type PriceKind = "print" | "embroidery" | "delivery";

export type GarmentType = "TSHIRT" | "LONGSLEEVE" | "HOODIE";

export type EuPrintPosition =
  | "FRONT"
  | "BACK"
  | "LEFT_SLEEVE"
  | "RIGHT_SLEEVE"
  | "NECK";

export type EuEmbroiderySize = "small" | "medium" | "large";

export type CalculatorValidationCode =
  | "INVALID_PROFILE"
  | "INVALID_QUANTITY"
  | "INVALID_PRINT_COLOUR_COUNT"
  | "MISSING_GARMENT"
  | "MISSING_GARMENT_PRICE"
  | "MISSING_GARMENT_MARKUP"
  | "MISSING_PRINT_TIER"
  | "MISSING_EMBROIDERY_PRICE"
  | "MISSING_FEE";

export type CalculatorValidationError = {
  code: CalculatorValidationCode;
  message: string;
  itemId?: string;
  field?: string;
};

export type CalculatorProfile = {
  id: string;
  code: CalculatorProfileCode;
  name: string;
  region: CalculatorRegion;
  currencyCode: CurrencyCode;
  vatRate: number | null;
  minQuantity: number;
  maxQuantity: number | null;
  maxColours: number | null;
  tierStrategy: "range" | "floor";
  copyFormatterCode: string;
  supportsDelivery: boolean;
  supportsPkMarkup: boolean;
  supportsEmbroidery: boolean;
  supportsScreenSetup: boolean;
  isActive: boolean;
  isDeferred: boolean;
};

export type CalculatorProfilePriceSet = {
  calculatorProfileId: string;
  priceKind: PriceKind;
  pricingSetCode: string;
  region: CalculatorRegion;
  currencyCode: CurrencyCode;
};

export type Garment = {
  id: string;
  code: string;
  altCode: string;
  brandName: string;
  name: string;
  colour: string;
  garmentType: GarmentType;
  eurBasePrice: number | null;
  gbpPrice: number | null;
  extraSizeCost: number | null;
  tags: string;
};

export type CalculatorGarmentMarkup = {
  calculatorProfileId: string;
  garmentType: GarmentType;
  markupValue: number;
};

export type EuPrintPriceTier = {
  pricingSetCode: string;
  colourCount: number;
  quantityMin: number;
  quantityMax: number;
  productionUnitPrice: number;
  customerUnitPrice: number;
  currencyCode: "EUR";
};

export type EuEmbroideryPrice = {
  pricingSetCode: string;
  sizeCode: EuEmbroiderySize;
  label: string;
  productionUnitPrice: number;
  customerUnitPrice: number;
  currencyCode: "EUR";
};

export type CalculatorFee = {
  calculatorProfileId: string;
  feeCode: "EU_DIGITISING" | "EU_NECK_PRINT" | "UK_SCREEN_SETUP" | "UK_EMBROIDERY_SETUP";
  feeLabel: string;
  amount: number;
  currencyCode: CurrencyCode;
  appliesPer: "embroidery_item" | "unit" | "screen";
  costSide: "production" | "customer" | "trade";
};

export type DeliveryRate = {
  pricingSetCode: string;
  country: string;
  currencyCode: "EUR";
  costPerBox: number;
  deliveryTime: string;
  vatRate: number;
};

export type CalculatorReferenceData = {
  profile: CalculatorProfile;
  priceSets: CalculatorProfilePriceSet[];
  garments: Garment[];
  garmentMarkups: CalculatorGarmentMarkup[];
  euPrintTiers: EuPrintPriceTier[];
  euEmbroideryPricing: EuEmbroideryPrice[];
  fees: CalculatorFee[];
  deliveryRates: DeliveryRate[];
};

export type EuPrintSelection = {
  position: EuPrintPosition;
  colourCount?: number;
};

export type EuEmbroiderySelection = {
  size: EuEmbroiderySize;
};

export type EuCalculatorItemInput = {
  id: string;
  garmentId: string | null;
  quantity: number;
  printPositions: EuPrintSelection[];
  embroideryItems?: EuEmbroiderySelection[];
  pkMarkupEnabled?: boolean;
  pkMarkupPerUnit?: number;
};

export type EuCalculatorInput = {
  profileCode: Extract<CalculatorProfileCode, "EU_STANDARD" | "EU_US_CLIENTS">;
  items: EuCalculatorItemInput[];
};

export type EuPrintCostBreakdown = {
  position: EuPrintPosition;
  colourCount: number | null;
  productionUnitPrice: number;
  customerUnitPrice: number;
  productionCost: number;
  customerCost: number;
};

export type EuEmbroideryCostBreakdown = {
  size: EuEmbroiderySize;
  productionUnitPrice: number;
  customerUnitPrice: number;
  productionCost: number;
  customerCost: number;
  digitisingProductionCost: number;
  digitisingCustomerCost: number;
};

export type EuCalculatorItemResult = {
  itemId: string;
  garmentId: string;
  quantity: number;
  baseCost: number;
  garmentMarkupCost: number;
  pkMarkupCost: number;
  printProductionCost: number;
  printCustomerCost: number;
  embroideryProductionCost: number;
  embroideryCustomerCost: number;
  digitisingProductionCost: number;
  digitisingCustomerCost: number;
  productionSubtotalExVat: number;
  customerSubtotalExVat: number;
  profitExVat: number;
  printBreakdowns: EuPrintCostBreakdown[];
  embroideryBreakdowns: EuEmbroideryCostBreakdown[];
};

export type EuCalculatorTotals = {
  productionSubtotalExVat: number;
  customerSubtotalExVat: number;
  vatRate: number;
  vatAmount: number;
  customerTotalIncVat: number;
  profitExVat: number;
};

export type EuCalculatorResult =
  | {
      ok: true;
      profileCode: Extract<CalculatorProfileCode, "EU_STANDARD" | "EU_US_CLIENTS">;
      currencyCode: "EUR";
      items: EuCalculatorItemResult[];
      totals: EuCalculatorTotals;
      errors: [];
    }
  | {
      ok: false;
      profileCode: Extract<CalculatorProfileCode, "EU_STANDARD" | "EU_US_CLIENTS">;
      currencyCode: "EUR";
      items: [];
      totals: null;
      errors: CalculatorValidationError[];
    };
