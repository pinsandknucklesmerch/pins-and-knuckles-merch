# Calculator Supabase Schema Reference

Source of truth:

- `docs/ai-context/PROJECT_CONTEXT.md`
- `docs/planning/CALCULATOR_MIGRATION_ANALYSIS.md`
- `docs/planning/LEGACY_CALCULATOR_BEHAVIOUR_CONFIRMATION.md`

This document began as the calculator schema plan. The schema and seed data have since been implemented in `supabase/migrations/20260715120000_calculator_schema.sql` and `supabase/migrations/20260715130000_calculator_seed.sql`; treat the migrations and generated types as implementation truth.

## Confirmed Migration Decisions

- EU calculators support quantities `50` to `2000` only.
- EU quantities outside `50..2000` must be invalid, not priced as zero.
- UK Trade uses its own quantity tiers up to `10000`.
- UK pricing must never be reused for EU calculators.
- US Clients `+ base` copy behaviour is preserved for now.
- UK Trade invalid items must be excluded from displayed totals and copied output.
- Delivery copy must separate per-box cost, delivery subtotal ex VAT, VAT, and total incl VAT.
- Extra-size pricing is deferred and must not affect calculator totals.
- EU Trade is deferred because no implemented rules exist.
- Calculator pricing is global initially: seeded calculator data uses `organisation_id = null`.
- Do not implement organisation-specific pricing overrides yet.
- EU Standard and EU US Clients share the EU print pricing set, EU embroidery pricing set, and delivery rate set.
- EU Standard and EU US Clients differ through garment markups, profile configuration, and copy formatter behaviour.
- UK Trade embroidery quantities above `2500` use the `2500` floor tier.
- UK Trade screen-print quantities remain limited to `50..10000`.
- Do not add an active EU Trade profile.

## Current Confirmed Schema Decisions

- Calculator pricing is global-only for the first migration.
- All calculator pricing tables that include `organisation_id` should constrain it to `null`.
- No organisation-specific fallback or override selection logic should be implemented yet.
- `calculator_profile_price_sets` is required now, not deferred.
- `EU_STANDARD` and `EU_US_CLIENTS` share:
  - `EU_SCREEN_PRINT_V1`
  - `EU_EMBROIDERY_V1`
  - `EU_DELIVERY_V1`
- `EU_STANDARD` and `EU_US_CLIENTS` differ through garment markups, profile configuration, and copy formatter behaviour.
- `UK_TRADE` uses only UK-specific print and embroidery pricing sets.
- UK Trade embroidery quantities above `2500` use the `2500` floor tier.
- UK Trade screen-print quantities above `10000` are invalid.
- Do not create or seed an active EU Trade profile.

## Design Principles

- Store price data and profile selection in Supabase.
- Keep calculation algorithms, validation, rounding boundaries, and quote copy rendering in pure TypeScript.
- Use stable profile codes, not page titles, to select pricing sets and copy behaviour.
- Keep EU and UK Trade pricing separated by profile, region, currency, and dedicated tier tables.
- Do not delete historical pricing rows. Retire rows with validity windows and `is_active`.
- Store currency values as `numeric(12,4)` so cents/pence and per-unit fractions are exact enough for pricing.
- Use generated Supabase types in repositories; map DB rows into calculator domain DTOs before calculating.

## Shared Conventions

Recommended common columns for pricing/config tables:

- `id uuid primary key default gen_random_uuid()`
- `organisation_id uuid null references public.organisations(id) on delete cascade`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `valid_from date not null default current_date`
- `valid_to date null`
- `is_active boolean not null default true`

`organisation_id` recommendation:

- Nullable for initial Pins & Knuckles global seed data.
- Current migrations should constrain calculator pricing rows to `organisation_id is null`.
- Do not add organisation-specific fallback or override logic yet.
- If organisation-specific pricing is needed later, remove the global-only checks in a reviewed migration and design explicit selection rules then.

RLS recommendation:

- Read access: authenticated users with `pins_hub` app access may read active calculator reference data.
- Write access: only users with `pins_hub` `admin` access should insert/update/retire pricing rows.
- Deletion: avoid app-level deletes; retire records with `is_active = false` or `valid_to`.
- Initial implementation seeds global rows with `organisation_id = null`.

## Table: `garments`

Purpose: shared garment catalogue for EU calculators, UK Trade, and the garment directory.

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, default `gen_random_uuid()`. |
| `organisation_id` | `uuid null` | Optional FK to `organisations`. Use null for global catalogue rows. |
| `code` | `text not null` | Supplier/style code. |
| `alt_code` | `text not null default ''` | Legacy alternate code. |
| `brand_name` | `text not null default ''` | Brand/supplier display value. |
| `name` | `text not null` | Garment display name. |
| `colour` | `text not null default ''` | Legacy colour field. |
| `garment_type` | `text not null` | Markup category, not necessarily product category. |
| `eur_base_price` | `numeric(12,4) null` | EU unit garment cost. |
| `gbp_price` | `numeric(12,4) null` | UK Trade unit garment cost. |
| `extra_size_cost` | `numeric(12,4) null` | Metadata only for now; do not use in calculator totals. |
| `tags` | `text not null default ''` | Search terms. |
| `is_active` | `boolean not null default true` | Soft-retire flag. |
| `created_at` | `timestamptz not null default now()` | Audit. |
| `updated_at` | `timestamptz not null default now()` | Audit. |

Primary key:

- `id`.

Foreign keys:

- `organisation_id -> public.organisations(id)`.

Unique constraints:

- Do not enforce unique `code`; legacy data contains duplicate codes by colour/variant.
- Recommended soft uniqueness: unique active row on `(organisation_id, code, brand_name, name, colour)` if data cleanup confirms it is safe.

Check constraints:

- `garment_type in ('TSHIRT', 'LONGSLEEVE', 'HOODIE')`.
- `eur_base_price is null or eur_base_price >= 0`.
- `gbp_price is null or gbp_price >= 0`.
- `extra_size_cost is null or extra_size_cost >= 0`.
- `length(trim(code)) > 0`.
- `length(trim(name)) > 0`.

Indexes:

- `(organisation_id, is_active)`.
- `(code)`.
- `(brand_name)`.
- `(garment_type)`.
- Optional trigram/search index later for garment picker search.

Organisation requirement:

- `organisation_id` nullable initially.

Recommended RLS:

- `select`: authenticated users with `pins_hub` access.
- `insert/update`: `pins_hub` admin.
- No hard deletes through the app.

Example rows:

| code | alt_code | brand_name | name | colour | garment_type | eur_base_price | gbp_price | extra_size_cost | tags |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | --- |
| `JH001` | `` | `AWDis` | `AWDis College hoodie` | `Whites` | `HOODIE` | `9.5000` | null | `1.5000` | `AWDis, hoodie, white, college, JH001` |
| `B653` | `BC653` | `Beechfield` | `Beechfield Low Profile 6 Panel Dad Cap` | `` | `TSHIRT` | `3.2000` | null | null | `bb653, beechfield, cap, dad cap, BC653` |
| `GD01` | `64000` | `Gildan` | `Gildan SoftStyle Adult T-Shirt` | `Colours` | `TSHIRT` | `2.2500` | null | `0.7000` | `GD01, 64000, SOFT, SOFTSTYLE, GILDAN` |

## Table: `calculator_profiles`

Purpose: stable calculator profile selector and high-level behaviour flags.

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `organisation_id` | `uuid null` | Optional organisation override. |
| `code` | `text not null` | Stable selector used by routes and TypeScript. |
| `name` | `text not null` | Admin/display label. |
| `region` | `text not null` | `EU` or `UK`. |
| `currency_code` | `char(3) not null` | `EUR` or `GBP`. |
| `vat_rate` | `numeric(5,2) null` | EU currently `27.00`; UK Trade null or `0.00`. |
| `min_quantity` | `integer not null` | Profile minimum quantity. |
| `max_quantity` | `integer null` | EU `2000`, UK `10000`. |
| `max_colours` | `integer null` | EU `9`, UK Trade standard print `10`. |
| `tier_strategy` | `text not null` | `range` for EU, `floor` for UK Trade. |
| `copy_formatter_code` | `text not null` | TypeScript formatter key. |
| `supports_delivery` | `boolean not null default false` | EU true, UK false. |
| `supports_pk_markup` | `boolean not null default false` | EU true, UK false. |
| `supports_embroidery` | `boolean not null default false` | EU and UK true. |
| `supports_screen_setup` | `boolean not null default false` | UK true. |
| `is_deferred` | `boolean not null default false` | Use for deferred profiles such as EU Trade if recorded. |
| `is_active` | `boolean not null default true` | Active selector flag. |
| `created_at` | `timestamptz not null default now()` | Audit. |
| `updated_at` | `timestamptz not null default now()` | Audit. |

Primary key:

- `id`.

Foreign keys:

- `organisation_id -> public.organisations(id)`.

Unique constraints:

- Unique `(organisation_id, code)`.
- If using null global rows, enforce global uniqueness with a partial unique index on `code where organisation_id is null`.

Check constraints:

- `code in ('EU_STANDARD', 'EU_US_CLIENTS', 'UK_TRADE')` initially.
- Do not add active `EU_TRADE` until rules are implemented.
- `region in ('EU', 'UK')`.
- `currency_code in ('EUR', 'GBP')`.
- `tier_strategy in ('range', 'floor')`.
- `min_quantity >= 1`.
- `max_quantity is null or max_quantity >= min_quantity`.
- `vat_rate is null or vat_rate >= 0`.

Indexes:

- `(organisation_id, code)`.
- `(region, currency_code, is_active)`.

Organisation requirement:

- Nullable initially.

Recommended RLS:

- `select`: authenticated users with `pins_hub` access.
- `insert/update`: `pins_hub` admin.

Example rows:

| code | name | region | currency_code | vat_rate | min_quantity | max_quantity | max_colours | tier_strategy | copy_formatter_code |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| `EU_STANDARD` | `EU Standard` | `EU` | `EUR` | `27.00` | `50` | `2000` | `9` | `range` | `eu_standard` |
| `EU_US_CLIENTS` | `EU US Clients` | `EU` | `EUR` | `27.00` | `50` | `2000` | `9` | `range` | `eu_us_clients` |
| `UK_TRADE` | `UK Trade` | `UK` | `GBP` | null | `50` | `10000` | `10` | `floor` | `uk_trade` |

## Table: `calculator_garment_markups`

Purpose: profile-specific per-unit garment markups for EU calculators.

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `organisation_id` | `uuid null` | Optional organisation override. |
| `calculator_profile_id` | `uuid not null` | FK to profile. |
| `garment_type` | `text not null` | Legacy markup category. |
| `markup_value` | `numeric(12,4) not null` | Per-unit amount in profile currency. |
| `valid_from` | `date not null default current_date` | Activation date. |
| `valid_to` | `date null` | Retirement date. |
| `is_active` | `boolean not null default true` | Current active flag. |
| `created_at` | `timestamptz not null default now()` | Audit. |
| `updated_at` | `timestamptz not null default now()` | Audit. |

Primary key:

- `id`.

Foreign keys:

- `organisation_id -> public.organisations(id)`.
- `calculator_profile_id -> calculator_profiles(id)`.

Unique constraints:

- Unique active row on `(calculator_profile_id, garment_type)` where `is_active`.

Check constraints:

- `garment_type in ('TSHIRT', 'LONGSLEEVE', 'HOODIE')`.
- `markup_value >= 0`.
- `valid_to is null or valid_to >= valid_from`.

Indexes:

- `(calculator_profile_id, garment_type, is_active)`.
- `(organisation_id, is_active)`.

Organisation requirement:

- Nullable initially; should match the linked profile scope.

Recommended RLS:

- Same as `calculator_profiles`.

Example rows:

| profile_code | garment_type | markup_value |
| --- | --- | ---: |
| `EU_STANDARD` | `TSHIRT` | `3.0000` |
| `EU_STANDARD` | `LONGSLEEVE` | `3.5000` |
| `EU_STANDARD` | `HOODIE` | `5.0000` |
| `EU_US_CLIENTS` | `TSHIRT` | `2.0000` |
| `EU_US_CLIENTS` | `LONGSLEEVE` | `3.0000` |
| `EU_US_CLIENTS` | `HOODIE` | `4.0000` |

## Table: `calculator_profile_price_sets`

Purpose: explicit mapping from a calculator profile to the pricing set codes it should use.

This table prevents implicit title-based or region-based price selection. It also makes the confirmed sharing explicit: `EU_STANDARD` and `EU_US_CLIENTS` point to the same `print`, `embroidery`, and `delivery` pricing set codes, while UK Trade points only to UK-specific print and embroidery sets.

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, default `gen_random_uuid()`. |
| `calculator_profile_id` | `uuid not null` | FK to profile. |
| `price_kind` | `text not null` | `print`, `embroidery`, or `delivery`. |
| `pricing_set_code` | `text not null` | Stable set code. |
| `created_at` | `timestamptz not null default now()` | Audit. |

Primary key:

- `id`.

Foreign keys:

- `calculator_profile_id -> calculator_profiles(id)`.

Unique constraints:

- Unique `(calculator_profile_id, price_kind)`.

Check constraints:

- `price_kind in ('print', 'embroidery', 'delivery')`.
- `length(trim(pricing_set_code)) > 0`.

Indexes:

- `(calculator_profile_id)`.
- `(price_kind, pricing_set_code)`.

Organisation requirement:

- No `organisation_id` column. Scope is inherited from the linked profile, and profiles are global-only initially.

Recommended RLS:

- `select`: authenticated users with `pins_hub` access.
- `insert/update`: `pins_hub` admin.
- No delete policy initially.

Example rows:

| profile_code | price_kind | pricing_set_code |
| --- | --- | --- |
| `EU_STANDARD` | `print` | `EU_SCREEN_PRINT_V1` |
| `EU_STANDARD` | `embroidery` | `EU_EMBROIDERY_V1` |
| `EU_STANDARD` | `delivery` | `EU_DELIVERY_V1` |
| `EU_US_CLIENTS` | `print` | `EU_SCREEN_PRINT_V1` |
| `EU_US_CLIENTS` | `embroidery` | `EU_EMBROIDERY_V1` |
| `EU_US_CLIENTS` | `delivery` | `EU_DELIVERY_V1` |
| `UK_TRADE` | `print` | `UK_TRADE_PRINT_V1` |
| `UK_TRADE` | `embroidery` | `UK_TRADE_EMBROIDERY_V1` |

## Table: `eu_print_price_tiers`

Purpose: EU screen print tier prices for EU Standard and EU US Clients. UK Trade must not read from this table.

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `organisation_id` | `uuid null` | Optional organisation override. |
| `pricing_set_code` | `text not null` | Example: `EU_SCREEN_PRINT_V1`. |
| `colour_count` | `integer not null` | `1..9`. |
| `quantity_min` | `integer not null` | Inclusive. |
| `quantity_max` | `integer not null` | Inclusive. |
| `production_unit_price` | `numeric(12,4) not null` | Production cost per unit. |
| `customer_unit_price` | `numeric(12,4) not null` | Pins/customer print price per unit. |
| `currency_code` | `char(3) not null default 'EUR'` | Must be EUR. |
| `valid_from` | `date not null default current_date` | Activation date. |
| `valid_to` | `date null` | Retirement date. |
| `is_active` | `boolean not null default true` | Current active flag. |
| `created_at` | `timestamptz not null default now()` | Audit. |
| `updated_at` | `timestamptz not null default now()` | Audit. |

Primary key:

- `id`.

Foreign keys:

- `organisation_id -> public.organisations(id)`.

Unique constraints:

- Unique active row on `(pricing_set_code, colour_count, quantity_min, quantity_max)` where `is_active`.

Check constraints:

- `currency_code = 'EUR'`.
- `colour_count between 1 and 9`.
- `quantity_min >= 50`.
- `quantity_max <= 2000`.
- `quantity_max >= quantity_min`.
- `production_unit_price >= 0`.
- `customer_unit_price >= 0`.

Indexes:

- `(pricing_set_code, colour_count, quantity_min, quantity_max, is_active)`.
- `(organisation_id, is_active)`.

Organisation requirement:

- Nullable initially.

Recommended RLS:

- `select`: authenticated users with `pins_hub` access.
- `insert/update`: `pins_hub` admin.

Example rows:

| pricing_set_code | colour_count | quantity_min | quantity_max | production_unit_price | customer_unit_price |
| --- | ---: | ---: | ---: | ---: | ---: |
| `EU_SCREEN_PRINT_V1` | `1` | `50` | `99` | `1.4000` | `1.5400` |
| `EU_SCREEN_PRINT_V1` | `1` | `100` | `249` | `1.1500` | `1.2600` |
| `EU_SCREEN_PRINT_V1` | `1` | `250` | `499` | `1.0000` | `1.1000` |
| `EU_SCREEN_PRINT_V1` | `2` | `50` | `99` | `1.6000` | `1.7600` |
| `EU_SCREEN_PRINT_V1` | `9` | `1000` | `2000` | `2.9000` | `3.1900` |

## Table: `uk_trade_print_price_tiers`

Purpose: UK Trade screen print and neck print price tiers. EU calculators must not read from this table.

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `organisation_id` | `uuid null` | Optional organisation override. |
| `pricing_set_code` | `text not null` | Example: `UK_TRADE_PRINT_V1`. |
| `position_code` | `text not null` | `STANDARD`, `NECK_PRINT_STANDARD`, `NECK_PRINT_TRANSFER`. |
| `colour_count` | `integer null` | Required for standard print rows; fixed `1` for neck standard; null for transfer if preferred. |
| `quantity_tier` | `integer not null` | Floor tier. |
| `unit_price` | `numeric(12,4) not null` | Trade unit print price. |
| `currency_code` | `char(3) not null default 'GBP'` | Must be GBP. |
| `setup_screen_count_strategy` | `text not null default 'colour_count'` | `colour_count`, `one`, or `none`. |
| `valid_from` | `date not null default current_date` | Activation date. |
| `valid_to` | `date null` | Retirement date. |
| `is_active` | `boolean not null default true` | Current active flag. |
| `created_at` | `timestamptz not null default now()` | Audit. |
| `updated_at` | `timestamptz not null default now()` | Audit. |

Primary key:

- `id`.

Foreign keys:

- `organisation_id -> public.organisations(id)`.

Unique constraints:

- Unique active row on `(pricing_set_code, position_code, colour_count, quantity_tier)` where `is_active`.

Check constraints:

- `currency_code = 'GBP'`.
- `position_code in ('STANDARD', 'NECK_PRINT_STANDARD', 'NECK_PRINT_TRANSFER')`.
- `quantity_tier in (50, 100, 200, 500, 1000, 2500, 5000, 10000)`.
- Standard rows: `position_code = 'STANDARD'` requires `colour_count between 1 and 10`.
- Neck standard rows: `position_code = 'NECK_PRINT_STANDARD'` requires `colour_count = 1`.
- Neck transfer rows may use `colour_count is null` or `colour_count = 0`; pick one convention before migration.
- `unit_price >= 0`.
- `setup_screen_count_strategy in ('colour_count', 'one', 'none')`.

Indexes:

- `(pricing_set_code, position_code, colour_count, quantity_tier, is_active)`.
- `(organisation_id, is_active)`.

Organisation requirement:

- Nullable initially.

Recommended RLS:

- Same as `eu_print_price_tiers`.

Example rows:

| pricing_set_code | position_code | colour_count | quantity_tier | unit_price | setup_screen_count_strategy |
| --- | --- | ---: | ---: | ---: | --- |
| `UK_TRADE_PRINT_V1` | `STANDARD` | `1` | `50` | `1.4700` | `colour_count` |
| `UK_TRADE_PRINT_V1` | `STANDARD` | `1` | `100` | `0.9300` | `colour_count` |
| `UK_TRADE_PRINT_V1` | `STANDARD` | `2` | `50` | `1.6300` | `colour_count` |
| `UK_TRADE_PRINT_V1` | `NECK_PRINT_STANDARD` | `1` | `50` | `0.8900` | `one` |
| `UK_TRADE_PRINT_V1` | `NECK_PRINT_TRANSFER` | null | `50` | `1.3400` | `none` |

## Table: `eu_embroidery_pricing`

Purpose: EU embroidery size pricing for EU Standard and EU US Clients.

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `organisation_id` | `uuid null` | Optional organisation override. |
| `pricing_set_code` | `text not null` | Example: `EU_EMBROIDERY_V1`. |
| `size_code` | `text not null` | `small`, `medium`, `large`. |
| `label` | `text not null` | Display label. |
| `production_unit_price` | `numeric(12,4) not null` | Production unit cost. |
| `customer_unit_price` | `numeric(12,4) not null` | Customer unit price. |
| `currency_code` | `char(3) not null default 'EUR'` | Must be EUR. |
| `valid_from` | `date not null default current_date` | Activation date. |
| `valid_to` | `date null` | Retirement date. |
| `is_active` | `boolean not null default true` | Current active flag. |
| `created_at` | `timestamptz not null default now()` | Audit. |
| `updated_at` | `timestamptz not null default now()` | Audit. |

Primary key:

- `id`.

Foreign keys:

- `organisation_id -> public.organisations(id)`.

Unique constraints:

- Unique active row on `(pricing_set_code, size_code)` where `is_active`.

Check constraints:

- `currency_code = 'EUR'`.
- `size_code in ('small', 'medium', 'large')`.
- `production_unit_price >= 0`.
- `customer_unit_price >= 0`.

Indexes:

- `(pricing_set_code, size_code, is_active)`.

Organisation requirement:

- Nullable initially.

Recommended RLS:

- Same as print tier tables.

Example rows:

| pricing_set_code | size_code | label | production_unit_price | customer_unit_price |
| --- | --- | --- | ---: | ---: |
| `EU_EMBROIDERY_V1` | `small` | `Small` | `1.2500` | `1.5000` |
| `EU_EMBROIDERY_V1` | `medium` | `Medium` | `1.8500` | `2.0000` |
| `EU_EMBROIDERY_V1` | `large` | `Large` | `2.5000` | `2.7500` |

## Table: `uk_trade_embroidery_pricing`

Purpose: UK Trade embroidery pricing by stitch row and quantity floor tier.

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `organisation_id` | `uuid null` | Optional organisation override. |
| `pricing_set_code` | `text not null` | Example: `UK_TRADE_EMBROIDERY_V1`. |
| `stitch_count` | `integer not null` | Base row stitch count or extra block sentinel. |
| `is_extra_1000_stitches` | `boolean not null default false` | True for extra 1000 stitch row. |
| `quantity_tier` | `integer not null` | Floor tier. |
| `unit_price` | `numeric(12,4) not null` | Trade unit embroidery price. |
| `currency_code` | `char(3) not null default 'GBP'` | Must be GBP. |
| `valid_from` | `date not null default current_date` | Activation date. |
| `valid_to` | `date null` | Retirement date. |
| `is_active` | `boolean not null default true` | Current active flag. |
| `created_at` | `timestamptz not null default now()` | Audit. |
| `updated_at` | `timestamptz not null default now()` | Audit. |

Primary key:

- `id`.

Foreign keys:

- `organisation_id -> public.organisations(id)`.

Unique constraints:

- Unique active row on `(pricing_set_code, stitch_count, is_extra_1000_stitches, quantity_tier)` where `is_active`.

Check constraints:

- `currency_code = 'GBP'`.
- `quantity_tier in (50, 100, 200, 500, 1000, 2500)`.
- Base rows: `is_extra_1000_stitches = false` and `stitch_count in (7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000)`.
- Extra row: `is_extra_1000_stitches = true` and `stitch_count = 1000`.
- `unit_price >= 0`.

Indexes:

- `(pricing_set_code, stitch_count, is_extra_1000_stitches, quantity_tier, is_active)`.

Organisation requirement:

- Nullable initially.

Recommended RLS:

- Same as print tier tables.

Example rows:

| pricing_set_code | stitch_count | is_extra_1000_stitches | quantity_tier | unit_price |
| --- | ---: | --- | ---: | ---: |
| `UK_TRADE_EMBROIDERY_V1` | `7000` | `false` | `50` | `2.1500` |
| `UK_TRADE_EMBROIDERY_V1` | `7000` | `false` | `100` | `2.0400` |
| `UK_TRADE_EMBROIDERY_V1` | `8000` | `false` | `50` | `2.3700` |
| `UK_TRADE_EMBROIDERY_V1` | `9000` | `false` | `50` | `2.5900` |
| `UK_TRADE_EMBROIDERY_V1` | `1000` | `true` | `50` | example import from legacy extra-stitch row |

## Table: `calculator_fees`

Purpose: setup, digitising, and fixed special-fee rows used by calculator profiles.

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `organisation_id` | `uuid null` | Optional organisation override. |
| `calculator_profile_id` | `uuid not null` | FK to profile. |
| `fee_code` | `text not null` | Stable code. |
| `fee_label` | `text not null` | Admin/display label. |
| `amount` | `numeric(12,4) not null` | Fee amount. |
| `currency_code` | `char(3) not null` | Must match profile currency. |
| `applies_per` | `text not null` | Unit basis. |
| `cost_side` | `text not null` | `production`, `customer`, or `trade`. |
| `valid_from` | `date not null default current_date` | Activation date. |
| `valid_to` | `date null` | Retirement date. |
| `is_active` | `boolean not null default true` | Current active flag. |
| `created_at` | `timestamptz not null default now()` | Audit. |
| `updated_at` | `timestamptz not null default now()` | Audit. |

Primary key:

- `id`.

Foreign keys:

- `organisation_id -> public.organisations(id)`.
- `calculator_profile_id -> calculator_profiles(id)`.

Unique constraints:

- Unique active row on `(calculator_profile_id, fee_code, cost_side)` where `is_active`.

Check constraints:

- `fee_code in ('EU_DIGITISING', 'EU_NECK_PRINT', 'UK_SCREEN_SETUP', 'UK_EMBROIDERY_SETUP')`.
- `currency_code in ('EUR', 'GBP')`.
- `applies_per in ('embroidery_item', 'unit', 'screen')`.
- `cost_side in ('production', 'customer', 'trade')`.
- `amount >= 0`.

Indexes:

- `(calculator_profile_id, fee_code, is_active)`.
- `(organisation_id, is_active)`.

Organisation requirement:

- Nullable initially.

Recommended RLS:

- Same as pricing tables.

Example rows:

| profile_code | fee_code | amount | currency_code | applies_per | cost_side |
| --- | --- | ---: | --- | --- | --- |
| `EU_STANDARD` | `EU_DIGITISING` | `25.0000` | `EUR` | `embroidery_item` | `customer` |
| `EU_STANDARD` | `EU_DIGITISING` | `23.0000` | `EUR` | `embroidery_item` | `production` |
| `EU_US_CLIENTS` | `EU_DIGITISING` | `25.0000` | `EUR` | `embroidery_item` | `customer` |
| `EU_US_CLIENTS` | `EU_DIGITISING` | `23.0000` | `EUR` | `embroidery_item` | `production` |
| `EU_STANDARD` | `EU_NECK_PRINT` | `0.7000` | `EUR` | `unit` | `customer` |
| `EU_STANDARD` | `EU_NECK_PRINT` | `0.7000` | `EUR` | `unit` | `production` |
| `UK_TRADE` | `UK_SCREEN_SETUP` | `20.0000` | `GBP` | `screen` | `trade` |
| `UK_TRADE` | `UK_EMBROIDERY_SETUP` | `30.0000` | `GBP` | `embroidery_item` | `trade` |

## Table: `delivery_rates`

Purpose: EU delivery helper rates. Delivery helper remains separate from calculator production/customer totals.

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `organisation_id` | `uuid null` | Optional organisation override. |
| `pricing_set_code` | `text not null` | Example: `EU_DELIVERY_V1`; shared by EU profiles through `calculator_profile_price_sets`. |
| `country` | `text not null` | Delivery country/area label. |
| `currency_code` | `char(3) not null default 'EUR'` | Must be EUR for current EU helper. |
| `cost_per_box` | `numeric(12,4) not null` | Per-box ex-VAT cost. |
| `delivery_time` | `text not null` | Human label, e.g. `2 days`. |
| `vat_rate` | `numeric(5,2) not null default 27.00` | Delivery VAT rate. |
| `valid_from` | `date not null default current_date` | Activation date. |
| `valid_to` | `date null` | Retirement date. |
| `is_active` | `boolean not null default true` | Current active flag. |
| `created_at` | `timestamptz not null default now()` | Audit. |
| `updated_at` | `timestamptz not null default now()` | Audit. |

Primary key:

- `id`.

Foreign keys:

- `organisation_id -> public.organisations(id)`.
- No calculator profile foreign key; profiles select this data through `calculator_profile_price_sets`.

Unique constraints:

- Unique active row on `(pricing_set_code, country)` where `is_active`.

Check constraints:

- `currency_code = 'EUR'`.
- `cost_per_box >= 0`.
- `vat_rate >= 0`.
- `length(trim(country)) > 0`.

Indexes:

- `(pricing_set_code, country, is_active)`.
- `(organisation_id, is_active)`.

Organisation requirement:

- Nullable initially.

Recommended RLS:

- `select`: authenticated users with `pins_hub` access.
- `insert/update`: `pins_hub` admin.

Example rows:

| pricing_set_code | country | cost_per_box | delivery_time | vat_rate |
| --- | --- | ---: | --- | ---: |
| `EU_DELIVERY_V1` | `Germany` | `25.0000` | `2 days` | `27.00` |
| `EU_DELIVERY_V1` | `Austria` | `25.0000` | `1 day` | `27.00` |
| `EU_DELIVERY_V1` | `England` | `65.0000` | `4 days` | `27.00` |

Delivery copy TypeScript must output separate values:

- `Cost Per Box: €25.00 excl. VAT`
- `Delivery Subtotal: €50.00 excl. VAT`
- `VAT: €13.50`
- `Total Delivery Cost Incl. VAT: €63.50`

## Behaviour in Supabase

Store in Supabase:

- Garment catalogue and active/inactive garment rows.
- Calculator profile metadata and stable profile codes.
- Profile garment markups.
- EU print price ranges.
- UK Trade print floor tiers.
- EU embroidery size prices.
- UK Trade embroidery stitch rows and extra-stitch rows.
- Setup, digitising, neck-print, and embroidery setup fee amounts.
- Delivery helper country rates.
- Activation/retirement windows for pricing history.

Do not store in Supabase:

- Runtime quote drafts unless a future quote-saving feature is requested.
- User-entered item state, colour selections, stitch counts, PK markup values, delivery box count, or delivery markup.
- Copy text generated from a particular quote.
- Pure calculation outcomes unless quote persistence is explicitly designed later.

## Behaviour in Pure TypeScript

Keep in pure TypeScript:

- Profile-to-engine routing.
- EU range validation: quantity must be `50..2000`.
- EU range tier lookup: find row where `quantity_min <= quantity <= quantity_max`.
- EU missing tier handling: invalid item/error, never zero-priced.
- UK Trade floor-tier lookup: greatest configured tier less than or equal to quantity.
- UK Trade invalid item handling: invalid items excluded from displayed totals and copied output.
- UK setup screen count rules:
  - standard print positions use colour count.
  - neck standard uses one screen.
  - neck transfer uses no screen setup.
- UK embroidery stitch normalization:
  - minimum stitch count `7000`.
  - round up to configured base stitch row up to `15000`.
  - add extra `1000` stitch blocks above `15000`.
- VAT calculation and display rounding.
- US Clients unconditional `+ base` copy suffix when work summary exists.
- Delivery helper calculations and corrected copy values.
- Extra-size price exclusion from all calculator totals.
- Quote copy renderers and clipboard formatting.

## Profile Codes and Pricing Set Selection

Recommended profile code mapping:

| Profile code | Engine | Print source | Embroidery source | Fees | Delivery |
| --- | --- | --- | --- | --- | --- |
| `EU_STANDARD` | EU | `eu_print_price_tiers` with `EU_SCREEN_PRINT_V1` | `eu_embroidery_pricing` with `EU_EMBROIDERY_V1` | EU digitising and neck print | yes |
| `EU_US_CLIENTS` | EU | `eu_print_price_tiers` with `EU_SCREEN_PRINT_V1` | `eu_embroidery_pricing` with `EU_EMBROIDERY_V1` | EU digitising and neck print | yes |
| `UK_TRADE` | UK Trade | `uk_trade_print_price_tiers` with `UK_TRADE_PRINT_V1` | `uk_trade_embroidery_pricing` with `UK_TRADE_EMBROIDERY_V1` | UK screen and embroidery setup | no |

Add explicit mapping columns later if needed:

- `calculator_profile_price_sets(profile_id, price_kind, pricing_set_code)`.

For now, keep mapping in TypeScript or add it only if admins need to swap pricing sets independently from profile rows.

## EU and UK Quantity-Tier Lookup Difference

EU:

- Valid quantity range: `50..2000`.
- Lookup uses inclusive ranges.
- Quantity outside range is invalid.
- No fallback to zero.
- No use of UK tiers.

UK Trade:

- Valid quantity range: `50..10000` for screen print.
- Lookup uses floor tiers: choose the greatest configured `quantity_tier <= quantity`.
- Quantities below `50` are invalid.
- Quantities above `10000` should be invalid for print unless a future tier is added.
- UK embroidery uses floor tiers up to `2500`; quantities above `2500` use the `2500` embroidery tier if confirmed in engine tests.

## Currency Storage

- Store all currency and per-unit numeric values as `numeric(12,4)`.
- Do not use `float`, `real`, or JavaScript-derived binary decimals in Supabase.
- Store the currency code on every pricing table, even where constrained, to make accidental cross-region reuse visible.
- TypeScript should convert database strings/decimals into domain-safe numeric handling at the boundary and round only for display/copy.

## Activating and Retiring Pricing Records

Use append-and-retire:

1. Insert new pricing rows with a new `valid_from`.
2. Set old rows to `is_active = false` or set `valid_to`.
3. Keep historical rows for quote auditability and future comparison.
4. Avoid physical deletes except for mistaken local seed data before production use.

Recommended active-row query rule:

```text
is_active = true
and valid_from <= quote_date
and (valid_to is null or valid_to >= quote_date)
```

If quote persistence is added later, saved quotes should store the pricing effective date and/or price row ids used.

## Implemented Migration State

Implemented in `20260715120000_calculator_schema.sql`:

1. Shared pricing checks and timestamp trigger helpers.
2. `garments`.
3. `calculator_profiles`.
4. `calculator_garment_markups`.
5. `calculator_pricing_sets` and `calculator_profile_price_sets`.
6. EU pricing tables: `eu_print_price_tiers`, `eu_embroidery_pricing`.
7. UK Trade pricing tables: `uk_trade_print_price_tiers`, `uk_trade_embroidery_pricing`.
8. `calculator_fees`.
9. `delivery_rates`.
10. RLS read/admin-write policies.
11. Generated Supabase database types in `src/types/database.types.ts`.

## Implemented Seed State

Implemented in `20260715130000_calculator_seed.sql`:

1. Seed global `calculator_profiles`: `EU_STANDARD`, `EU_US_CLIENTS`, `UK_TRADE`.
2. Seed `garments` with current EUR and GBP fields; keep `extra_size_cost` as metadata only.
3. Seed `calculator_garment_markups` for EU profiles.
4. Seed `eu_print_price_tiers`.
5. Seed `eu_embroidery_pricing`.
6. Seed EU `calculator_fees` for digitising and neck print.
7. Seed UK `uk_trade_print_price_tiers`.
8. Seed `uk_trade_embroidery_pricing`.
9. Seed UK setup fees.
10. Seed EU `delivery_rates`.
11. Seed calculator profile pricing-set mappings.

## Deferred Future Decisions

- When multi-organisation pricing is needed, review and remove the current global-only `organisation_id is null` checks with explicit fallback/override rules.
- Quote persistence remains deferred until calculator flows are stable.
- Do not seed an active EU Trade profile until rules exist.

## Risks of Over-Normalising the Schema

Note: the current confirmed decisions at the top of this document supersede older planning notes about organisation overrides, shared delivery sets, UK embroidery quantities above `2500`, and active EU Trade profiles.

- Separating every position, method, price set, and fee into many generic tables can slow the rebuild and make imports fragile.
- A generic decoration pricing model may accidentally allow UK prices to leak into EU calculators.
- Too much configurability can move business logic out of tested TypeScript and into data combinations that are hard to reason about.
- Admin-editable formulas increase risk; store amounts and active windows, not algorithms.
- Legacy garment data has imperfect categories and duplicate codes. Enforcing strict uniqueness too early could block valid imports.
- Quote copy behaviour is a business contract. Storing copy templates as arbitrary editable text could break output parity.
- The first implementation should prefer explicit EU and UK tables over a single universal pricing table; merge later only if repeated patterns justify it.
