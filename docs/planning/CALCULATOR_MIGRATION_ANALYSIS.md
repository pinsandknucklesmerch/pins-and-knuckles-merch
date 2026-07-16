# Calculator Migration Analysis

Source repository inspected: Legacy Pins Hub Next.js App Router app.

This document is analysis only. It preserves observed behavior from source and does not propose Prisma for the rebuild.

## 1. Calculator Inventory

### EU Standard

| Field | Legacy behavior |
|---|---|
| Route | `/hub/calculators/eu/standard` from `src/app/hub/calculators/eu/standard/page.tsx` |
| Purpose | Customer quote calculator using EUR garment prices, print pricing, garment-type markup, optional PK markup, embroidery, digitising, and delivery helper. |
| Currency | `€`, hardcoded as `CURRENCY` in `src/app/hub/calculators/CalculatorClient.tsx`. |
| VAT behavior | `27%`, hardcoded as `vatRate = 27` in `CalculatorClient`; copied EU quote also hardcodes `1.27` in `copyFormatters.ts::formatEuQuoteCopy`. |
| Minimum quantities | UI input has `min={50}` in `DesignCard`; price lookup only has tiers for 50-2000 in `PrintPrice`; quantities below 50 produce zero print price because no tier matches. |
| Supported garment types | `TSHIRT`, `LONGSLEEVE`, `HOODIE` from `prisma/schema.prisma::GarmentType`. Seed data has some hoodies/caps/totes typed as `TSHIRT`, so behavior follows stored `Garment.type`, not product category text. |
| Supported print positions | `FRONT`, `BACK`, `LEFT_SLEEVE`, `RIGHT_SLEEVE`, `NECK` from `src/components/DesignCard.tsx::PRINT_POSITIONS`. |
| Supported colour counts | 1-9 from `DesignCard::MIN_COLOR_COUNT`/`MAX_COLOR_COUNT`; `NECK` is fixed and ignores colour tier. |
| Embroidery support | Up to three selectable embroidery items: `embroidery1`, `embroidery2`, `embroidery3`; sizes `small`, `medium`, `large`. |
| Setup/digitising fees | Customer digitising `€25` per selected embroidery; production digitising `€23` per selected embroidery from `DesignCard::EMBROIDERY_CUSTOMER_DIGITIZING_FEE` and `EMBROIDERY_PRODUCTION_DIGITIZING_COST`. |
| Markup rules | Garment type markup from `CalculatorProfile` `STANDARD_EU`: hoodie `5`, longsleeve `3.5`, tshirt `3`. Optional PK markup is a per-unit user input multiplied by quantity. |
| Delivery behavior | Sales helper only; does not affect order totals. Country rates and delivery days hardcoded in `CalculatorClient::DELIVERY_RATES`; optional delivery markup per box; VAT 27% added to delivery helper subtotal. |
| Output/copy actions | Click Pins Price card copies `formatEuQuoteCopy`; delivery helper copies `formatDeliveryCopy`; clipboard uses `navigator.clipboard.writeText` with textarea fallback; Sonner toast. |

### EU US Clients

| Field | Legacy behavior |
|---|---|
| Route | `/hub/calculators/eu/us-clients` from `src/app/hub/calculators/eu/us-clients/page.tsx` |
| Purpose | EUR calculator variant for US clients. It shares the EU calculator component and data model but uses different garment markups and copy format. |
| Currency | `€`, hardcoded in shared `CalculatorClient`. |
| VAT behavior | Still `27%`; display and calculations use shared `vatRate = 27`; copy uses `formatUsClientQuoteCopy` with `vatRate` passed from `CalculatorClient`. |
| Minimum quantities | Same as EU Standard: UI min 50; print data tiers 50-2000. |
| Supported garment types | Same Prisma enum and garment records as EU Standard. |
| Supported print positions | Same `PRINT_POSITIONS`. |
| Supported colour counts | Same 1-9 plus fixed neck price. |
| Embroidery support | Same three embroidery items and size pricing. |
| Setup/digitising fees | Same per-embroidery digitising fees; copy displays digitising fee incl. VAT. |
| Markup rules | `CalculatorProfile` `US_CLIENTS`: hoodie `4`, longsleeve `3`, tshirt `2`. Optional PK markup same shared behavior. |
| Delivery behavior | Same shared delivery helper. |
| Output/copy actions | `getQuoteFormatter(calculatorTitle)` chooses `formatUsClientQuoteCopy` when title lowercased includes `"us clients"`. US copy adds `" + base"` inside the garment/work summary. |

### EU Trade

No implemented EU Trade calculator was found. There is no route under `src/app/hub/calculators/eu/trade`, no `CALCULATOR_PROFILE_CODES` entry, and no seed profile for EU trade. `PROJECT_CONTEXT.md` contains a stale note saying EU embroidery markup is `3` unless calculator title contains `trade`, but no source code implements title-based embroidery pricing in `DesignCard::calculateDesignCosts`; embroidery prices are fixed by `DESIGN_EMBROIDERY_SIZE_PRICING`.

### UK Trade

| Field | Legacy behavior |
|---|---|
| Route | `/hub/calculators/uk/trade` from `src/app/hub/calculators/uk/trade/page.tsx` |
| Purpose | GBP trade calculator for garments, screen print, inside neck print, embroidery, and setup costs. |
| Currency | `£`, hardcoded as `CURRENCY` in `UkTradeCalculatorClient`. |
| VAT behavior | No VAT is added. UI and copy label totals as `excl VAT`/`ex vat`. |
| Minimum quantities | UI quantity min `50`; breakdown invalid if `design.quantity < 50` and missing reason `"Minimum quantity 50."`; UK print and embroidery lookup returns null below first tier. |
| Supported garment types | UK data selects garments only by `ukTradeGarmentSelect`; it uses `gbpPrice`, not garment type markups. |
| Supported print positions | `FRONT`, `BACK`, `LEFT_SLEEVE`, `RIGHT_SLEEVE`, `NECK_PRINT_STANDARD`, `NECK_PRINT_TRANSFER` from `uk/trade/types.ts::UK_TRADE_PRINT_POSITIONS`. |
| Supported colour counts | Standard positions 1-10. Neck standard is fixed 1 colour. Neck transfer is fixed transfer. |
| Embroidery support | Up to three embroidery items from `UkTradeDesignCard::UK_TRADE_EMBROIDERY_ITEMS`; user enters stitch count per item, min 7000. |
| Setup/digitising fees | Screen setup `£20` per setup screen from `UK_TRADE_SCREEN_SETUP_PER_SCREEN`; embroidery setup `£30` per embroidery item from `UK_TRADE_EMBROIDERY_SETUP_PER_ITEM`. |
| Markup rules | No garment-type markup and no PK markup. Total is trade cost only. |
| Delivery behavior | None. |
| Output/copy actions | Click Total Cost card copies `UkTradeCalculatorClient::formatUkTradeQuoteCopy`; invalid items are omitted from copy. |

## 2. File Map

| Path | Responsibility | Used by | Shared/specific |
|---|---|---|---|
| `src/app/hub/calculators/page.tsx` | Region menu for EU/UK calculators. | All calculator navigation | Shared route menu |
| `src/app/hub/calculators/eu/page.tsx` | EU calculator menu. | EU Standard, EU US Clients | EU menu |
| `src/app/hub/calculators/eu/standard/page.tsx` | Standard EU route metadata and profile code. | EU Standard | Specific route |
| `src/app/hub/calculators/eu/us-clients/page.tsx` | US Clients route metadata and profile code. | EU US Clients | Specific route |
| `src/app/hub/calculators/eu/standard/loading.tsx` | Re-exports shared calculator loading skeleton. | EU Standard | Shared |
| `src/app/hub/calculators/eu/us-clients/loading.tsx` | Re-exports shared calculator loading skeleton. | EU US Clients | Shared |
| `src/app/hub/calculators/CalculatorPageContent.tsx` | Server component: calls `connection()`, loads calculator reference data, renders `CalculatorClient`. | EU Standard, EU US Clients | Shared EU |
| `src/app/hub/calculators/CalculatorClient.tsx` | Shared EU client state, totals, VAT, delivery helper, copy, result panels. | EU Standard, EU US Clients | Shared EU |
| `src/components/DesignCard.tsx` | Shared EU item editor, garment selector, print/embroidery controls, EU calculation helpers/types. | EU Standard, EU US Clients | Shared EU with business logic |
| `src/app/hub/calculators/data.ts` | Cached Prisma loader for garments, print prices, calculator profile markups. | EU Standard, EU US Clients | Shared EU data |
| `src/app/hub/calculators/copyFormatters.ts` | EU, US, UK Trade, and delivery copy formatters. | All calculators | Shared formatting |
| `src/app/hub/calculators/copyFormatters.fixtures.md` | Existing stable copy examples for EU Standard and US Clients. | Documentation/tests reference | Shared reference |
| `src/app/hub/calculators/displayStandards.ts` | Display labels, amount formatting, item label fallback. | EU and UK Trade clients | Shared display/copy helper |
| `src/app/hub/calculators/CalculatorLoading.tsx` | Loading skeleton. | EU Standard, EU US Clients | Shared EU |
| `src/app/hub/calculators/uk/page.tsx` | UK calculator menu. | UK Trade | UK menu |
| `src/app/hub/calculators/uk/trade/page.tsx` | UK Trade route, metadata, server garment loading. | UK Trade | Specific |
| `src/app/hub/calculators/uk/trade/data.ts` | Cached Prisma garment loader selecting GBP fields. | UK Trade | Specific data |
| `src/app/hub/calculators/uk/trade/types.ts` | UK Trade garment select type and print position constants. | UK Trade | Specific types/config |
| `src/app/hub/calculators/uk/trade/UkTradeCalculatorClient.tsx` | UK Trade client state, totals, validation, copy, breakdowns. | UK Trade | Specific with business logic |
| `src/app/hub/calculators/uk/trade/UkTradeDesignCard.tsx` | UK Trade item editor, garment selector, print/embroidery controls. | UK Trade | Specific UI/state |
| `src/app/hub/calculators/uk/tradeScreenPrintData.ts` | UK Trade screen print tiers, setup rules, neck print prices. | UK Trade | Specific pricing engine/data |
| `src/app/hub/calculators/uk/tradeEmbroideryData.ts` | UK Trade stitch-count embroidery tiers/setup. | UK Trade | Specific pricing engine/data |
| `docs/uk-trade-prints.csv` | CSV reference copy of UK Trade print matrix. | UK Trade reference | Specific reference |
| `docs/uk-trade-embroidery.csv` | CSV reference copy of UK Trade embroidery matrix. | UK Trade reference | Specific reference |
| `src/lib/calculator-profiles.ts` | Profile code constants: `STANDARD_EU`, `US_CLIENTS`. | EU calculators, garment directory | Shared config |
| `src/lib/db.ts` | Prisma client and PostgreSQL guards. | All DB-backed surfaces | Shared DB |
| `src/app/hub/garments/data.ts` | Cached garment directory data with Standard EU markup visibility. | Garment admin; affects calculators via shared garments | Shared garment data |
| `src/app/hub/garments/actions.ts` | Add/update/delete garments; revalidates garment and calculator caches. | Garment admin; calculator data freshness | Shared garment mutations |
| `src/app/hub/garments/GarmentDirectoryClient.tsx` | Garment admin UI including EUR/GBP prices and tags. | Garment data management | Shared dependency |
| `prisma/schema.prisma` | Legacy DB schema for garments, markups, profiles, print prices, historical order/design models. | EU and UK data | Legacy DB |
| `prisma/seed-data.ts` | Seeded garments, calculator profiles, markups, EU print prices. | Initial DB data | Legacy seed data |
| `prisma/seed.ts` | Destructive seed script for local database. | Local setup only | Legacy tooling |
| `prisma/migrations/*` | PostgreSQL migration history; relevant migrations add profiles, GBP price, reference data. | Legacy DB history | Legacy |
| `prisma/sqlite-migrations-archive/*` | Old SQLite migration archive. | None active | Legacy-only |
| `package.json` | Dependencies: Next, React, Prisma, pg, Sonner; Excel/PDF packages not used by calculators. | Runtime/tooling | Shared |

## 3. Component Map

### `CalculatorPageContent`

- Source: `src/app/hub/calculators/CalculatorPageContent.tsx`.
- Inputs: `calculatorCode`, `title`, `backHref`.
- State owned: none.
- Calculations: none.
- Data behavior: calls `connection()` then `getCalculatorReferenceData(calculatorCode)`.
- Children: `BackLink`, page header, `CalculatorClient`.
- Reusable responsibility: EU calculator route shell and server data bridge.
- Legacy coupling to avoid: ties route title string to client copy selection through `CalculatorClient`/`getQuoteFormatter`.

### `CalculatorClient`

- Source: `src/app/hub/calculators/CalculatorClient.tsx`.
- Inputs: `garments`, `printPrices`, `garmentMarkups`, `calculatorTitle`.
- State owned: `designs`, breakdown open/closed, delivery helper toggle, box capacity modal, selected delivery country, box count, delivery markup toggle/input.
- Calculations: aggregates `calculateDesignCosts`; computes production subtotal, customer subtotal, VAT, customer total incl. VAT, profit, delivery subtotal/VAT/total.
- Child components: multiple `DesignCard` instances.
- Reusable responsibility: EU quote workspace, result panels, delivery helper, copy action.
- Legacy coupling to avoid: business formulas and delivery constants live inside React; VAT/currency hardcoded; formatter choice depends on human page title.

### `DesignCard`

- Source: `src/components/DesignCard.tsx`.
- Inputs: `design`, `garments`, optional `itemNumber`, `onChange`, optional `onRemove`.
- State owned: local colour input strings and `colorError`.
- Calculations: exported `getPrintUnitPrices` and `calculateDesignCosts`; local normalization of colour input, PK markup input, embroidery selection.
- Child components: internal `GarmentSelector`.
- Reusable responsibility: item editor and current EU pricing helper container.
- Legacy coupling to avoid: React file exports domain types and calculation functions; garment selector and price engine are mixed; `PrintPrice` and `GarmentMarkup` Prisma types leak into UI.

### `GarmentSelector` in `DesignCard`

- Inputs: `garments`, selected `value`, `onChange`.
- State owned: search query and dropdown open state.
- Calculations: search normalization across name, code, alt code, brand, color, tags.
- Child components: none.
- Reusable responsibility: searchable garment picker.
- Legacy coupling to avoid: tied to Prisma `Garment` shape and app-specific display text.

### `UkTradeCalculatorClient`

- Source: `src/app/hub/calculators/uk/trade/UkTradeCalculatorClient.tsx`.
- Inputs: `garments`.
- State owned: UK trade `designs`.
- Calculations: `calculateUkTradeItemBreakdown`, totals aggregation, UK copy formatting.
- Child components: `UkTradeDesignCard`.
- Reusable responsibility: UK trade quote workspace.
- Legacy coupling to avoid: copy formatter is local while another unused UK formatter exists in `copyFormatters.ts`; pricing/validation are embedded in React client file.

### `UkTradeDesignCard`

- Source: `src/app/hub/calculators/uk/trade/UkTradeDesignCard.tsx`.
- Inputs: `design`, `garments`, optional `itemNumber`, `onChange`, optional `onRemove`.
- State owned: colour input strings, embroidery stitch-count input strings, `colorError`.
- Calculations: validates/normalizes colour count 1-10 and stitch count min 7000; toggles standard and neck print positions.
- Child components: internal UK `GarmentSelector`.
- Reusable responsibility: UK trade item editor.
- Legacy coupling to avoid: duplicated garment selector and item label logic from EU card.

### `GarmentDirectoryClient`

- Source: `src/app/hub/garments/GarmentDirectoryClient.tsx`.
- Inputs: `initialGarments`.
- State owned: search, add/edit modal state, submitting/updating/deleting flags.
- Calculations: search normalization; display formatting of GBP/EUR prices and connected Standard EU markup.
- Child components: none.
- Reusable responsibility: admin surface for garment records used by calculators.
- Legacy coupling to avoid: calculator data management is implicit through shared `Garment` rows and cache revalidation.

### Hierarchies

EU Standard:

```text
/hub/calculators/eu/standard/page.tsx
└─ CalculatorPageContent(calculatorCode=STANDARD_EU, title="Standard EU Calculator")
   ├─ getCalculatorReferenceData("STANDARD_EU")
   ├─ BackLink
   └─ CalculatorClient
      ├─ DesignCard[]
      │  └─ GarmentSelector
      ├─ Delivery helper
      ├─ Box capacity modal
      └─ Result/breakdown/copy panels
```

EU US Clients:

```text
/hub/calculators/eu/us-clients/page.tsx
└─ CalculatorPageContent(calculatorCode=US_CLIENTS, title="US Clients Calculator")
   └─ same shared CalculatorClient/DesignCard hierarchy
```

UK Trade:

```text
/hub/calculators/uk/trade/page.tsx
└─ getUkTradeCalculatorGarments()
└─ UkTradeCalculatorClient
   └─ UkTradeDesignCard[]
      └─ GarmentSelector
   └─ Result/breakdown/copy panels
```

## 4. Complete Business Logic

### EU Standard and EU US Clients

Source symbols:

- `src/components/DesignCard.tsx::getPrintUnitPrices`
- `src/components/DesignCard.tsx::calculateDesignCosts`
- `src/app/hub/calculators/CalculatorClient.tsx::orderTotals`
- `src/app/hub/calculators/CalculatorClient.tsx::pinsSubtotalExclVat`
- `src/app/hub/calculators/CalculatorClient.tsx::productionSubtotalExclVat`
- `src/app/hub/calculators/CalculatorClient.tsx::delivery*`
- `src/app/hub/calculators/copyFormatters.ts::formatEuQuoteCopy`
- `src/app/hub/calculators/copyFormatters.ts::formatUsClientQuoteCopy`

Per design:

```ts
prod = 0
pins = 0
for each position in design.positions:
  if design.positions[position] > 0:
    unitPrices = getPrintUnitPrices(position, design, printPrices)
    prod += unitPrices.productionPrice * design.quantity
    pins += unitPrices.pinsPrice * design.quantity

garment = garments.find(g.id === design.garmentId)
baseCost = garment ? garment.basePrice * quantity : 0

markup = garment ? garmentMarkups.find(m.garmentType === garment.type) : undefined
markupCost = markup ? markup.markupValue * quantity : 0

pkMarkupCost = design.pkMarkupEnabled
  ? (design.pkMarkupPerUnit ?? 0) * quantity
  : 0

embroideryEntries = selected embroidery1/2/3 entries
embroideryCost = sum(customerUnitCost[size] * quantity)
embroideryProductionCost = sum(productionUnitCost[size] * quantity)
digitizingFee = embroideryEntries.length * 25
digitizingProductionCost = embroideryEntries.length * 23
```

Quantity tier selection:

```ts
if position === "NECK":
  productionPrice = 0.70
  pinsPrice = 0.70
  isFixedPrice = true
else:
  colorCount = design.positions[position] || 0
  tier = printPrices.find(
    p.colorCount === colorCount &&
    quantity >= p.qtyMin &&
    quantity <= p.qtyMax
  )
  productionPrice = tier?.productionPrice ?? 0
  pinsPrice = tier?.pinsPrice ?? 0
```

Underbase/base rules:

- No production underbase or dark garment price adjustment exists in calculator math.
- US Clients copy appends `" + base"` to the garment summary suffix in `formatUsClientQuoteCopy`; it is copy-only and does not alter calculation.

Neck print rules:

- EU neck print uses fixed `NECK_PRINT_UNIT_PRICE = 0.7` for production and customer pins price.
- Neck print does not add screen count or setup in EU calculators.

Embroidery:

| Size | Production unit cost | Customer unit cost |
|---|---:|---:|
| Small | 1.25 | 1.50 |
| Medium | 1.85 | 2.00 |
| Large | 2.50 | 2.75 |

Order totals:

```ts
orderTotals.production = sum(b.productionCost)
orderTotals.pins = sum(b.pinsCost)
orderTotals.base = sum(b.baseCost)
orderTotals.markup = sum(b.markupCost)
orderTotals.pkMarkup = sum(b.pkMarkupCost)
orderTotals.embroidery = sum(b.embroideryCost)
orderTotals.digitizing = sum(b.digitizingFee)
orderTotals.embroideryProduction = sum(b.embroideryProductionCost)
orderTotals.digitizingProduction = sum(b.digitizingProductionCost)

productionSubtotalExclVat =
  production + base + embroideryProduction + digitizingProduction

pinsSubtotalExclVat =
  pins + base + markup + pkMarkup + embroidery + digitizing

pinsTotalInclVat = pinsSubtotalExclVat * 1.27
pinsVatAmount = pinsTotalInclVat - pinsSubtotalExclVat
pinsProfit = pinsSubtotalExclVat - productionSubtotalExclVat
```

Missing-price and invalid-state handling:

- No explicit EU error is emitted for missing print tier; missing print tier becomes unit price `0`.
- No garment selected gives `baseCost = 0`, `markupCost = 0`; result panel remains mounted but hidden by opacity until at least one design has a garment.
- Quantity below 50 is possible if user enters it despite UI min; it typically yields zero print price because seed tiers begin at 50.
- Colour input rejects values outside 1-9 and shows `COLOR_COUNT_WARNING`.
- PK markup input accepts optional negative decimal due regex `/^-?\d*\.?\d*$/`.

Rounding/formatting:

- Display and copy use `toFixed(2)`.
- EU totals are calculated with full JS numbers, then formatted.
- `formatBreakdownUnitAmount(currency, value)` returns `${currency}${value.toFixed(2)}/unit`.

Delivery helper:

```ts
deliveryBaseExclVat = deliveryBoxCount * selectedDeliveryRate.cost
deliveryMarkupExclVat = deliveryMarkupEnabled
  ? deliveryBoxCount * parsedMarkupPerBox
  : 0
deliverySubtotalExclVat = deliveryBaseExclVat + deliveryMarkupExclVat
deliveryVatAmount = deliverySubtotalExclVat * 0.27
deliveryTotalInclVat = deliverySubtotalExclVat + deliveryVatAmount
```

Delivery helper is excluded from `pinsSubtotalExclVat` and `productionSubtotalExclVat`.

### UK Trade

Source symbols:

- `src/app/hub/calculators/uk/trade/UkTradeCalculatorClient.tsx::calculateUkTradeItemBreakdown`
- `src/app/hub/calculators/uk/trade/UkTradeCalculatorClient.tsx::totals`
- `src/app/hub/calculators/uk/trade/UkTradeCalculatorClient.tsx::formatUkTradeQuoteCopy`
- `src/app/hub/calculators/uk/tradeScreenPrintData.ts::getUkTradePrintPositionPrice`
- `src/app/hub/calculators/uk/tradeScreenPrintData.ts::getUkTradePricingColorCount`
- `src/app/hub/calculators/uk/tradeScreenPrintData.ts::getUkTradeSetupScreenCount`
- `src/app/hub/calculators/uk/tradeEmbroideryData.ts::getUkTradeEmbroideryPrice`

Per item:

```ts
garment = garments.find(id)
selectedPositions = positions with colorCount > 0
selectedEmbroideryEntries = embroideryItems with stitchCount
missingReasons = []

if !garment: missingReasons.push("Select garment.")
if quantity < 50: missingReasons.push("Minimum quantity 50.")
if selectedPositions.length === 0 && selectedEmbroideryEntries.length === 0:
  missingReasons.push("Select at least one print position or embroidery item.")

printCost = 0
screenSetupScreenCount = 0
for each [position, colorCount]:
  pricingColorCount = getUkTradePricingColorCount(position, colorCount)
  price = getUkTradePrintPositionPrice(quantity, position, pricingColorCount)
  if price.unitPrice === null:
    missingReasons.push(`Missing price ${getPrintPositionLabel(position)}.`)
  printCost += (price.unitPrice ?? 0) * quantity
  if isUkTradeScreenSetupPosition(position):
    screenSetupScreenCount += getUkTradeSetupScreenCount(position, pricingColorCount)

screenSetupCost = screenSetupScreenCount * 20
```

Garment price:

```ts
garmentCost =
  garment && typeof garment.gbpPrice === "number"
    ? garment.gbpPrice * quantity
    : 0

if garment exists and gbpPrice is not a number:
  missingReasons.push("Missing GBP garment price.")
```

Embroidery:

```ts
for each selected embroidery:
  price = getUkTradeEmbroideryPrice(quantity, stitchCount)
  unitPrice = price.unitPrice ?? 0
  cost = unitPrice * quantity
  setupCost = 30

embroideryCost = sum(cost)
embroiderySetupCost = sum(setupCost)
```

Embroidery stitch rules:

```ts
normalizedStitchCount =
  !Number.isFinite(stitchCount) ? 7000 : Math.max(7000, Math.ceil(stitchCount))

pricingStitchCount =
  normalizedStitchCount > 15000
    ? 15000
    : first row in [7000..15000] where normalizedStitchCount <= row

extraStitchBlocks =
  normalizedStitchCount > 15000
    ? ceil((normalizedStitchCount - 15000) / 1000)
    : 0

unitPrice = baseRowPrice + extraStitchBlocks * EXTRA_1000_STITCHES row price
```

UK totals:

```ts
setupCost = screenSetupCost + embroiderySetupCost
totalCost = garmentCost + printCost + setupCost + embroideryCost
costPerUnit = quantity > 0 ? totalCost / quantity : 0
hasValidPrice = missingReasons.length === 0
```

Aggregate totals sum all item breakdown fields, but `totalQuantity` and `validItemCount` only include valid items. This means invalid item costs can still be included as zero/partial costs in total fields, while the footer quantity only counts valid items.

UK quantity tier selection:

```ts
if quantity < first tier: quantityTier = null
else quantityTier = greatest tier <= quantity
```

UK print position rules:

- Standard positions use the screen print matrix by colour count.
- `NECK_PRINT_STANDARD` uses inside neck standard prices and forces pricing colour count to 1.
- `NECK_PRINT_TRANSFER` uses inside neck transfer prices.
- Setup screens apply to every position except neck transfer.
- `getUkTradeSetupScreenCount` returns:
  - `0` for neck transfer
  - `1` for neck standard
  - colour count for standard print positions

Missing/invalid behavior:

- Missing garment, quantity below 50, no work selected, missing print price, or missing GBP garment price produce `missingReasons`.
- Copy omits invalid items (`if !breakdown.hasValidPrice return null`).
- UK UI displays missing price text in item breakdown.

Rounding/formatting:

- All displayed amounts use `formatBreakdownAmount`/`formatBreakdownUnitAmount` with `toFixed(2)`.
- No VAT calculation.

## 5. Pricing Data Inventory

### EU garment prices

Source: `prisma/seed-data.ts::garmentSeedData`; database-backed in `Garment.basePrice`; editable through garment directory.

Shape: `{ code, altCode, brandName, name, color, type, basePrice, gbpPrice, extraSizeCost, tags }`.

Recommended Supabase location: `garments` table with separate EUR/GBP price columns or a normalized garment price table if multi-currency history is required.

| Code | Alt | Brand | Name | Color | Type | EUR base | GBP | Extra size |
|---|---|---|---|---|---|---:|---:|---:|
| 5001 |  | AS Colour | Staple Tee |  | TSHIRT | 4.65 | null | null |
| 5001C |  | AS Colour | Staple Camo Tee |  | TSHIRT | 6.65 | null | null |
| 5020 |  | AS Colour | Staple L/S Tee |  | TSHIRT | 6.65 | null | null |
| 5020G |  | AS Colour | Staple Organic L/S Tee |  | TSHIRT | 6.90 | null | null |
| 5026 |  | AS Colour | Classic Tee |  | TSHIRT | 6.50 | null | null |
| 5030 |  | AS Colour | Box Tee |  | TSHIRT | 7.15 | null | null |
| 5031 |  | AS Colour | Box L/S Tee |  | TSHIRT | 8.95 | null | null |
| 5040 |  | AS Colour | Staple Stone Wash Tee |  | TSHIRT | 7.80 | null | null |
| 5050 |  | AS Colour | Block Tubular Tee |  | TSHIRT | 3.25 | null | null |
| 5054 |  | AS Colour | Block L/S Tee |  | TSHIRT | 4.80 | null | null |
| 5071 |  | AS Colour | Classic L/S Tee |  | TSHIRT | 8.40 | null | null |
| 5080 |  | AS Colour | Heavy Tee |  | TSHIRT | 7.70 | null | null |
| 5081 |  | AS Colour | Heavy L/S Tee |  | TSHIRT | 10.20 | null | null |
| 5082 |  | AS Colour | Heavy Faded Tee |  | TSHIRT | 7.70 | null | null |
| 5083 |  | AS Colour | Heavy Faded L/S Tee |  | TSHIRT | 10.20 | null | null |
| 5085 |  | AS Colour | Stone Wash Heavy Tee |  | TSHIRT | 8.25 | null | null |
| 5086 |  | AS Colour | Heavy Faded Minus Tee [-5cm] |  | TSHIRT | 7.70 | null | null |
| 5102 |  | AS Colour | Stencil Hood |  | TSHIRT | 19.55 | null | null |
| 5111 |  | AS Colour | Standard Hood |  | TSHIRT | 12.25 | null | null |
| 5145 |  | AS Colour | Heavy Crew |  | TSHIRT | 19.80 | null | null |
| 5146 |  | AS Colour | Heavy Hood |  | TSHIRT | 22.25 | null | null |
| 5161 |  | AS Colour | Relax Hood |  | TSHIRT | 16.95 | null | null |
| 5165 |  | AS Colour | Relax Faded Crew |  | TSHIRT | 16.05 | null | null |
| 5166 |  | AS Colour | Relax Faded Hood |  | TSHIRT | 18.05 | null | null |
| 5171 |  | AS Colour | Box Hood |  | TSHIRT | 19.55 | null | null |
| B653 | BC653 | Beechfield | Beechfield Low Profile 6 Panel Dad Cap |  | TSHIRT | 3.20 | null | null |
| BB45 | BC45 | Beechfield | Original cuffed beanie |  | TSHIRT | 2.00 | null | null |
| CV3001 | 3001 | Bella Canvas | Unisex Crew Neck T-Shirt | Colours | TSHIRT | 4.80 | null | null |
| CV3001 |  | Bella Canvas | Canvas Unisex Crew Neck T-Shirt | Whites | TSHIRT | 4.80 | null | null |
| GD01 | 64000 | Gildan | Gildan SoftStyle Adult T-Shirt | Colours | TSHIRT | 2.25 | null | 0.70 |
| GD01 | 64000 | Gildan | Gildan SoftStyle Adult T-Shirt | Whites | TSHIRT | 1.85 | null | 0.60 |
| GD02 | 2000 | Gildan | Gildan Ultra Cotton T-Shirt | Colours | TSHIRT | 2.80 | null | 1.10 |
| GD02 | 2000 | Gildan | Gildan Ultra Cotton T-Shirt | Whites | TSHIRT | 2.35 | null | 1.10 |
| GD05 | 5000 | Gildan | Gildan Heavy Cotton T-Shirt | Colours | TSHIRT | 2.40 | null | 0.90 |
| GD05 | 5000 | Gildan | Gildan Heavy Cotton T-Shirt | Whites | TSHIRT | 1.95 | null | 0.90 |
| GD14 | 2400 | Gildan | Gildan Ultra Cotton Long Sleeve T-Shirt | Colours | LONGSLEEVE | 5.70 | null | 2.00 |
| GD14 | 2400 | Gildan | Gildan Ultra Cotton Long Sleeve T-Shirt | Whites | LONGSLEEVE | 4.70 | null | 2.00 |
| GD21 | H000 | Gildan | Gildan Hammer Heavyweight T-Shirt | Colours | TSHIRT | 3.15 | null | 1.20 |
| GD21 | H000 | Gildan | Gildan Hammer Heavyweight T-Shirt | Whites | TSHIRT | 2.65 | null | 1.00 |
| GD56 | 18000 | Gildan | GI18000 HEAVY SWEATSHIRT | Colours | HOODIE | 5.90 | null | 0.50 |
| GD56 | 18000 | Gildan | GI18000 HEAVY SWEATSHIRT | Whites | HOODIE | 5.40 | null | 1.65 |
| GD57 | 18500 | Gildan | Gildan Heavy Blend Hooded Sweatshirt | Colours | HOODIE | 8.25 | null | 2.00 |
| GD57 | 18500 | Gildan | Gildan Heavy Blend Hooded Sweatshirt | Whites | HOODIE | 8.25 | null | 2.00 |
| JH001 |  | AWDis | AWDis College hoodie | Whites | HOODIE | 9.50 | null | 1.50 |
| JH001 |  | AWDis | AWDis College hoodie | colours | HOODIE | 9.50 | null | 1.50 |
| W101 | WM101 | Westford Mill | Westford Mill Bag For Life - Long Handles |  | TSHIRT | 1.50 | null | null |
| W265 | WM265 | Westford Mill | Westford Mill Organic Premium Cotton Maxi Tote Bag |  | TSHIRT | 3.60 | null | null |

### Calculator profiles and garment markups

Source: `prisma/seed-data.ts::calculatorProfileSeedData` and `garmentMarkupSeedDataByCalculatorCode`; database-backed in `CalculatorProfile` and `GarmentMarkup`.

Recommended Supabase location: `calculator_profiles` and `calculator_garment_markups`.

| Profile code | Name | HOODIE | LONGSLEEVE | TSHIRT |
|---|---|---:|---:|---:|
| STANDARD_EU | Standard EU Calculator | 5.00 | 3.50 | 3.00 |
| US_CLIENTS | US Clients Calculator | 4.00 | 3.00 | 2.00 |

### EU print-price matrix

Source: `prisma/seed-data.ts::printPriceSeedData`; database-backed in `PrintPrice`.

Recommended Supabase location: `print_price_tiers` keyed by calculator family/profile if future variants diverge.

| Colour | Qty 50-99 P/Pins | Qty 100-249 P/Pins | Qty 250-499 P/Pins | Qty 500-999 P/Pins | Qty 1000-2000 P/Pins |
|---:|---:|---:|---:|---:|---:|
| 1 | 1.40 / 1.54 | 1.15 / 1.26 | 1.00 / 1.10 | 0.90 / 0.99 | 0.75 / 0.82 |
| 2 | 1.60 / 1.76 | 1.40 / 1.54 | 1.25 / 1.38 | 1.20 / 1.32 | 1.05 / 1.16 |
| 3 | 2.15 / 2.37 | 1.70 / 1.87 | 1.45 / 1.60 | 1.40 / 1.54 | 1.25 / 1.38 |
| 4 | 2.60 / 2.86 | 2.35 / 2.59 | 1.70 / 1.87 | 1.60 / 1.76 | 1.40 / 1.54 |
| 5 | 3.25 / 3.58 | 2.50 / 2.92 | 1.95 / 2.14 | 1.90 / 2.09 | 1.70 / 1.87 |
| 6 | 4.05 / 4.46 | 2.65 / 2.75 | 2.20 / 2.42 | 2.15 / 3.27 | 2.00 / 2.20 |
| 7 | 4.80 / 5.28 | 2.80 / 3.08 | 2.50 / 2.75 | 2.45 / 2.70 | 2.30 / 2.53 |
| 8 | 5.45 / 6.00 | 3.10 / 3.41 | 2.80 / 3.08 | 2.75 / 3.03 | 2.60 / 2.86 |
| 9 | 6.10 / 6.71 | 3.40 / 3.74 | 3.10 / 3.41 | 3.05 / 3.36 | 2.90 / 3.19 |

Confirmed anomaly: colour 6, qty 500-999 has production `2.15` and pins `3.27`, unlike adjacent markup pattern. Preserve until business confirms.

### EU constants

| Data | Value | Source | Recommended location |
|---|---:|---|---|
| VAT | 27% | `CalculatorClient::vatRate`, `copyFormatters::formatEuQuoteCopy` | Code config or `calculator_profiles.vat_rate` |
| Neck print unit price | 0.70 | `DesignCard::NECK_PRINT_UNIT_PRICE` | Code config or print tier row with fixed position |
| Embroidery small | production 1.25, customer 1.50 | `DesignCard::DESIGN_EMBROIDERY_SIZE_PRICING` | `embroidery_pricing` |
| Embroidery medium | production 1.85, customer 2.00 | same | `embroidery_pricing` |
| Embroidery large | production 2.50, customer 2.75 | same | `embroidery_pricing` |
| Customer digitising | 25.00 | `EMBROIDERY_CUSTOMER_DIGITIZING_FEE` | `setup_fees` |
| Production digitising | 23.00 | `EMBROIDERY_PRODUCTION_DIGITIZING_COST` | `setup_fees` |
| EU max colours | 9 | `DesignCard::MAX_COLOR_COUNT` | Code config |
| EU min colours | 1 | `DesignCard::MIN_COLOR_COUNT` | Code config |

### Delivery rates and box capacity

Source: `CalculatorClient::DELIVERY_RATES` and `BOX_CAPACITY_GUIDE_ITEMS`; hardcoded.

Recommended Supabase location: delivery rates may remain code config unless editable admin pricing is needed.

| Country | EUR/box excl. VAT | Delivery time |
|---|---:|---|
| Austria | 25 | 1 day |
| Czechia | 25 | 2 days |
| Germany | 25 | 2 days |
| Romania | 25 | 2 days |
| Slovenia | 25 | 1 day |
| Croatia | 30 | 3 days |
| Slovakia | 30 | 2 days |
| Italy | 40 | 3-4 days |
| France | 45 | 3 days |
| Poland | 45 | 2 days |
| Netherlands | 45 | 2 days |
| Greece | 50 | 6 days |
| Portugal | 50 | 4 days |
| Spain | 50 | 3 days |
| Belgium | 55 | 2 days |
| Bulgaria | 55 | 3 days |
| Denmark | 55 | 3 days |
| Estonia | 55 | 4 days |
| Latvia | 55 | 3 days |
| Lithuania | 55 | 3 days |
| Luxembourg | 55 | 2 days |
| Monaco | 55 | 3 days |
| Sweden | 55 | 3 days |
| England | 65 | 4 days |
| Ireland | 65 | 5 days |

Box capacity: T-Shirts `100 per box`, Hoodies `20-25 per box`, Long Sleeves `60 per box`, Beanies `150 per box`, Caps `100-150 per box`, Tote Bags `100-150 per box`.

### UK Trade print prices

Source: `src/app/hub/calculators/uk/tradeScreenPrintData.ts::ukTradeScreenPrintPrices`, mirrored in `docs/uk-trade-prints.csv`; hardcoded TypeScript and CSV-backed reference.

Recommended Supabase location: `uk_trade_print_price_tiers` or generic `print_price_tiers` with profile and position kind.

| Colours | 50 | 100 | 200 | 500 | 1000 | 2500 | 5000 | 10000 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1.47 | 0.93 | 0.75 | 0.68 | 0.60 | 0.59 | 0.58 | 0.56 |
| 2 | 1.63 | 1.08 | 0.88 | 0.79 | 0.70 | 0.68 | 0.66 | 0.63 |
| 3 | 1.79 | 1.23 | 1.01 | 0.90 | 0.80 | 0.77 | 0.74 | 0.70 |
| 4 | 1.95 | 1.38 | 1.14 | 1.01 | 0.90 | 0.86 | 0.82 | 0.77 |
| 5 | 2.11 | 1.53 | 1.27 | 1.12 | 1.00 | 0.95 | 0.90 | 0.84 |
| 6 | 2.27 | 1.68 | 1.40 | 1.23 | 1.10 | 1.04 | 0.98 | 0.91 |
| 7 | 2.43 | 1.83 | 1.53 | 1.34 | 1.20 | 1.13 | 1.06 | 0.98 |
| 8 | 2.59 | 1.98 | 1.66 | 1.45 | 1.30 | 1.22 | 1.14 | 1.05 |
| 9 | 2.75 | 2.13 | 1.79 | 1.56 | 1.40 | 1.31 | 1.22 | 1.12 |
| 10 | 2.91 | 2.28 | 1.92 | 1.67 | 1.50 | 1.40 | 1.30 | 1.19 |

UK inside neck hardcoded in `tradeScreenPrintData.ts`:

| Position | 50 | 100 | 200 | 500 | 1000 | 2500 | 5000 | 10000 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Neck standard | 0.89 | 0.60 | 0.60 | 0.60 | 0.60 | 0.60 | 0.60 | 0.60 |
| Neck transfer | 1.34 | 0.90 | 0.90 | 0.90 | 0.90 | 0.90 | 0.90 | 0.90 |

UK setup fee: `UK_TRADE_SCREEN_SETUP_PER_SCREEN = 20`.

### UK Trade embroidery prices

Source: `src/app/hub/calculators/uk/tradeEmbroideryData.ts::ukTradeEmbroideryPrices`, mirrored in `docs/uk-trade-embroidery.csv`.

Recommended Supabase location: `embroidery_price_tiers` with `stitch_count`, `quantity_tier`, and optional extra-block row.

| Stitch count | 50 | 100 | 200 | 500 | 1000 | 2500 |
|---:|---:|---:|---:|---:|---:|---:|
| 7000 | 2.15 | 2.04 | 1.87 | 1.82 | 1.82 | 1.82 |
| 8000 | 2.37 | 2.27 | 2.10 | 2.04 | 2.03 | 2.03 |
| 9000 | 2.59 | 2.49 | 2.32 | 2.27 | 2.24 | 2.24 |
| 10000 | 2.82 | 2.71 | 2.54 | 2.49 | 2.46 | 2.46 |
| 11000 | 3.04 | 2.93 | 2.76 | 2.71 | 2.67 | 2.67 |
| 12000 | 3.26 | 3.16 | 2.99 | 2.93 | 2.88 | 2.88 |
| 13000 | 3.48 | 3.38 | 3.21 | 3.16 | 3.09 | 3.09 |
| 14000 | 3.71 | 3.60 | 3.43 | 3.38 | 3.30 | 3.30 |
| 15000 | 3.93 | 3.82 | 3.65 | 3.60 | 3.52 | 3.52 |
| EXTRA_1000_STITCHES | 0.21 | 0.20 | 0.19 | 0.18 | 0.17 | 0.16 |

Constants: min stitch count `7000`, max base stitch count `15000`, setup per item `30`.

## 6. Legacy Database Dependencies

### Prisma models/enums/fields used by calculators or garment pricing

| Item | Used by | Classification | Supabase equivalent |
|---|---|---|---|
| `Garment.id` | garment selection, pricing lookup | Required MVP | `garments.id uuid` |
| `Garment.code` | selectors and copy | Required MVP | `garments.code text` |
| `Garment.altCode` | selector search/display | Useful later | `garments.alt_code text` |
| `Garment.brandName` | selector/search/copy | Required MVP | `garments.brand_name text` |
| `Garment.name` | selector/search/copy | Required MVP | `garments.name text` |
| `Garment.color` | selector/search/copy | Required MVP | `garments.color text` |
| `Garment.type` | EU markup lookup | Required MVP | enum/text `garment_type` |
| `Garment.basePrice` | EU garment cost | Required MVP | `garments.eur_base_price numeric` or `garment_prices` |
| `Garment.gbpPrice` | UK Trade garment cost | Required MVP for UK Trade | `garments.gbp_price numeric` |
| `Garment.extraSizeCost` | admin directory only; not used in calculator math | Useful later | `garments.extra_size_cost numeric` |
| `Garment.tags` | selector/admin search | Useful later | `garments.tags text[]` or `garment_tags` |
| `GarmentMarkup.calculatorProfileId` | profile-specific EU markup | Required MVP | `calculator_garment_markups.profile_id` |
| `GarmentMarkup.garmentType` | markup key | Required MVP | `calculator_garment_markups.garment_type` |
| `GarmentMarkup.markupValue` | EU markup per unit | Required MVP | `calculator_garment_markups.markup_value numeric` |
| `CalculatorProfile.code` | EU profile selection | Required MVP | `calculator_profiles.code text unique` |
| `CalculatorProfile.name` | admin/display metadata | Useful later | `calculator_profiles.name text` |
| `CalculatorProfile.isActive` | seeded but not currently checked by loaders | Useful later | `calculator_profiles.is_active boolean` |
| `PrintPrice.colorCount` | EU print tier lookup | Required MVP | `print_price_tiers.color_count int` |
| `PrintPrice.qtyMin` | EU tier lower bound | Required MVP | `print_price_tiers.qty_min int` |
| `PrintPrice.qtyMax` | EU tier upper bound | Required MVP | `print_price_tiers.qty_max int` |
| `PrintPrice.productionPrice` | EU production print unit price | Required MVP | `print_price_tiers.production_unit_price numeric` |
| `PrintPrice.pinsPrice` | EU customer print unit price | Required MVP | `print_price_tiers.customer_unit_price numeric` |
| `Order`, `Design`, `DesignPrint` | Not used by current calculator routes; historical quote persistence only | Legacy-only unless quote saving is rebuilt | Omit from calculator MVP |
| `PrintPosition` enum | Historical `DesignPrint`; not used by current client state | Legacy-only | code enum/domain type |
| Commercial invoice models | Not calculator pricing | Legacy-only for calculator migration | Separate feature |

Queries:

- `getCalculatorReferenceData`: `prisma.garment.findMany`, `prisma.printPrice.findMany`, `prisma.calculatorProfile.findUnique({ include: { garmentMarkups: true }})`.
- `getUkTradeCalculatorGarments`: `prisma.garment.findMany({ select: ukTradeGarmentSelect })`.
- `getGarmentDirectoryData`: `prisma.garment.findMany`, `prisma.garmentMarkup.findMany` filtered to `STANDARD_EU`.

Cache tags:

- `calculator-reference` from `getCalculatorReferenceTag`.
- `uk-trade-garments` from `getUkTradeGarmentsTag`.
- `garment-directory` from `getGarmentDirectoryTag`.

Mutations:

- `addGarment`, `updateGarmentDetails`, `deleteGarment` in `src/app/hub/garments/actions.ts`.
- These revalidate `/hub/garments`, `garment-directory`, and `calculator-reference`.
- Confirmed concern: garment mutations do not reference `getUkTradeGarmentsTag`, so UK Trade cached garment data may not revalidate after GBP garment edits unless another path refreshes it.

## 7. State and Data Flow

Server-side loading:

- EU route page passes profile code/title into `CalculatorPageContent`.
- `CalculatorPageContent` calls `connection()` and awaits `getCalculatorReferenceData`.
- EU loader is cached with `unstable_cache` and tag `calculator-reference`.
- UK route calls `connection()` and awaits `getUkTradeCalculatorGarments`.
- UK loader is cached with tag `uk-trade-garments`.

Client-side state:

- EU `CalculatorClient` owns an array of `Design` objects. Initial design is `{ quantity: 50, positions: { FRONT: 1 }, pkMarkupEnabled: false, pkMarkupPerUnit: 0 }`.
- UK `UkTradeCalculatorClient` owns an array of `UkTradeDesign` objects from `createDefaultDesign`; same initial quantity/front behavior.
- Item card components own only input strings/errors, then emit full updated design object through `onChange`.

Add/remove:

- EU `addDesign` appends a default design.
- EU `removeDesign` splices by index and can remove all designs.
- UK `removeDesign` is only passed when `designs.length > 1`, so at least one item remains in UI.

Recompute:

- EU `breakdowns` are `useMemo` over `[designs, garments, printPrices, garmentMarkups]`.
- UK `breakdowns` are `useMemo` over `[designs, garments]`.
- Totals are `useMemo` reductions over breakdowns.

Errors and missing prices:

- EU missing price is silent zero.
- EU missing garment hides result panel until any garment exists, but calculations still return zero for missing garment items.
- UK missing states accumulate `missingReasons` and set `hasValidPrice = false`; invalid items are omitted from copy.

Profiles:

- EU profiles alter only garment type markups.
- Shared `CalculatorClient` does not receive full profile config; it receives `garmentMarkups` and `calculatorTitle`.
- Copy behavior is currently altered by `calculatorTitle` string, not profile code.

Garment changes:

- Garment directory actions mutate `Garment` records.
- Revalidation refreshes garment directory and EU calculator reference cache.
- UK Trade cache tag appears disconnected from garment action revalidation.

## 8. Copy and Export Behaviour

### Shared clipboard

`CalculatorClient::copyToClipboard` and `UkTradeCalculatorClient::copyToClipboard` use `navigator.clipboard.writeText` when available in a secure context, else create a hidden textarea and call `document.execCommand("copy")`.

### EU Standard: `formatEuQuoteCopy`

Fields/order per item:

1. Item label line: custom trimmed label or `Item #N:`.
2. Blank line.
3. Garment summary: `code brandName name color` plus work summary in parentheses.
4. Optional digitising fee line.
5. Quantity line: `${quantity} x €${unitExclVat} (excl vat) ea = €${totalInclVat}`.

VAT wording: quantity line says `(excl vat) ea` but final value is incl. VAT via `subtotalExclVat * 1.27`.

Representative existing fixture from `copyFormatters.fixtures.md`:

```text
Test dEsg:

JH001 AWDis College hoodie (1 Col Front, Embroidery 1, Embroidery 2)

Digitizing fee = €63.50 (incl. VAT)

50 x €17.58 (excl vat) ea = €1116.33
```

### EU US Clients: `formatUsClientQuoteCopy`

Fields/order per item:

1. Item label.
2. Blank line.
3. Garment summary using US position labels and suffix `" + base"`.
4. Optional digitising fee line incl. VAT.
5. Quantity line: `${quantity} x €${unitExclVat} each (€${subtotalExclVat} ex vat)`.
6. `VAT = €...`.
7. `TOTAL = €...`.

Dark/base behavior: `" + base"` is appended to the work summary suffix for all US client copied items, not conditionally based on garment colour.

Representative existing fixture:

```text
Test dEsg:

JH001 AWDis AWDis College hoodie colours (1c front, 1c left sleeve, Embroidery 1, Embroidery 2 + base)

Digitizing fee = €63.50 (incl. VAT)

50 x €18.58 each (€929.00 ex vat)
VAT = €250.83
TOTAL = €1179.83
```

### UK Trade: `UkTradeCalculatorClient::formatUkTradeQuoteCopy`

Fields/order per valid item:

1. Item label.
2. Blank line.
3. Garment quote summary: `code brandName name color` plus print/embroidery summary.
4. Quantity line: `${quantity} x £${unitExclVat} each (£${totalCost} ex vat)`.

Invalid items are skipped. There is no VAT line.

Representative example from formatter logic:

```text
Item #1:

GD05 Gildan Gildan Heavy Cotton T-Shirt Colours (1 colour front, Neck Print Standard fixed 1 colour, Embroidery 1 7000 stitches)

50 x £0.00 each (£0.00 ex vat)
```

Actual amounts depend on `gbpPrice`; seed data currently has `gbpPrice: null` for all seeded garments, so local seeded UK items are invalid until GBP prices are added.

### Delivery: `formatDeliveryCopy`

Fields/order:

```text
Delivery Helper

Delivery Country: Germany
Delivery Time: 2 days
Boxes: 2
Cost Per Box: €25.00 excl. VAT
Total Delivery Cost Incl. VAT: €63.50
```

Note: `costPerBox` argument receives `deliverySubtotalExclVat`, so when more than one box or markup is used, the copied field labeled `Cost Per Box` actually contains total delivery subtotal excl. VAT. Confirmed issue.

### Unused/export discrepancy

`copyFormatters.ts::formatUkTradeQuoteCopy` exists and accepts simplified breakdowns, but UK Trade client uses its own local `formatUkTradeQuoteCopy`. Treat the shared one as dead or stale unless imports appear later.

## 9. UI Behaviour Worth Preserving

- Result panels remain mounted and use opacity/pointer-events when no garment is selected; this avoids layout shift in EU calculators.
- Editable item names normalize blank values back to `Item #N` fallback.
- Print positions are toggles; toggling on initializes colour count to min.
- EU colour validation allows 1-9 and shows a single warning string.
- UK colour validation allows 1-10.
- EU neck print is a normal position toggle but uses fixed price.
- UK neck print positions are distinct controls for standard and transfer.
- Embroidery controls support up to three items.
- EU embroidery uses size select per item.
- UK embroidery uses numeric stitch count per item with min 7000 and normalization.
- Add item appends a default front/1-colour/quantity-50 item.
- UK prevents removing the last item; EU currently can remove all items.
- Loading skeleton exists for EU routes via `CalculatorLoading`.
- UK item breakdown surfaces missing prices and missing input reasons.
- Copy actions are attached to primary total cards.
- Garment selector search covers code, alt code, brand, name, color, tags.

## 10. Problems and Technical Debt

Confirmed issues:

- Business logic is embedded in React components (`DesignCard`, `CalculatorClient`, `UkTradeCalculatorClient`).
- Prisma generated types are imported directly into UI/domain logic.
- `getQuoteFormatter` selects US copy from `calculatorTitle` text instead of profile code.
- EU VAT is duplicated: `CalculatorClient::vatRate = 27` and `formatEuQuoteCopy` hardcodes `1.27`.
- EU missing print tiers silently calculate as zero.
- EU quantity minimum is UI-only; calculation has no invalid-state object.
- EU delivery copy labels subtotal as `Cost Per Box`.
- `formatDigitizingFeeVatDisplay` exists in `CalculatorClient` and copy formatter has similar digitising VAT formatting.
- UK Trade has a local `formatUkTradeQuoteCopy` while shared `copyFormatters.ts` also exports `formatUkTradeQuoteCopy`.
- UK Trade garment cache tag is not revalidated by garment mutations.
- Seed data has all `gbpPrice: null`, so UK Trade cannot produce valid seeded garment costs without admin edits.
- Many AS Colour hoodie/crew/cap/tote seed rows are typed `TSHIRT`, so EU markup follows `TSHIRT` rather than apparent product category.
- EU print price colour 6, qty 500-999 has customer pins price `3.27`, inconsistent with neighboring rows.

Possible concerns:

- `Order`, `Design`, and `DesignPrint` models look unused by current calculator UI and may be old persistence scaffolding.
- CSV UK data duplicates TypeScript hardcoded data; no automated parity check is present.
- No dedicated calculator test suite exists.
- Extra size cost exists in garment data/admin but is not included in calculator math.
- US `" + base"` copy is unconditional; if intended to represent dark garment base only, code does not check garment color.

## 11. Recommended Rebuild Architecture

Keep business logic independent of React and Supabase.

Recommended folders:

```text
src/domain/calculators/
  types.ts                    # Quote/item/domain types, currency, enums
  profiles.ts                 # Profile ids and immutable behavior config
  euPricingEngine.ts          # pure EU calculateQuote/calculateItem
  ukTradePricingEngine.ts     # pure UK Trade calculateQuote/calculateItem
  priceLookup.ts              # tier selection helpers
  validation.ts               # missing-price/invalid-state helpers
  copy/
    euStandard.ts
    euUsClients.ts
    ukTrade.ts
    delivery.ts

src/data/supabase/
  garmentsRepository.ts
  calculatorProfilesRepository.ts
  printPricingRepository.ts
  embroideryPricingRepository.ts

src/app/hub/calculators/
  _components/
    CalculatorShell.tsx
    ItemEditor.tsx
    GarmentSelector.tsx
    PrintPositionControls.tsx
    EmbroideryControls.tsx
    ResultPanel.tsx
  eu/standard/page.tsx
  eu/us-clients/page.tsx
  uk/trade/page.tsx
```

Architecture rules:

- Domain engines take plain data objects and return explicit breakdowns, totals, warnings, and copy-ready values.
- Supabase repositories return generated Supabase types mapped into domain DTOs.
- React components own UI state only.
- Calculator profile config should be keyed by stable code, not title text.
- VAT, currency, copy formatter, max colours, and enabled features should come from profile/config.
- Keep tier lookup functions deterministic and unit-tested.
- Preserve legacy rounding at display/copy boundaries only.

## 12. Proposed Supabase Data Model

Planning-level tables only; do not generate migrations yet.

### `garments`

- Purpose: shared garment catalog for EU/UK calculators and admin directory.
- Likely columns: `id`, `code`, `alt_code`, `brand_name`, `name`, `color`, `garment_type`, `eur_base_price`, `gbp_price`, `extra_size_cost`, `tags`, `created_at`, `updated_at`, `active`.
- Relationships: referenced by quote item state only if quotes are persisted later.
- Uniqueness: consider `(code, brand_name, name, color)`; do not force code unique because current seed has duplicate codes for colors.
- Constants: garment type enum may be code enum or DB enum.

### `calculator_profiles`

- Purpose: stable calculator behavior/config selector.
- Columns: `id`, `code`, `name`, `currency`, `vat_rate`, `is_active`, `copy_formatter`, `min_quantity`, `max_colours`, `supports_delivery`, `supports_pk_markup`, `supports_embroidery`.
- Uniqueness: `code`.
- Values that may remain constants: route metadata and formatter mapping if not admin-editable.

### `calculator_garment_markups`

- Purpose: profile-specific garment markup per unit.
- Columns: `id`, `profile_id`, `garment_type`, `markup_value`.
- Relationships: `profile_id -> calculator_profiles.id`.
- Uniqueness: `(profile_id, garment_type)`.

### `print_price_tiers`

- Purpose: EU print production/customer tier matrix.
- Columns: `id`, `profile_id` or `pricing_set`, `position_kind`, `color_count`, `qty_min`, `qty_max`, `production_unit_price`, `customer_unit_price`.
- Relationships: optional profile/pricing set.
- Uniqueness: `(pricing_set, position_kind, color_count, qty_min, qty_max)`.
- Code constants: fixed EU neck price can remain config or be represented as a fixed position tier.

### `uk_trade_print_prices`

- Purpose: UK Trade screen print and inside neck matrix.
- Columns: `id`, `position_kind`, `color_count`, `quantity_tier`, `unit_price`, `setup_screen_rule`.
- Uniqueness: `(position_kind, color_count, quantity_tier)`.
- Code constants: setup screen count rules may stay in code, with `screen_setup_fee` in `setup_fees`.

### `embroidery_pricing`

- Purpose: EU size pricing and UK stitch-count pricing.
- Columns: `id`, `profile_code`/`pricing_set`, `pricing_kind`, `size`, `stitch_count`, `quantity_tier`, `production_unit_price`, `customer_unit_price`, `unit_price`.
- Uniqueness: depends on pricing kind; EU `(pricing_set, size)`, UK `(pricing_set, stitch_count, quantity_tier)`.
- Code constants: embroidery slot labels can remain code.

### `setup_fees`

- Purpose: digitising, screen setup, embroidery setup.
- Columns: `id`, `profile_code`, `fee_code`, `amount`, `currency`, `applies_per`.
- Uniqueness: `(profile_code, fee_code)`.

### `calculator_configuration`

- Purpose: non-price behavior flags that product/admin may change.
- Columns: `profile_code`, `config_json`, `updated_at`.
- Alternative: keep behavior config in TypeScript and store only editable prices in DB.

## 13. Migration Plan

### Stage 1: Shared domain model, pricing configuration, database tables

- Scope: define calculator domain types, profile codes, Supabase table plan, seed/import scripts for pricing data.
- Dependencies: Supabase generated types available.
- Acceptance criteria: all legacy pricing datasets represented in fixtures/config; no React dependency in domain package.
- Regression risks: incorrectly normalizing legacy garment types or duplicate garment codes.

### Stage 2: Pure calculation engine and parity fixtures

- Scope: implement EU and UK pure engines with legacy fixtures.
- Dependencies: Stage 1 types/data fixtures.
- Acceptance criteria: fixture outputs match legacy formulas for totals and copy examples; missing-price behavior intentionally matches or is explicitly flagged.
- Regression risks: VAT duplication, silent zero price handling, UK invalid-item aggregation.

### Stage 3: EU Standard

- Scope: route, server data loader, item editor, EU Standard profile integration.
- Dependencies: Stage 2 EU engine, Supabase garment/profile/print data.
- Acceptance criteria: standard fixture totals and copied text match legacy; delivery helper matches including existing label decision if preserved.
- Regression risks: profile markups, neck price, digitising fee incl. VAT wording.

### Stage 4: EU US Clients

- Scope: route using same EU engine with `US_CLIENTS` profile and US copy formatter.
- Dependencies: Stage 3 shared components.
- Acceptance criteria: US markups and `" + base"` copy fixture match legacy.
- Regression risks: formatter selection by profile code; unconditional base suffix.

### Stage 5: UK Trade

- Scope: UK Trade route, GBP garment data, print/embroidery tier lookups, setup fees, validation states.
- Dependencies: Stage 2 UK engine and Supabase UK data.
- Acceptance criteria: tier boundary tests pass; invalid GBP price state matches legacy; copy omits invalid items.
- Regression risks: greatest-lower-bound tier lookup, neck standard/transfer setup rules, extra stitch blocks.

### Stage 6: Copy/export parity

- Scope: standalone copy formatters and clipboard integration tests.
- Dependencies: calculator routes implemented.
- Acceptance criteria: EU fixtures in `copyFormatters.fixtures.md` reproduced; UK representative fixtures added; delivery copy verified.
- Regression risks: blank lines, VAT wording, item labels, garment summary ordering.

### Stage 7: Admin pricing management

- Scope: Supabase-backed garment/pricing admin screens and cache invalidation.
- Dependencies: core calculators stable.
- Acceptance criteria: editing garment EUR/GBP price invalidates all calculator loaders; markups and print tiers editable with validation.
- Regression risks: live calculator cache staleness and accidental production pricing edits.

## 14. Parity Test Matrix

Use the exact legacy formulas above. Where seed GBP prices are null, UK tests should use explicit fixture garments with GBP prices.

| Area | Case | Expected legacy result |
|---|---|---|
| EU Standard | 50 qty, JH001 hoodie whites, 1-col front, no embroidery | Unit excl VAT = base 9.50 + markup 5.00 + pins 1.54 = 16.04; subtotal 802.00; total incl VAT 1018.54. |
| EU Standard | 100 qty, 1-col front | Print tier moves to pins 1.26 / production 1.15. |
| EU Standard | 249 qty, 1-col front | Uses 100-249 tier. |
| EU Standard | 250 qty, 1-col front | Uses 250-499 tier. |
| EU Standard | 2000 qty, 9-col front | Uses 1000-2000 tier colour 9. |
| EU Standard | 2001 qty, 1-col front | No matching tier; print price 0. |
| EU Standard | neck print only | Neck unit price 0.70 for production and customer. |
| EU Standard | front + back + sleeves | Sum each position independently at same colour-tier unit price. |
| EU Standard | small/medium/large embroidery | Customer unit costs 1.50/2.00/2.75; production unit costs 1.25/1.85/2.50. |
| EU Standard | three embroideries | Customer digitising 75; production digitising 69. |
| EU Standard | PK markup 2.50 enabled at qty 50 | Adds 125 to customer subtotal only. |
| EU Standard | missing garment | base/markup zero; display total hidden if no item has garment. |
| EU Standard | custom item name `" Test "` | Copy label uses trimmed/nonblank via display helper; card blur normalizes blank to fallback. |
| EU Standard | multi-item quote | Totals are sum of all breakdowns; copy emits item blocks separated by blank lines. |
| EU US Clients | same as EU Standard hoodie | Garment markup uses 4.00 instead of 5.00. |
| EU US Clients | copy with front + sleeve | Position labels are lowercase `1c front`, `1c left sleeve`; summary suffix includes ` + base`. |
| EU US Clients | embroidery copy | Digitising fee incl VAT is `fee * 1.27`. |
| Delivery | Germany, 2 boxes, no markup | Subtotal 50; VAT 13.50; total 63.50. Copy currently labels cost per box as 50.00. |
| Delivery | Germany, 2 boxes, 5 markup enabled | Subtotal 60; VAT 16.20; total 76.20. |
| UK Trade | qty 50, 1-col front, GBP garment 2.00 | Print 1.47*50=73.50; setup screens 1, setup 20; garment 100; total 193.50; unit 3.87. |
| UK Trade | qty 99, 1-col front | Uses 50 tier. |
| UK Trade | qty 100, 1-col front | Uses 100 tier. |
| UK Trade | qty 199, 10-col front | Uses 100 tier, colour 10 = 2.28. |
| UK Trade | qty 200, 10-col front | Uses 200 tier, colour 10 = 1.92. |
| UK Trade | neck standard qty 50 | Unit 0.89; setup screen count 1; setup 20. |
| UK Trade | neck transfer qty 50 | Unit 1.34; setup screen count 0. |
| UK Trade | front 3-col + back 2-col qty 100 | Print = `(1.23 + 1.08) * 100`; setup screens 5; setup 100. |
| UK Trade | embroidery 7000 stitches qty 50 | Unit 2.15; setup 30. |
| UK Trade | embroidery 7500 stitches qty 50 | Normalizes to 8000 row; unit 2.37. |
| UK Trade | embroidery 16000 stitches qty 50 | 15000 row 3.93 + one extra block 0.21 = 4.14. |
| UK Trade | multiple embroideries | Embroidery setup is 30 per selected item. |
| UK Trade | missing GBP price | `hasValidPrice=false`, reason `"Missing GBP garment price."`, copy omits item. |
| UK Trade | qty 49 | reason `"Minimum quantity 50."`, print/embroidery tier unit price null. |
| UK Trade | no print/embroidery | reason `"Select at least one print position or embroidery item."` |

## 15. Open Questions

- Should EU Trade be implemented in the rebuild, or is it intentionally absent?
- Should US Clients `" + base"` remain unconditional, or should it depend on dark garment/print underbase rules?
- Should EU missing print tiers continue to calculate as zero, or become explicit invalid states?
- Should UK Trade totals exclude invalid item partial costs entirely, or preserve the current aggregate behavior?
- Should delivery copy keep the current `Cost Per Box` label bug for parity, or fix it during rebuild?
- Which current garments should receive GBP prices for UK Trade MVP, since seed data has null GBP prices?
- Should extra size cost affect calculators in the rebuild, or remain garment-directory metadata only?
- Should AS Colour hoodies/caps/totes currently typed as `TSHIRT` be corrected, or preserved for pricing parity?
