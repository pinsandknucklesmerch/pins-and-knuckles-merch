# Legacy Calculator Behaviour Confirmation

Scope: direct inspection of the legacy Pins Hub calculator implementation. This document separates implemented behavior from likely bugs, stale documentation, and business decisions that cannot be recovered from code.

## 1. EU Missing Pricing Tiers

### Confirmed Behaviour

When a non-neck print position has no matching print-price tier for the selected quantity and colour count, the EU calculator returns `0` for both production print price and customer/Pins print price. It does not show a missing-price error, does not mark the item invalid, and does not block quote copying as long as at least one garment is selected somewhere in the quote.

### Code Evidence

- File: `src/components/DesignCard.tsx`
- Function: `getPrintUnitPrices`
- Logic:

```ts
const tier = printPrices.find(
  (p) =>
    p.colorCount === colorCount &&
    design.quantity >= p.qtyMin &&
    design.quantity <= p.qtyMax
)

return {
  productionPrice: tier?.productionPrice ?? 0,
  pinsPrice: tier?.pinsPrice ?? 0,
  isFixedPrice: false
}
```

This is implemented behavior: `tier?.productionPrice ?? 0` and `tier?.pinsPrice ?? 0` make missing tiers zero-priced.

- File: `src/components/DesignCard.tsx`
- Function: `calculateDesignCosts`
- Logic:

```ts
const unitPrices = getPrintUnitPrices(position, design, printPrices)
prod += unitPrices.productionPrice * design.quantity
pins += unitPrices.pinsPrice * design.quantity
```

This is implemented behavior: zero unit prices flow into totals as zero cost.

- File: `src/components/DesignCard.tsx`
- Component/function: `DesignCard`, `updatePositionColorInput`, `normalizePositionColorInput`
- Logic:

```ts
const MIN_COLOR_COUNT = 1
const MAX_COLOR_COUNT = 9
const COLOR_COUNT_WARNING = "Acceptable color counts are between 1 and 9."
```

Colour counts outside 1-9 are corrected back to `1` on blur with `COLOR_COUNT_WARNING`. This prevents most invalid colour-count input through the UI, but the pricing function itself still handles missing rows by returning zero.

- File: `src/app/hub/calculators/CalculatorClient.tsx`
- Function: `handleCopyClick`
- Logic:

```ts
if (!hasGarmentSelected) return
const quoteFormatter = getQuoteFormatter(calculatorTitle)
const body = quoteFormatter({ designs, breakdowns, garments, currency: CURRENCY, vatRate })
await copyToClipboard(body)
```

Copy is blocked only when no design has a garment selected. There is no print-tier validity check before copy.

### Classification

Implemented behavior, with likely legacy bug risk: missing EU price tiers silently produce zero print cost and zero customer print price.

## 2. US Clients `+ base`

### Confirmed Behaviour

`+ base` is always included in US Clients copied quotes when a positions/embroidery summary exists, because `formatUsClientQuoteCopy` always passes the suffix string `" + base"` into `formatGarmentSummary`.

It is copy text only. There is no underbase input, no dark-garment detection, no garment colour conditional, no colour-count conditional, and no pricing adjustment connected to `+ base`.

### Code Evidence

- File: `src/app/hub/calculators/copyFormatters.ts`
- Function: `formatUsClientQuoteCopy`
- Logic:

```ts
const positionsText = formatPositionSummary(design, "us")
...
formatGarmentSummary(garment, positionsText, " + base")
```

Implemented behavior: the suffix is unconditional for the US copy formatter.

- File: `src/app/hub/calculators/copyFormatters.ts`
- Function: `formatGarmentSummary`
- Logic:

```ts
return `${garmentSummary}${positionsText ? ` (${positionsText}${suffix})` : ""}`
```

Implemented behavior: the suffix is appended inside parentheses only when `positionsText` is non-empty.

- File: `src/app/hub/calculators/copyFormatters.ts`
- Function: `getQuoteFormatter`
- Logic:

```ts
if (calculatorTitle === "US Clients Calculator") {
  return formatUsClientQuoteCopy
}

return formatEuQuoteCopy
```

Implemented behavior: US copy is selected by exact calculator title.

- Files searched for connected behavior:
  - `src/app/hub/calculators/*`
  - `src/components/DesignCard.tsx`
  - `prisma/*`
  - `PROJECT_CONTEXT.md`, `README.md`, `docs/ai-context/*`

No implemented underbase state, underbase field, dark-garment detector, garment colour conditional, or pricing formula tied to `+ base` was found. The calculation path remains `calculateDesignCosts` in `src/components/DesignCard.tsx`, which uses garment base price, garment type markup, print prices, optional PK markup, embroidery, and digitising fees only.

### Classification

Implemented copy behavior. Possible unresolved business intent: `+ base` may refer to dark-garment underbase, but no recoverable pricing/input rule exists in code.

## 3. UK Trade Invalid Items

### Confirmed Behaviour

Invalid UK Trade item partial costs are included in displayed aggregate totals because the totals reducer sums every breakdown before checking `hasValidPrice`. Only `totalQuantity` and `validItemCount` are gated by `breakdown.hasValidPrice`.

Invalid items are excluded from copied quotes because the UK Trade copy formatter returns `null` when `!breakdown.hasValidPrice`.

### Code Evidence

- File: `src/app/hub/calculators/uk/trade/UkTradeCalculatorClient.tsx`
- Function: `calculateUkTradeItemBreakdown`
- Validation conditions:

```ts
if (!garment) {
  missingReasons.push("Select garment.")
}

if (design.quantity < 50) {
  missingReasons.push("Minimum quantity 50.")
}

if (selectedPositions.length === 0 && selectedEmbroideryEntries.length === 0) {
  missingReasons.push("Select at least one print position or embroidery item.")
}
```

Additional validation during print lookup:

```ts
if (price.unitPrice === null) {
  missingReasons.push(`Missing price for ${getPrintPositionLabel(position)}.`)
}
```

Additional validation for garment price:

```ts
const garmentCost =
  garment && typeof garment.gbpPrice === "number"
    ? garment.gbpPrice * design.quantity
    : 0

if (garment && typeof garment.gbpPrice !== "number") {
  missingReasons.push("Missing GBP garment price.")
}
```

Final validity:

```ts
hasValidPrice: missingReasons.length === 0
```

- File: `src/app/hub/calculators/uk/trade/UkTradeCalculatorClient.tsx`
- Function/symbol: `totals`
- Logic:

```ts
for (const breakdown of breakdowns) {
  garmentCost += breakdown.garmentCost
  printCost += breakdown.printCost
  screenSetupScreenCount += breakdown.screenSetupScreenCount
  screenSetupCost += breakdown.screenSetupCost
  embroideryCost += breakdown.embroideryCost
  embroiderySetupCost += breakdown.embroiderySetupCost
  setupCost += breakdown.setupCost
  totalCost += breakdown.totalCost

  if (breakdown.hasValidPrice) {
    totalQuantity += breakdown.quantity
    validItemCount += 1
  }
}
```

Implemented behavior: aggregate money totals include invalid breakdown partials; quantity and item count exclude invalid items.

- File: `src/app/hub/calculators/uk/trade/UkTradeCalculatorClient.tsx`
- Function: local `formatUkTradeQuoteCopy`
- Logic:

```ts
const design = designs[index]
if (!design || !breakdown.hasValidPrice) return null
```

Implemented behavior: invalid UK Trade items are excluded from copied quote output.

### Classification

Implemented behavior, likely bug: displayed aggregate totals can include partial invalid-item costs while copied quotes omit invalid items.

## 4. Delivery Copy

### Confirmed Behaviour

The value passed into the copied field labelled `Cost Per Box` is `deliverySubtotalExclVat`, not the selected per-box rate. Therefore it is the complete delivery subtotal excluding VAT, including all boxes and optional delivery markup.

### Code Evidence

- File: `src/app/hub/calculators/CalculatorClient.tsx`
- Function/symbols: `deliveryBaseExclVat`, `deliveryMarkupExclVat`, `deliverySubtotalExclVat`, `handleDeliveryCopyClick`
- Logic:

```ts
const deliveryBaseExclVat = deliveryBoxCount * selectedDeliveryRate.cost
const deliveryMarkupExclVat = deliveryMarkupEnabled ? deliveryBoxCount * deliveryMarkupPerBox : 0
const deliverySubtotalExclVat = deliveryBaseExclVat + deliveryMarkupExclVat
...
const deliveryInfo = formatDeliveryCopy({
  country: selectedDeliveryRate.country,
  deliveryTime: selectedDeliveryRate.deliveryTime,
  boxCount: deliveryBoxCount,
  costPerBox: deliverySubtotalExclVat,
  totalInclVat: deliveryTotalInclVat,
  currency: CURRENCY
})
```

- File: `src/app/hub/calculators/copyFormatters.ts`
- Function: `formatDeliveryCopy`
- Logic:

```ts
`Cost Per Box: ${currency}${costPerBox.toFixed(2)} excl. VAT`,
`Total Delivery Cost Incl. VAT: ${currency}${totalInclVat.toFixed(2)}`,
```

### Worked Example

Germany is configured in `CalculatorClient::DELIVERY_RATES` as `cost: 25`, `deliveryTime: "2 days"`.

For Germany, 2 boxes, no markup:

```text
deliveryBaseExclVat = 2 * 25 = 50
deliveryMarkupExclVat = 0
deliverySubtotalExclVat = 50
deliveryVatAmount = 50 * 0.27 = 13.50
deliveryTotalInclVat = 63.50
```

Copied output field:

```text
Cost Per Box: €50.00 excl. VAT
Total Delivery Cost Incl. VAT: €63.50
```

The actual per-box price is `€25.00`; copied `€50.00` is the full subtotal excluding VAT.

### Classification

Likely legacy bug: label says per box, value is subtotal.

## 5. Extra-Size Garment Pricing

### Confirmed Behaviour

`extraSizeCost` is stored and edited in the garment directory but does not affect calculator calculations, quote totals, copy output, or UK Trade pricing.

### Code Evidence

- File: `prisma/schema.prisma`
- Model: `Garment`
- Field:

```prisma
extraSizeCost Float?
```

- File: `prisma/seed-data.ts`
- Symbol: `garmentSeedData`
- Behavior: seed rows include `extraSizeCost` values or `null`.

- File: `src/app/hub/garments/actions.ts`
- Functions: `addGarment`, `updateGarmentDetails`
- Logic:

```ts
const extraSizeCost = normalizeOptionalFloat(formData.get("extraSizeCost"))
...
extraSizeCost,
```

and:

```ts
extraSizeCost: normalizeOptionalFloat(formData.get("extraSizeCost")),
```

- File: `src/app/hub/garments/GarmentDirectoryClient.tsx`
- Component: `GarmentDirectoryClient`
- Directory display logic:

```tsx
{g.extraSizeCost ? `${EUR_CURRENCY}${g.extraSizeCost.toFixed(2)}` : "-"}
```

- File: `src/components/DesignCard.tsx`
- Function: `calculateDesignCosts`
- Calculation uses:
  - `garment.basePrice`
  - `garment.type`
  - `GarmentMarkup.markupValue`
  - `PrintPrice.productionPrice`
  - `PrintPrice.pinsPrice`
  - `pkMarkupPerUnit`
  - embroidery constants
  - digitising constants

It does not reference `garment.extraSizeCost`.

- File: `src/app/hub/calculators/uk/trade/UkTradeCalculatorClient.tsx`
- Function: `calculateUkTradeItemBreakdown`
- UK garment cost uses:

```ts
garment && typeof garment.gbpPrice === "number"
  ? garment.gbpPrice * design.quantity
  : 0
```

It does not reference `extraSizeCost`.

- Search result: no `extraSizeCost` matches in `src/app/hub/calculators`, `src/components/DesignCard.tsx`, or `src/app/hub/calculators/uk`.

### Classification

Implemented garment-directory metadata only. Any calculator use would require business confirmation.

## 6. EU Trade

### Confirmed Behaviour

No working EU Trade calculator exists in the current checked-out implementation. No EU Trade route, page component, calculator profile code, seed profile, or pricing dataset was found.

### Current Code Evidence

- File: `src/lib/calculator-profiles.ts`
- Symbol: `CALCULATOR_PROFILE_CODES`
- Implemented profile codes:

```ts
STANDARD_EU: "STANDARD_EU"
US_CLIENTS: "US_CLIENTS"
```

No EU trade code is present.

- File: `prisma/seed-data.ts`
- Symbols: `calculatorProfileSeedData`, `garmentMarkupSeedDataByCalculatorCode`
- Implemented calculator profiles:
  - `STANDARD_EU`
  - `US_CLIENTS`

No EU trade seed profile or EU trade markup set is present.

- Files:
  - `src/app/hub/calculators/eu/page.tsx`
  - `src/app/hub/calculators/eu/standard/page.tsx`
  - `src/app/hub/calculators/eu/us-clients/page.tsx`

Implemented EU routes are:
  - `/hub/calculators/eu/standard`
  - `/hub/calculators/eu/us-clients`

No `/hub/calculators/eu/trade` route exists.

### Local Branch Search

Visible local branches were checked during the legacy audit.

`git grep` across those visible local branches found UK Trade implementations and documentation, but no working EU Trade route/profile implementation. Matches were UK Trade paths such as `src/app/hub/calculators/uk/trade/*` and documentation references to `/hub/calculators/uk/trade`.

### References Only

- File: `PROJECT_CONTEXT.md`
- Reference:

```text
EU embroidery markup per unit is `3`, unless the calculator title contains `trade`.
```

This is stale documentation or unresolved business intent. The implemented EU embroidery calculation in `src/components/DesignCard.tsx::calculateDesignCosts` does not inspect calculator title and does not apply a trade-specific embroidery markup. It uses fixed `DESIGN_EMBROIDERY_SIZE_PRICING` constants.

### Recoverable Rules

Recoverable from code:

- EU Standard and US Clients shared calculation rules.
- UK Trade calculation rules.
- The existence of a stale note implying some intended trade-specific EU embroidery behavior.

Not recoverable from code:

- EU Trade route.
- EU Trade profile code.
- EU Trade garment markups.
- EU Trade print pricing.
- EU Trade embroidery pricing or markup formula.
- EU Trade copy/export behavior.
- EU Trade UI behavior.

### Classification

No implemented behavior. The only EU Trade-like evidence is stale documentation/unresolved business intent.

## Summary Classification

| Category | Findings |
|---|---|
| Facts confirmed from code | EU missing print tiers return zero via `getPrintUnitPrices`; EU copy only blocks when no garment is selected; US Clients `+ base` is unconditional copy suffix; UK invalid items are omitted from copy; `extraSizeCost` is directory/schema/admin metadata only; no working EU Trade calculator exists in current code. |
| Likely legacy bugs | EU missing print tiers silently zero out print cost; UK aggregate totals include partial invalid-item costs while copy excludes invalid items; delivery copy labels full subtotal as `Cost Per Box`; stale `PROJECT_CONTEXT.md` note describes EU trade title behavior not implemented in code. |
| Decisions requiring business confirmation | Whether EU missing tiers should be invalid instead of zero; whether US `+ base` should be conditional on dark garments/underbase; whether UK invalid item costs should be excluded from displayed totals; whether delivery copy should preserve or fix the per-box label; whether extra-size costs should affect calculator pricing; whether EU Trade should be rebuilt and what its pricing rules should be. |
