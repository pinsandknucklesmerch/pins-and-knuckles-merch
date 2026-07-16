import assert from "node:assert/strict";
import test from "node:test";
import { calculateEuStandardPrice } from "../domain/euPricingEngine.ts";
import type {
  CalculatorReferenceData,
  EuCalculatorInput,
  EuCalculatorResult,
  EuPrintPriceTier,
} from "../domain/types.ts";

const PROFILE_ID = "profile-eu-standard";
const GARMENT_ID = "garment-hoodie";
const TSHIRT_ID = "garment-tshirt";

function buildEuPrintTiers(): EuPrintPriceTier[] {
  const rows = [
    [
      1,
      [
        [50, 99, 1.4, 1.54],
        [100, 249, 1.15, 1.26],
        [250, 499, 1, 1.1],
        [500, 999, 0.9, 0.99],
        [1000, 2000, 0.75, 0.82],
      ],
    ],
    [
      2,
      [
        [50, 99, 1.6, 1.76],
        [100, 249, 1.4, 1.54],
        [250, 499, 1.25, 1.38],
        [500, 999, 1.2, 1.32],
        [1000, 2000, 1.05, 1.16],
      ],
    ],
    [
      3,
      [
        [50, 99, 2.15, 2.37],
        [100, 249, 1.7, 1.87],
        [250, 499, 1.45, 1.6],
        [500, 999, 1.4, 1.54],
        [1000, 2000, 1.25, 1.38],
      ],
    ],
    [
      4,
      [
        [50, 99, 2.6, 2.86],
        [100, 249, 2.35, 2.59],
        [250, 499, 1.7, 1.87],
        [500, 999, 1.6, 1.76],
        [1000, 2000, 1.4, 1.54],
      ],
    ],
    [
      5,
      [
        [50, 99, 3.25, 3.58],
        [100, 249, 2.5, 2.92],
        [250, 499, 1.95, 2.14],
        [500, 999, 1.9, 2.09],
        [1000, 2000, 1.7, 1.87],
      ],
    ],
    [
      6,
      [
        [50, 99, 4.05, 4.46],
        [100, 249, 2.65, 2.75],
        [250, 499, 2.2, 2.42],
        [500, 999, 2.15, 3.27],
        [1000, 2000, 2, 2.2],
      ],
    ],
    [
      7,
      [
        [50, 99, 4.8, 5.28],
        [100, 249, 2.8, 3.08],
        [250, 499, 2.5, 2.75],
        [500, 999, 2.45, 2.7],
        [1000, 2000, 2.3, 2.53],
      ],
    ],
    [
      8,
      [
        [50, 99, 5.45, 6],
        [100, 249, 3.1, 3.41],
        [250, 499, 2.8, 3.08],
        [500, 999, 2.75, 3.03],
        [1000, 2000, 2.6, 2.86],
      ],
    ],
    [
      9,
      [
        [50, 99, 6.1, 6.71],
        [100, 249, 3.4, 3.74],
        [250, 499, 3.1, 3.41],
        [500, 999, 3.05, 3.36],
        [1000, 2000, 2.9, 3.19],
      ],
    ],
  ] as const;

  return rows.flatMap(([colourCount, tiers]) =>
    tiers.map(
      ([quantityMin, quantityMax, productionUnitPrice, customerUnitPrice]) => ({
        pricingSetCode: "EU_SCREEN_PRINT_V1",
        colourCount,
        quantityMin,
        quantityMax,
        productionUnitPrice,
        customerUnitPrice,
        currencyCode: "EUR",
      }),
    ),
  );
}

function createReferenceData(): CalculatorReferenceData {
  return {
    profile: {
      id: PROFILE_ID,
      code: "EU_STANDARD",
      name: "EU Standard",
      region: "EU",
      currencyCode: "EUR",
      vatRate: 27,
      minQuantity: 50,
      maxQuantity: 2000,
      maxColours: 9,
      tierStrategy: "range",
      copyFormatterCode: "eu_standard",
      supportsDelivery: true,
      supportsPkMarkup: true,
      supportsEmbroidery: true,
      supportsScreenSetup: false,
      isActive: true,
      isDeferred: false,
    },
    priceSets: [
      {
        calculatorProfileId: PROFILE_ID,
        priceKind: "print",
        pricingSetCode: "EU_SCREEN_PRINT_V1",
        region: "EU",
        currencyCode: "EUR",
      },
      {
        calculatorProfileId: PROFILE_ID,
        priceKind: "embroidery",
        pricingSetCode: "EU_EMBROIDERY_V1",
        region: "EU",
        currencyCode: "EUR",
      },
      {
        calculatorProfileId: PROFILE_ID,
        priceKind: "delivery",
        pricingSetCode: "EU_DELIVERY_V1",
        region: "EU",
        currencyCode: "EUR",
      },
    ],
    garments: [
      {
        id: GARMENT_ID,
        code: "GD57",
        altCode: "18500",
        brandName: "Gildan",
        name: "Gildan Heavy Blend Hooded Sweatshirt",
        colour: "Colours",
        garmentType: "HOODIE",
        eurBasePrice: 8.25,
        gbpPrice: null,
        extraSizeCost: 2,
        tags: "",
      },
      {
        id: TSHIRT_ID,
        code: "GD01",
        altCode: "64000",
        brandName: "Gildan",
        name: "Gildan SoftStyle Adult T-Shirt",
        colour: "Colours",
        garmentType: "TSHIRT",
        eurBasePrice: 2.25,
        gbpPrice: null,
        extraSizeCost: 0.7,
        tags: "",
      },
    ],
    garmentMarkups: [
      {
        calculatorProfileId: PROFILE_ID,
        garmentType: "HOODIE",
        markupValue: 5,
      },
      {
        calculatorProfileId: PROFILE_ID,
        garmentType: "TSHIRT",
        markupValue: 3,
      },
    ],
    euPrintTiers: buildEuPrintTiers(),
    euEmbroideryPricing: [
      {
        pricingSetCode: "EU_EMBROIDERY_V1",
        sizeCode: "small",
        label: "Small",
        productionUnitPrice: 1.25,
        customerUnitPrice: 1.5,
        currencyCode: "EUR",
      },
      {
        pricingSetCode: "EU_EMBROIDERY_V1",
        sizeCode: "medium",
        label: "Medium",
        productionUnitPrice: 1.85,
        customerUnitPrice: 2,
        currencyCode: "EUR",
      },
      {
        pricingSetCode: "EU_EMBROIDERY_V1",
        sizeCode: "large",
        label: "Large",
        productionUnitPrice: 2.5,
        customerUnitPrice: 2.75,
        currencyCode: "EUR",
      },
    ],
    fees: [
      {
        calculatorProfileId: PROFILE_ID,
        feeCode: "EU_DIGITISING",
        feeLabel: "Digitising",
        amount: 25,
        currencyCode: "EUR",
        appliesPer: "embroidery_item",
        costSide: "customer",
      },
      {
        calculatorProfileId: PROFILE_ID,
        feeCode: "EU_DIGITISING",
        feeLabel: "Digitising",
        amount: 23,
        currencyCode: "EUR",
        appliesPer: "embroidery_item",
        costSide: "production",
      },
      {
        calculatorProfileId: PROFILE_ID,
        feeCode: "EU_NECK_PRINT",
        feeLabel: "Neck print",
        amount: 0.7,
        currencyCode: "EUR",
        appliesPer: "unit",
        costSide: "customer",
      },
      {
        calculatorProfileId: PROFILE_ID,
        feeCode: "EU_NECK_PRINT",
        feeLabel: "Neck print",
        amount: 0.7,
        currencyCode: "EUR",
        appliesPer: "unit",
        costSide: "production",
      },
    ],
    deliveryRates: [],
  };
}

function createInput(
  overrides: Partial<EuCalculatorInput["items"][number]> = {},
): EuCalculatorInput {
  return {
    profileCode: "EU_STANDARD",
    items: [
      {
        id: "item-1",
        garmentId: GARMENT_ID,
        quantity: 50,
        printPositions: [{ position: "FRONT", colourCount: 1 }],
        embroideryItems: [],
        pkMarkupEnabled: false,
        pkMarkupPerUnit: 0,
        ...overrides,
      },
    ],
  };
}

function assertOk(result: EuCalculatorResult) {
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
  return result;
}

function assertErrorCodes(result: EuCalculatorResult, codes: string[]) {
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((error) => error.code),
    codes,
  );
}

function assertNearlyEqual(actual: number, expected: number) {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `Expected ${actual} to approximately equal ${expected}`,
  );
}

test("calculates 50 qty hoodie with 1-colour front", () => {
  const result = assertOk(
    calculateEuStandardPrice(createInput(), createReferenceData()),
  );

  assert.equal(result.items[0].baseCost, 412.5);
  assert.equal(result.items[0].garmentMarkupCost, 250);
  assert.equal(result.items[0].printProductionCost, 70);
  assert.equal(result.items[0].printCustomerCost, 77);
  assert.equal(result.totals.productionSubtotalExVat, 482.5);
  assert.equal(result.totals.customerSubtotalExVat, 739.5);
  assertNearlyEqual(result.totals.vatAmount, 199.665);
  assertNearlyEqual(result.totals.customerTotalIncVat, 939.165);
  assert.equal(result.totals.profitExVat, 257);
});

test("validates EU quantity boundaries", () => {
  const validQuantities = [50, 99, 100, 249, 250, 2000];

  for (const quantity of validQuantities) {
    assert.equal(
      calculateEuStandardPrice(createInput({ quantity }), createReferenceData()).ok,
      true,
      `quantity ${quantity} should be valid`,
    );
  }

  assertErrorCodes(
    calculateEuStandardPrice(createInput({ quantity: 49 }), createReferenceData()),
    ["INVALID_QUANTITY", "MISSING_PRINT_TIER"],
  );
  assertErrorCodes(
    calculateEuStandardPrice(createInput({ quantity: 2001 }), createReferenceData()),
    ["INVALID_QUANTITY", "MISSING_PRINT_TIER"],
  );
});

test("supports 1 through 9 EU print colours", () => {
  for (let colourCount = 1; colourCount <= 9; colourCount += 1) {
    const result = assertOk(
      calculateEuStandardPrice(
        createInput({ printPositions: [{ position: "FRONT", colourCount }] }),
        createReferenceData(),
      ),
    );

    assert.equal(result.items[0].printBreakdowns[0].colourCount, colourCount);
  }
});

test("calculates fixed neck print from EU neck fee rows", () => {
  const result = assertOk(
    calculateEuStandardPrice(
      createInput({ printPositions: [{ position: "NECK" }] }),
      createReferenceData(),
    ),
  );

  assert.equal(result.items[0].printProductionCost, 35);
  assert.equal(result.items[0].printCustomerCost, 35);
  assert.equal(result.totals.productionSubtotalExVat, 447.5);
  assert.equal(result.totals.customerSubtotalExVat, 697.5);
});

test("calculates small, medium, and large embroidery", () => {
  const expectations = {
    small: { production: 498, customer: 762.5 },
    medium: { production: 528, customer: 787.5 },
    large: { production: 560.5, customer: 825 },
  } as const;

  for (const [size, expected] of Object.entries(expectations)) {
    const result = assertOk(
      calculateEuStandardPrice(
        createInput({
          printPositions: [],
          embroideryItems: [{ size: size as "small" | "medium" | "large" }],
        }),
        createReferenceData(),
      ),
    );

    assert.equal(result.totals.productionSubtotalExVat, expected.production);
    assert.equal(result.totals.customerSubtotalExVat, expected.customer);
  }
});

test("calculates three embroidery items and digitising fees", () => {
  const result = assertOk(
    calculateEuStandardPrice(
      createInput({
        printPositions: [],
        embroideryItems: [{ size: "small" }, { size: "medium" }, { size: "large" }],
      }),
      createReferenceData(),
    ),
  );

  assert.equal(result.items[0].digitisingProductionCost, 69);
  assert.equal(result.items[0].digitisingCustomerCost, 75);
  assert.equal(result.totals.productionSubtotalExVat, 761.5);
  assert.equal(result.totals.customerSubtotalExVat, 1050);
});

test("adds optional PK markup to customer subtotal only", () => {
  const result = assertOk(
    calculateEuStandardPrice(
      createInput({ pkMarkupEnabled: true, pkMarkupPerUnit: 1.25 }),
      createReferenceData(),
    ),
  );

  assert.equal(result.items[0].pkMarkupCost, 62.5);
  assert.equal(result.totals.productionSubtotalExVat, 482.5);
  assert.equal(result.totals.customerSubtotalExVat, 802);
});

test("returns an explicit error for missing garment", () => {
  assertErrorCodes(
    calculateEuStandardPrice(
      createInput({ garmentId: "missing-garment" }),
      createReferenceData(),
    ),
    ["MISSING_GARMENT"],
  );
});

test("returns an explicit error for missing print tier", () => {
  const referenceData = createReferenceData();
  referenceData.euPrintTiers = referenceData.euPrintTiers.filter(
    (tier) => tier.colourCount !== 1,
  );

  assertErrorCodes(calculateEuStandardPrice(createInput(), referenceData), [
    "MISSING_PRINT_TIER",
  ]);
});

test("returns an explicit error for missing garment markup", () => {
  const referenceData = createReferenceData();
  referenceData.garmentMarkups = referenceData.garmentMarkups.filter(
    (markup) => markup.garmentType !== "HOODIE",
  );

  assertErrorCodes(calculateEuStandardPrice(createInput(), referenceData), [
    "MISSING_GARMENT_MARKUP",
  ]);
});

test("returns an explicit error for missing embroidery pricing", () => {
  const referenceData = createReferenceData();
  referenceData.euEmbroideryPricing = referenceData.euEmbroideryPricing.filter(
    (price) => price.sizeCode !== "small",
  );

  assertErrorCodes(
    calculateEuStandardPrice(
      createInput({ printPositions: [], embroideryItems: [{ size: "small" }] }),
      referenceData,
    ),
    ["MISSING_EMBROIDERY_PRICE"],
  );
});

test("returns an explicit error for missing required fee row", () => {
  const referenceData = createReferenceData();
  referenceData.fees = referenceData.fees.filter(
    (fee) => !(fee.feeCode === "EU_DIGITISING" && fee.costSide === "production"),
  );

  assertErrorCodes(
    calculateEuStandardPrice(
      createInput({ printPositions: [], embroideryItems: [{ size: "small" }] }),
      referenceData,
    ),
    ["MISSING_FEE"],
  );
});

test("rejects colour counts below 1", () => {
  assertErrorCodes(
    calculateEuStandardPrice(
      createInput({ printPositions: [{ position: "FRONT", colourCount: 0 }] }),
      createReferenceData(),
    ),
    ["INVALID_PRINT_COLOUR_COUNT"],
  );
});

test("rejects colour counts above 9", () => {
  assertErrorCodes(
    calculateEuStandardPrice(
      createInput({ printPositions: [{ position: "FRONT", colourCount: 10 }] }),
      createReferenceData(),
    ),
    ["INVALID_PRINT_COLOUR_COUNT"],
  );
});

test("mixed valid and invalid multi-item quote returns no partial totals", () => {
  const result = calculateEuStandardPrice(
    {
      profileCode: "EU_STANDARD",
      items: [
        createInput().items[0],
        {
          id: "item-2",
          garmentId: "missing-garment",
          quantity: 100,
          printPositions: [{ position: "FRONT", colourCount: 2 }],
          embroideryItems: [],
        },
      ],
    },
    createReferenceData(),
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.items, []);
  assert.equal(result.totals, null);
  assert.deepEqual(
    result.errors.map((error) => error.code),
    ["MISSING_GARMENT"],
  );
});

test("calculates multi-item totals", () => {
  const result = assertOk(
    calculateEuStandardPrice(
      {
        profileCode: "EU_STANDARD",
        items: [
          createInput().items[0],
          {
            id: "item-2",
            garmentId: TSHIRT_ID,
            quantity: 100,
            printPositions: [{ position: "FRONT", colourCount: 2 }],
            embroideryItems: [],
          },
        ],
      },
      createReferenceData(),
    ),
  );

  assert.equal(result.items.length, 2);
  assert.equal(result.totals.productionSubtotalExVat, 847.5);
  assert.equal(result.totals.customerSubtotalExVat, 1418.5);
});

test("preserves the 6-colour 500-999 customer price anomaly", () => {
  const result = assertOk(
    calculateEuStandardPrice(
      createInput({
        quantity: 500,
        printPositions: [{ position: "FRONT", colourCount: 6 }],
      }),
      createReferenceData(),
    ),
  );

  assert.equal(result.items[0].printBreakdowns[0].customerUnitPrice, 3.27);
  assert.equal(result.items[0].printCustomerCost, 1635);
  assert.equal(result.totals.customerSubtotalExVat, 8260);
});
