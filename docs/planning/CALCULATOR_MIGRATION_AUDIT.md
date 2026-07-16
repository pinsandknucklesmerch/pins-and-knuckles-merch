# Calculator Migration Audit

This audit covers the legacy calculator behaviour found in the reference Pins Hub app and related planning notes. The legacy app is reference-only: preserve business rules and copy contracts, but do not copy its Prisma architecture, database design, or components into the rebuild.

## Source Status

| Calculator | Legacy status | Notes |
| --- | --- | --- |
| EU Standard | Implemented | Route `/hub/calculators/eu/standard`; shared EU calculator client with `STANDARD_EU` profile. |
| EU US Clients | Implemented | Route `/hub/calculators/eu/us-clients`; shared EU calculator client with `US_CLIENTS` profile and different quote copy. |
| EU Trade | Not implemented as a route/profile in inspected legacy code | Mentioned in planning notes as potential/trade-style EU calculator. Only partial rules are documented: EUR, embroidery additive, trade markup expected `€2`. |
| UK Trade | Implemented | Route `/hub/calculators/uk/trade`; separate GBP trade calculator with screen-print and embroidery static matrices. |

## EU Standard

### 1. User Inputs

- Design/item rows, default quantity `50`.
- Optional custom item label, defaulting to `Item #n`.
- Garment selection from garment catalogue.
- Quantity, minimum input UI value `50`.
- Print positions: front, back, left sleeve, right sleeve, neck.
- Colour count per selected print position, accepted range `1` to `9`.
- Embroidery items: Embroidery 1, Embroidery 2, Embroidery 3.
- Embroidery size per selected embroidery item: small, medium, large.
- Optional PK markup checkbox and per-unit markup value.
- Optional delivery helper inputs: country, number of boxes, delivery markup per box.

### 2. Garment Data Required

- Garment id.
- Code and alternate code.
- Brand name.
- Product name.
- Colour.
- Garment type: `TSHIRT`, `LONGSLEEVE`, `HOODIE`.
- EUR base price.
- Extra size cost exists in legacy garment data but is not included in the inspected calculator formula.
- Tags/search metadata.

### 3. Print Pricing Data Required

- Colour count `1` through `9`.
- Quantity ranges:
  - `50-99`
  - `100-249`
  - `250-499`
  - `500-999`
  - `1000-2000`
- Production unit price.
- Pins/customer unit print price.
- Neck print fixed unit price: `€0.70` production and customer side.

### 4. Embroidery Pricing Data Required

- Size rows:
  - Small: production `€1.25`, customer `€1.50`.
  - Medium: production `€1.85`, customer `€2.00`.
  - Large: production `€2.50`, customer `€2.75`.
- Customer digitising fee: `€25` per selected embroidery item.
- Production digitising cost: `€23` per selected embroidery item.
- Maximum three embroidery items per design.

### 5. Setup, Digitising, Screen, Neck Print, Delivery, VAT, Markup, Currency Rules

- Currency: EUR.
- VAT: hardcoded `27%`.
- Garment markup is profile-specific by garment type:
  - Hoodie `€5`.
  - Long sleeve `€3.50`.
  - T-shirt `€3`.
- PK markup is optional and applied per unit when enabled.
- No screen setup charge was found for EU Standard.
- Neck print bypasses colour-tier pricing and uses fixed `€0.70` per unit.
- Digitising fee is customer-facing and shown inclusive of VAT in quote copy, but the customer subtotal calculation stores it as ex-VAT and then applies VAT to totals.
- Delivery helper is sales-helper only and does not affect main production/customer totals.
- Delivery rates are hardcoded by country, with cost per box and delivery time.
- Delivery helper applies VAT at `27%`; optional delivery markup is added per box before VAT.

### 6. Quantity Tiers

- Print pricing covers quantities from `50` through `2000`.
- Tier lookup uses inclusive `qtyMin <= quantity <= qtyMax`.
- Quantities above `2000` have no matching EU print tier in inspected seed data and therefore print price falls back to `0`.

### 7. Calculation Sequence

1. For each selected print position, resolve unit print prices:
   - Neck uses fixed `€0.70`.
   - Other positions use colour count and quantity range.
2. Multiply production print unit price by quantity and add to production print cost.
3. Multiply customer/Pins print unit price by quantity and add to customer print cost.
4. Resolve selected garment and multiply EUR base price by quantity.
5. Resolve garment markup by calculator profile and garment type, then multiply by quantity.
6. If PK markup is enabled, multiply PK markup per unit by quantity.
7. Resolve embroidery sizes and multiply production/customer embroidery unit prices by quantity.
8. Add digitising fee/cost per selected embroidery item.
9. Production subtotal = garment base cost + production print cost + embroidery production cost + production digitising cost.
10. Customer subtotal ex VAT = garment base cost + customer print cost + garment markup + PK markup + embroidery customer cost + customer digitising fee.
11. Customer total incl VAT = customer subtotal ex VAT * `1.27`.
12. Pins profit ex VAT = customer subtotal ex VAT - production subtotal.

### 8. Results and Copy/Export Outputs

- Result cards show:
  - Pins price incl VAT.
  - Production costs excl VAT.
- Breakdown shows per-item garment, print, embroidery, digitising, subtotal, VAT, total incl VAT, and profit.
- Copy output format is a customer quote body, with no calculator type name:

```text
Item 1:

B653 Beechfield Beechfield Low Profile 6 Panel Dad Cap (1 Col Front)

50 x €7.74 (excl vat) ea = €491.49
```

- If embroidery has a digitising fee, quote copy includes a digitising fee line before the quantity line.
- Delivery helper has a separate copy action with delivery country, delivery time, boxes, cost per box excl VAT, and total delivery incl VAT.

### 9. Rules Shared With Other Calculators

- Shared EU garment catalogue.
- Shared EU print tier table.
- Shared profile-based garment markup model with EU US Clients.
- Shared optional PK markup input with EU US Clients.
- Shared embroidery size pricing and digitising structure with EU US Clients.
- Shared customer quote item labels and item rename behaviour.
- Shared delivery helper with EU US Clients.

### 10. Rules Unique to EU Standard

- Uses `STANDARD_EU` garment markup profile.
- Quote copy uses EU format: `x €unit (excl vat) ea = €totalInclVat`.
- Does not add the US-client dark garment/base suffix in copied position summary.

## EU US Clients

### 1. User Inputs

Same as EU Standard:

- Design/item rows with custom labels.
- Garment.
- Quantity.
- Print positions and colour counts.
- Embroidery 1-3 and size.
- Optional PK markup.
- Optional delivery helper inputs.

### 2. Garment Data Required

Same as EU Standard: garment id, code, alt code, brand, name, colour, garment type, EUR base price, optional extra size cost, tags.

### 3. Print Pricing Data Required

Same as EU Standard: shared EU print tier table for colour counts `1-9`, quantity ranges `50-2000`, production price, and Pins/customer price, plus fixed neck print price `€0.70`.

### 4. Embroidery Pricing Data Required

Same as EU Standard:

- Small `€1.25` production / `€1.50` customer.
- Medium `€1.85` production / `€2.00` customer.
- Large `€2.50` production / `€2.75` customer.
- Customer digitising fee `€25`.
- Production digitising cost `€23`.

### 5. Setup, Digitising, Screen, Neck Print, Delivery, VAT, Markup, Currency Rules

- Currency: EUR.
- VAT: hardcoded `27%`.
- Garment markup is profile-specific:
  - Hoodie `€4`.
  - Long sleeve `€3`.
  - T-shirt `€2`.
- PK markup is optional and per unit.
- No screen setup charge was found.
- Neck print fixed unit price: `€0.70`.
- Digitising and delivery helper behaviour match EU Standard.
- US-client copy display appends `+ base` to the garment/position summary.

### 6. Quantity Tiers

Same as EU Standard:

- `50-99`, `100-249`, `250-499`, `500-999`, `1000-2000`.
- Quantities above `2000` lack seeded print tiers and fall back to zero print pricing in legacy behaviour.

### 7. Calculation Sequence

Same as EU Standard, with `US_CLIENTS` garment markup values and US-client quote copy formatting.

### 8. Results and Copy/Export Outputs

- Result cards and breakdown are shared with EU Standard.
- Copy output differs:

```text
Item 1:

B653 Beechfield Beechfield Low Profile 6 Panel Dad Cap (1c front + base)

50 x €6.74 each (€337.00 ex vat)
VAT = €90.99
TOTAL = €427.99
```

- The copied quote explicitly shows ex-VAT subtotal, VAT amount, and total.
- Customer-facing copy must not include calculator type names.

### 9. Rules Shared With Other Calculators

- Shared EU calculation engine and data surfaces with EU Standard.
- Shared garment catalogue.
- Shared EU print pricing tiers.
- Shared embroidery pricing.
- Shared VAT rate.
- Shared delivery helper.

### 10. Rules Unique to EU US Clients

- Uses `US_CLIENTS` garment markup profile.
- Customer copy format is US-client-specific.
- Print position summary uses lowercase `1c front` style instead of `1 Col Front`.
- Quote garment summary adds `+ base`.

## EU Trade

### 1. User Inputs

No implemented EU Trade route/profile was found. Based on planning notes, expected inputs likely mirror EU Standard:

- Design/item rows.
- Garment.
- Quantity.
- Print positions and colour counts.
- Optional embroidery items and sizes.
- Optional PK/trade markup if retained.

### 2. Garment Data Required

Expected to use the shared EU garment catalogue:

- Garment id, code, alt code, brand, name, colour.
- Garment type.
- EUR base price.
- Tags/search metadata.

### 3. Print Pricing Data Required

Unclear. Likely options:

- Reuse EU Standard `PrintPrice` production/customer tier table.
- Or introduce a trade-specific EU print price profile.

The legacy code does not define an `EU_TRADE` calculator profile or trade-specific EU print price table.

### 4. Embroidery Pricing Data Required

Planning notes say embroidery should be additive and support Embroidery 1-3. It is unclear whether EU Trade should reuse EU Standard embroidery size pricing or use a separate trade embroidery profile.

Confirmed planning values:

- Digitising fee applies per embroidery.
- If three embroideries are selected, digitising fee is multiplied by three.

### 5. Setup, Digitising, Screen, Neck Print, Delivery, VAT, Markup, Currency Rules

Confirmed or inferred:

- Currency: EUR.
- Trade calculator markup expected `€2`.
- VAT rule is not explicitly confirmed for EU Trade; likely `27%` if it follows EU calculators.
- Screen setup charges are not confirmed.
- Neck print rule is not confirmed; likely fixed `€0.70` only if it reuses EU calculator logic.
- Delivery helper rule is not confirmed.

### 6. Quantity Tiers

Not implemented. If reusing EU Standard print pricing, tiers would be `50-99`, `100-249`, `250-499`, `500-999`, `1000-2000`. If trade-specific, tiers need confirmation.

### 7. Calculation Sequence

Not implemented. Recommended target sequence if this becomes a calculator:

1. Reuse the shared EU calculation sequence.
2. Load an explicit `EU_TRADE` calculator configuration.
3. Apply trade markup from configuration instead of deriving from calculator title.
4. Add embroidery costs and digitising fees as additive line items.
5. Apply VAT according to calculator configuration.
6. Produce trade-specific copy from an explicit output template.

### 8. Results and Copy/Export Outputs

No implemented output format found.

The migration should not infer customer copy from EU Standard or UK Trade without confirmation. Add an explicit copy template decision before implementation.

### 9. Rules Shared With Other Calculators

Likely shared with EU Standard:

- Garment catalogue.
- Item rows and item labels.
- Print positions.
- Embroidery item model.
- Digitising-per-embroidery rule.

### 10. Rules Unique to EU Trade

Only confirmed unique rule is planned trade markup `€2`. Everything else needs confirmation.

## UK Trade

### 1. User Inputs

- Design/item rows.
- Optional custom item label.
- Garment selection from garment catalogue.
- Quantity, minimum input UI value `50`.
- Standard print positions:
  - Front.
  - Back.
  - Left sleeve.
  - Right sleeve.
- Neck print positions:
  - Neck Print Standard.
  - Neck Print Transfer.
- Colour count for standard print positions, accepted range `1` to `10`.
- Neck Print Standard and Neck Print Transfer are fixed neck-print options rather than ordinary colour-count inputs.
- Embroidery 1, Embroidery 2, Embroidery 3.
- Stitch count per embroidery item, minimum `7000`.

### 2. Garment Data Required

- Garment id.
- Code and alternate code.
- Brand name.
- Product name.
- Colour.
- GBP price (`gbpPrice`).
- Tags/search metadata.

EUR base price exists on legacy garment records but UK Trade uses `gbpPrice`.

### 3. Print Pricing Data Required

- Currency: GBP.
- UK screen print quantity tiers:
  - `50`, `100`, `200`, `500`, `1000`, `2500`, `5000`, `10000`.
- Colour counts: `1` through `10`.
- Screen print unit price by colour count and quantity tier.
- Inside neck standard print price by quantity tier.
- Inside neck transfer price by quantity tier.
- Setup charge per screen: `£20`.

### 4. Embroidery Pricing Data Required

- Embroidery setup charge per embroidery item: `£30`.
- UK embroidery quantity tiers:
  - `50`, `100`, `200`, `500`, `1000`, `2500`.
- Stitch rows:
  - `7000`, `8000`, `9000`, `10000`, `11000`, `12000`, `13000`, `14000`, `15000`.
- Extra `1000` stitches row for stitch counts above `15000`.
- Minimum stitch count: `7000`.
- Base stitch max before extra blocks: `15000`.

### 5. Setup, Digitising, Screen, Neck Print, Delivery, VAT, Markup, Currency Rules

- Currency: GBP.
- No VAT is applied in the inspected UK Trade totals or copy; copy says `ex vat`.
- No garment markup rule was found in UK Trade; total is cost-style trade pricing.
- Screen setup:
  - Standard print positions get setup screens equal to selected/pricing colour count.
  - Neck Print Standard counts as one screen because its pricing colour count is forced to `1`.
  - Neck Print Transfer does not get screen setup.
  - Setup cost = total setup screens * `£20`.
- Neck Print Standard and Neck Print Transfer use fixed neck price matrices by quantity tier.
- Embroidery setup = selected embroidery count * `£30`.
- No delivery helper was found for UK Trade.
- No PK markup input was found for UK Trade.

### 6. Quantity Tiers

- Screen print uses floor-tier lookup:
  - Quantity below `50` has no valid tier.
  - Quantity `50-99` uses `50`.
  - Quantity `100-199` uses `100`.
  - Quantity `200-499` uses `200`.
  - Quantity `500-999` uses `500`.
  - Quantity `1000-2499` uses `1000`.
  - Quantity `2500-4999` uses `2500`.
  - Quantity `5000-9999` uses `5000`.
  - Quantity `10000+` uses `10000`.
- Embroidery uses floor-tier lookup up to `2500`; quantities above `2500` use `2500`.

### 7. Calculation Sequence

1. Validate/select garment and ensure `gbpPrice` exists.
2. Require at least one print position or embroidery item for a valid priced item.
3. Resolve selected print positions.
4. For each selected print position:
   - Determine pricing colour count.
   - Standard positions use selected colour count.
   - Neck Print Standard forces pricing colour count to `1`.
   - Neck Print Transfer uses transfer neck matrix.
   - Resolve unit print price by floor quantity tier.
   - Multiply unit print price by quantity and add to print cost.
   - Add setup screen count when the position is setup-bearing.
5. Screen setup cost = setup screen count * `£20`.
6. For each selected embroidery item:
   - Normalize stitch count to at least `7000`.
   - Round to the next configured stitch row up to `15000`.
   - For counts above `15000`, use `15000` base plus extra `1000` stitch blocks.
   - Resolve unit embroidery price by quantity tier.
   - Embroidery cost = unit price * quantity.
   - Embroidery setup = `£30`.
7. Garment cost = `gbpPrice * quantity`.
8. Setup cost = screen setup cost + embroidery setup cost.
9. Total cost = garment cost + print cost + embroidery cost + setup cost.
10. Cost per unit = total cost / quantity for each valid item, and total cost / total valid quantity for order totals.

### 8. Results and Copy/Export Outputs

- Summary shows:
  - Garment cost.
  - Print cost.
  - Screen setup cost and screen count.
  - Embroidery cost.
  - Embroidery setup cost.
  - Total setup cost.
  - Total cost.
  - Cost per unit.
- Copy output uses shared quote copy helper for UK Trade:

```text
Item 1:

B653 Beechfield Beechfield Low Profile 6 Panel Dad Cap (1 Col Front)
50 x £7.74 each (£387.00 ex vat)
```

- Copy excludes invalid items without valid price.
- No VAT lines are included.

### 9. Rules Shared With Other Calculators

- Uses shared garment catalogue concept, but depends on GBP prices.
- Shares item labels and copy helper conventions.
- Shares print-position vocabulary for front/back/sleeves.
- Shares three embroidery item slots conceptually.

### 10. Rules Unique to UK Trade

- GBP pricing.
- `gbpPrice` required.
- Separate UK screen print price matrix.
- Separate UK embroidery stitch-count matrix.
- Screen setup charge per screen.
- Neck Print Standard and Neck Print Transfer as distinct positions.
- No VAT in inspected totals/copy.
- No PK markup.
- No delivery helper.

## Proposed Shared Supabase Pricing Tables

Use table names as planning placeholders; final names should match the rebuild's Supabase conventions.

### `garment_products`

Shared garment/product identity.

- `id`
- `code`
- `alt_code`
- `brand_name`
- `name`
- `colour`
- `garment_type`
- `tags`
- `active`
- `created_at`
- `updated_at`

### `garment_price_lists`

Separates garment identity from currency/profile-specific prices.

- `id`
- `garment_id`
- `currency`
- `region`
- `supplier`
- `unit_price`
- `extra_size_cost`
- `active_from`
- `active_to`
- `active`

This replaces the legacy single-row `basePrice` plus optional `gbpPrice` approach.

### `calculator_profiles`

Shared profile registry.

- `id`
- `code` (`EU_STANDARD`, `EU_US_CLIENTS`, `EU_TRADE`, `UK_TRADE`)
- `name`
- `region`
- `currency`
- `vat_rate`
- `active`

### `calculator_garment_markups`

Profile-specific per-unit garment markup.

- `id`
- `calculator_profile_id`
- `garment_type`
- `markup_value`
- `currency`

### `decoration_methods`

Shared decoration taxonomy.

- `id`
- `code` (`SCREEN_PRINT`, `NECK_PRINT`, `EMBROIDERY`)
- `name`

### `decoration_positions`

Shared position taxonomy.

- `id`
- `code` (`FRONT`, `BACK`, `LEFT_SLEEVE`, `RIGHT_SLEEVE`, `NECK`, `NECK_PRINT_STANDARD`, `NECK_PRINT_TRANSFER`)
- `name`
- `method_id`

### `print_price_tiers`

Generalized screen/neck print price tiers.

- `id`
- `calculator_profile_id` or `price_profile_id`
- `position_id` nullable for generic screen print rows.
- `currency`
- `colour_count`
- `quantity_min`
- `quantity_max` nullable when floor-tier pricing is used.
- `quantity_tier` nullable for floor-tier rows.
- `production_unit_price`
- `customer_unit_price`
- `unit_price`
- `tier_match_type` (`range` or `floor`)
- `active`

This can store EU range pricing and UK floor-tier pricing without hardcoding separate matrices.

### `embroidery_price_tiers`

Shared embroidery pricing by profile.

- `id`
- `calculator_profile_id` or `price_profile_id`
- `currency`
- `quantity_min`
- `quantity_max` nullable.
- `quantity_tier` nullable.
- `size_code` nullable for EU size pricing.
- `stitch_count_min` nullable.
- `stitch_count_max` nullable.
- `stitch_row` nullable.
- `extra_stitch_block_size` nullable.
- `production_unit_price`
- `customer_unit_price`
- `unit_price`
- `tier_match_type`
- `active`

### `setup_charge_rules`

Profile-specific setup/digitising rules.

- `id`
- `calculator_profile_id`
- `charge_code` (`SCREEN_SETUP_PER_SCREEN`, `DIGITISING_CUSTOMER`, `DIGITISING_PRODUCTION`, `EMBROIDERY_SETUP`)
- `method_id`
- `position_id` nullable.
- `currency`
- `amount`
- `charge_basis` (`per_screen`, `per_embroidery`, `per_design`, `per_order`)
- `applies_to_customer`
- `applies_to_production`
- `active`

### `delivery_rate_rules`

EU delivery helper data.

- `id`
- `calculator_profile_id`
- `country`
- `currency`
- `cost_per_box`
- `delivery_time`
- `vat_rate`
- `active`

Keep this separate from main calculator totals unless business rules change.

## Proposed Calculator-Specific Configuration Tables

### `calculator_profile_settings`

Stores behaviour flags that should be data-driven but not formula code.

- `calculator_profile_id`
- `minimum_quantity`
- `max_print_colours`
- `copy_template_code`
- `uses_vat`
- `shows_delivery_helper`
- `allows_pk_markup`
- `allows_embroidery`
- `allows_screen_setup`
- `default_quantity`
- `price_tier_match_type`

### `calculator_position_settings`

Controls available positions per calculator.

- `calculator_profile_id`
- `position_id`
- `enabled`
- `requires_colour_count`
- `fixed_colour_count`
- `setup_bearing`
- `price_table_code`
- `display_order`

Examples:

- EU Standard neck: fixed price position, no colour-tier lookup.
- UK Trade Neck Print Standard: fixed colour count `1`, setup-bearing.
- UK Trade Neck Print Transfer: no setup-bearing.

### `calculator_embroidery_settings`

Controls embroidery shape per calculator.

- `calculator_profile_id`
- `max_embroidery_items`
- `input_mode` (`size` or `stitch_count`)
- `minimum_stitch_count`
- `maximum_base_stitch_count`
- `extra_stitch_block_size`
- `setup_charge_rule_id`
- `digitising_charge_rule_id`

### `calculator_copy_templates`

Stores stable copy/export template identifiers and optional editable text fragments.

- `code`
- `calculator_profile_id`
- `line_format`
- `include_vat_lines`
- `include_digitising_line`
- `position_label_style`
- `garment_suffix`

The actual rendering should remain in TypeScript to avoid unsafe template evaluation.

## Logic That Should Remain in TypeScript

- Pure calculation orchestration:
  - resolving garment, print, embroidery, setup, VAT, totals, and profit.
- Tier resolution algorithms:
  - inclusive range lookup for EU.
  - floor-tier lookup for UK.
  - embroidery stitch normalization and extra-block calculation.
- Validation:
  - minimum quantity.
  - colour count range.
  - missing garment price.
  - missing price tier.
  - at least one decoration selected where required.
- Copy rendering:
  - use explicit template codes from data, but render in typed functions.
  - preserve exact customer-facing contracts.
- Currency and number formatting.
- UI state:
  - draft item rows.
  - temporary user-entered labels.
  - copy-to-clipboard actions.
  - local delivery helper state unless delivery quotes become saved records.
- Guardrails:
  - do not let missing tiers silently quote `0` in the rebuilt calculators; show an error state instead unless legacy-compatible fallback is intentionally required.

## Legacy Rules That Are Unclear or Conflicting

- EU Trade does not exist as an implemented legacy route/profile, despite being requested in the migration scope.
- EU Trade markup is documented as `€2`, but there is no seeded `EU_TRADE` profile or implemented formula.
- EU Trade VAT, copy format, setup charges, delivery helper, and print tiers need confirmation.
- Legacy EU embroidery note says “EU embroidery markup per unit is `3`, unless calculator title contains `trade`”, but the inspected calculation uses explicit embroidery customer prices, digitising fees, garment markups, and optional PK markup rather than a separate named embroidery markup field.
- EU Standard planning note says markup is `€3`, but seeded markups are garment-type-specific: hoodie `€5`, long sleeve `€3.50`, t-shirt `€3`.
- Garment `extraSizeCost` is stored but not included in inspected calculator calculations.
- EU print tiers stop at quantity `2000`; quantities above that currently fall back to zero print price in code because no tier matches.
- UK Trade has no VAT in inspected totals/copy, but copy labels values `ex vat`; confirm whether VAT is intentionally excluded or simply omitted.
- UK Trade garment rows require `gbpPrice`; legacy notes mention previous type/schema errors around `gbpPrice`.
- UK Trade pricing data is hardcoded/static, not database-backed; source of truth for future updates should be confirmed.
- Delivery helper country rates are hardcoded and not tied to calculator totals; confirm whether they should become shared data or remain helper-only.
- Customer copy formats are business contracts and should be regression-tested before replacing legacy calculators.

## Files Inspected

Rebuild repo:

- `AGENTS.md`
- `PROJECT_CONTEXT.md`
- `PRODUCT.md`
- `README.md`
- `docs/database-foundation.md`
- `docs/sales-dashboard-plan.md`

Legacy/reference project:

- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/Major Product Areas.md`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/001 - Database/Current DB Schema.md`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/001 - Database/Future DB Planning Summary.md`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/PROJECT_CONTEXT.md`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/README.md`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/prisma/schema.prisma`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/prisma/seed-data.ts`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/lib/calculator-profiles.ts`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/CalculatorPageContent.tsx`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/CalculatorClient.tsx`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/data.ts`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/copyFormatters.ts`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/displayStandards.ts`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/components/DesignCard.tsx`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/eu/standard/page.tsx`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/eu/us-clients/page.tsx`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/uk/trade/page.tsx`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/uk/trade/UkTradeCalculatorClient.tsx`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/uk/trade/UkTradeDesignCard.tsx`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/uk/trade/data.ts`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/uk/trade/types.ts`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/uk/tradeScreenPrintData.ts`
- `/home/duncan/Work/pins-and-knuckles/02-projects/pins-hub/pins-hub-app/src/app/hub/calculators/uk/tradeEmbroideryData.ts`

## Missing Information

- Confirm whether EU Trade should be built, because it is not implemented in inspected legacy code.
- Confirm EU Trade copy/export format.
- Confirm EU Trade print pricing source and quantity tiers.
- Confirm EU Trade VAT and delivery-helper behaviour.
- Confirm whether EU Trade uses a flat `€2` markup for all garment types or garment-type-specific trade markups.
- Confirm whether EU Standard should keep garment-type-specific markups or simplify to a flat `€3`.
- Confirm expected behaviour for EU quantities above `2000`.
- Confirm whether `extraSizeCost` should be included in future calculators.
- Confirm whether UK Trade should remain ex-VAT or add VAT in any display/copy context.
- Confirm the authoritative source and update process for UK screen print and embroidery price matrices.
- Confirm whether delivery helper rates should be editable data in Supabase.

## Recommended Calculator Implementation Order

1. EU Standard.
   - It has the clearest legacy behaviour and establishes the shared garment, print tier, markup, VAT, embroidery, digitising, delivery helper, and copy contracts.
2. EU US Clients.
   - It should reuse the EU Standard engine with a different profile and copy renderer, making it the best validation of profile-driven behaviour.
3. UK Trade.
   - It needs additional schema/configuration for GBP garment prices, floor-tier matrices, setup screens, neck transfer pricing, and stitch-count embroidery.
4. EU Trade.
   - Implement last, after the shared EU engine exists and after missing trade rules are confirmed.
