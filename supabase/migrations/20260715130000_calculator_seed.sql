insert into public.calculator_profiles (
  id,
  organisation_id,
  code,
  name,
  region,
  currency_code,
  vat_rate,
  min_quantity,
  max_quantity,
  max_colours,
  tier_strategy,
  copy_formatter_code,
  supports_delivery,
  supports_pk_markup,
  supports_embroidery,
  supports_screen_setup,
  is_deferred,
  is_active
)
values
  ('00000000-0000-0000-0000-000000000101', null, 'EU_STANDARD', 'EU Standard', 'EU', 'EUR', 27.00, 50, 2000, 9, 'range', 'eu_standard', true, true, true, false, false, true),
  ('00000000-0000-0000-0000-000000000102', null, 'EU_US_CLIENTS', 'EU US Clients', 'EU', 'EUR', 27.00, 50, 2000, 9, 'range', 'eu_us_clients', true, true, true, false, false, true),
  ('00000000-0000-0000-0000-000000000103', null, 'UK_TRADE', 'UK Trade', 'UK', 'GBP', null, 50, 10000, 10, 'floor', 'uk_trade', false, false, true, true, false, true)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  region = excluded.region,
  currency_code = excluded.currency_code,
  vat_rate = excluded.vat_rate,
  min_quantity = excluded.min_quantity,
  max_quantity = excluded.max_quantity,
  max_colours = excluded.max_colours,
  tier_strategy = excluded.tier_strategy,
  copy_formatter_code = excluded.copy_formatter_code,
  supports_delivery = excluded.supports_delivery,
  supports_pk_markup = excluded.supports_pk_markup,
  supports_embroidery = excluded.supports_embroidery,
  supports_screen_setup = excluded.supports_screen_setup,
  is_deferred = excluded.is_deferred,
  is_active = excluded.is_active;

insert into public.calculator_pricing_sets (
  code,
  price_kind,
  region,
  currency_code,
  is_active
)
values
  ('EU_SCREEN_PRINT_V1', 'print', 'EU', 'EUR', true),
  ('EU_EMBROIDERY_V1', 'embroidery', 'EU', 'EUR', true),
  ('EU_DELIVERY_V1', 'delivery', 'EU', 'EUR', true),
  ('UK_TRADE_PRINT_V1', 'print', 'UK', 'GBP', true),
  ('UK_TRADE_EMBROIDERY_V1', 'embroidery', 'UK', 'GBP', true)
on conflict (code) do update set
  price_kind = excluded.price_kind,
  region = excluded.region,
  currency_code = excluded.currency_code,
  is_active = excluded.is_active;

insert into public.calculator_profile_price_sets (
  calculator_profile_id,
  price_kind,
  pricing_set_code,
  region,
  currency_code
)
values
  ('00000000-0000-0000-0000-000000000101', 'print', 'EU_SCREEN_PRINT_V1', 'EU', 'EUR'),
  ('00000000-0000-0000-0000-000000000101', 'embroidery', 'EU_EMBROIDERY_V1', 'EU', 'EUR'),
  ('00000000-0000-0000-0000-000000000101', 'delivery', 'EU_DELIVERY_V1', 'EU', 'EUR'),
  ('00000000-0000-0000-0000-000000000102', 'print', 'EU_SCREEN_PRINT_V1', 'EU', 'EUR'),
  ('00000000-0000-0000-0000-000000000102', 'embroidery', 'EU_EMBROIDERY_V1', 'EU', 'EUR'),
  ('00000000-0000-0000-0000-000000000102', 'delivery', 'EU_DELIVERY_V1', 'EU', 'EUR'),
  ('00000000-0000-0000-0000-000000000103', 'print', 'UK_TRADE_PRINT_V1', 'UK', 'GBP'),
  ('00000000-0000-0000-0000-000000000103', 'embroidery', 'UK_TRADE_EMBROIDERY_V1', 'UK', 'GBP')
on conflict (calculator_profile_id, price_kind) do update set
  pricing_set_code = excluded.pricing_set_code,
  region = excluded.region,
  currency_code = excluded.currency_code;

insert into public.calculator_garment_markups (
  organisation_id,
  calculator_profile_id,
  garment_type,
  markup_value
)
select null, v.calculator_profile_id::uuid, v.garment_type, v.markup_value::numeric(12,4)
from (
  values
    ('00000000-0000-0000-0000-000000000101', 'HOODIE', 5.0000),
    ('00000000-0000-0000-0000-000000000101', 'LONGSLEEVE', 3.5000),
    ('00000000-0000-0000-0000-000000000101', 'TSHIRT', 3.0000),
    ('00000000-0000-0000-0000-000000000102', 'HOODIE', 4.0000),
    ('00000000-0000-0000-0000-000000000102', 'LONGSLEEVE', 3.0000),
    ('00000000-0000-0000-0000-000000000102', 'TSHIRT', 2.0000)
) as v(calculator_profile_id, garment_type, markup_value)
where not exists (
  select 1
  from public.calculator_garment_markups existing
  where existing.calculator_profile_id = v.calculator_profile_id::uuid
    and existing.garment_type = v.garment_type
    and existing.is_active
);

insert into public.eu_print_price_tiers (
  organisation_id,
  pricing_set_code,
  price_kind,
  region,
  colour_count,
  quantity_min,
  quantity_max,
  production_unit_price,
  customer_unit_price,
  currency_code
)
select null, 'EU_SCREEN_PRINT_V1', 'print', 'EU', v.colour_count, v.quantity_min, v.quantity_max, v.production_unit_price::numeric(12,4), v.customer_unit_price::numeric(12,4), 'EUR'
from (
  values
    (1, 50, 99, 1.4000, 1.5400), (1, 100, 249, 1.1500, 1.2600), (1, 250, 499, 1.0000, 1.1000), (1, 500, 999, 0.9000, 0.9900), (1, 1000, 2000, 0.7500, 0.8200),
    (2, 50, 99, 1.6000, 1.7600), (2, 100, 249, 1.4000, 1.5400), (2, 250, 499, 1.2500, 1.3800), (2, 500, 999, 1.2000, 1.3200), (2, 1000, 2000, 1.0500, 1.1600),
    (3, 50, 99, 2.1500, 2.3700), (3, 100, 249, 1.7000, 1.8700), (3, 250, 499, 1.4500, 1.6000), (3, 500, 999, 1.4000, 1.5400), (3, 1000, 2000, 1.2500, 1.3800),
    (4, 50, 99, 2.6000, 2.8600), (4, 100, 249, 2.3500, 2.5900), (4, 250, 499, 1.7000, 1.8700), (4, 500, 999, 1.6000, 1.7600), (4, 1000, 2000, 1.4000, 1.5400),
    (5, 50, 99, 3.2500, 3.5800), (5, 100, 249, 2.5000, 2.9200), (5, 250, 499, 1.9500, 2.1400), (5, 500, 999, 1.9000, 2.0900), (5, 1000, 2000, 1.7000, 1.8700),
    (6, 50, 99, 4.0500, 4.4600), (6, 100, 249, 2.6500, 2.7500), (6, 250, 499, 2.2000, 2.4200), (6, 500, 999, 2.1500, 3.2700), (6, 1000, 2000, 2.0000, 2.2000),
    (7, 50, 99, 4.8000, 5.2800), (7, 100, 249, 2.8000, 3.0800), (7, 250, 499, 2.5000, 2.7500), (7, 500, 999, 2.4500, 2.7000), (7, 1000, 2000, 2.3000, 2.5300),
    (8, 50, 99, 5.4500, 6.0000), (8, 100, 249, 3.1000, 3.4100), (8, 250, 499, 2.8000, 3.0800), (8, 500, 999, 2.7500, 3.0300), (8, 1000, 2000, 2.6000, 2.8600),
    (9, 50, 99, 6.1000, 6.7100), (9, 100, 249, 3.4000, 3.7400), (9, 250, 499, 3.1000, 3.4100), (9, 500, 999, 3.0500, 3.3600), (9, 1000, 2000, 2.9000, 3.1900)
) as v(colour_count, quantity_min, quantity_max, production_unit_price, customer_unit_price)
where not exists (
  select 1
  from public.eu_print_price_tiers existing
  where existing.pricing_set_code = 'EU_SCREEN_PRINT_V1'
    and existing.colour_count = v.colour_count
    and existing.quantity_min = v.quantity_min
    and existing.quantity_max = v.quantity_max
    and existing.is_active
);

insert into public.eu_embroidery_pricing (
  organisation_id,
  pricing_set_code,
  price_kind,
  region,
  size_code,
  label,
  production_unit_price,
  customer_unit_price,
  currency_code
)
select null, 'EU_EMBROIDERY_V1', 'embroidery', 'EU', v.size_code, v.label, v.production_unit_price::numeric(12,4), v.customer_unit_price::numeric(12,4), 'EUR'
from (
  values
    ('small', 'Small', 1.2500, 1.5000),
    ('medium', 'Medium', 1.8500, 2.0000),
    ('large', 'Large', 2.5000, 2.7500)
) as v(size_code, label, production_unit_price, customer_unit_price)
where not exists (
  select 1
  from public.eu_embroidery_pricing existing
  where existing.pricing_set_code = 'EU_EMBROIDERY_V1'
    and existing.size_code = v.size_code
    and existing.is_active
);

insert into public.uk_trade_print_price_tiers (
  organisation_id,
  pricing_set_code,
  price_kind,
  region,
  position_code,
  colour_count,
  quantity_tier,
  unit_price,
  currency_code,
  setup_screen_count_strategy
)
select null, 'UK_TRADE_PRINT_V1', 'print', 'UK', 'STANDARD', v.colour_count, v.quantity_tier, v.unit_price::numeric(12,4), 'GBP', 'colour_count'
from (
  values
    (1, 50, 1.4700), (1, 100, 0.9300), (1, 200, 0.7500), (1, 500, 0.6800), (1, 1000, 0.6000), (1, 2500, 0.5900), (1, 5000, 0.5800), (1, 10000, 0.5600),
    (2, 50, 1.6300), (2, 100, 1.0800), (2, 200, 0.8800), (2, 500, 0.7900), (2, 1000, 0.7000), (2, 2500, 0.6800), (2, 5000, 0.6600), (2, 10000, 0.6300),
    (3, 50, 1.7900), (3, 100, 1.2300), (3, 200, 1.0100), (3, 500, 0.9000), (3, 1000, 0.8000), (3, 2500, 0.7700), (3, 5000, 0.7400), (3, 10000, 0.7000),
    (4, 50, 1.9500), (4, 100, 1.3800), (4, 200, 1.1400), (4, 500, 1.0100), (4, 1000, 0.9000), (4, 2500, 0.8600), (4, 5000, 0.8200), (4, 10000, 0.7700),
    (5, 50, 2.1100), (5, 100, 1.5300), (5, 200, 1.2700), (5, 500, 1.1200), (5, 1000, 1.0000), (5, 2500, 0.9500), (5, 5000, 0.9000), (5, 10000, 0.8400),
    (6, 50, 2.2700), (6, 100, 1.6800), (6, 200, 1.4000), (6, 500, 1.2300), (6, 1000, 1.1000), (6, 2500, 1.0400), (6, 5000, 0.9800), (6, 10000, 0.9100),
    (7, 50, 2.4300), (7, 100, 1.8300), (7, 200, 1.5300), (7, 500, 1.3400), (7, 1000, 1.2000), (7, 2500, 1.1300), (7, 5000, 1.0600), (7, 10000, 0.9800),
    (8, 50, 2.5900), (8, 100, 1.9800), (8, 200, 1.6600), (8, 500, 1.4500), (8, 1000, 1.3000), (8, 2500, 1.2200), (8, 5000, 1.1400), (8, 10000, 1.0500),
    (9, 50, 2.7500), (9, 100, 2.1300), (9, 200, 1.7900), (9, 500, 1.5600), (9, 1000, 1.4000), (9, 2500, 1.3100), (9, 5000, 1.2200), (9, 10000, 1.1200),
    (10, 50, 2.9100), (10, 100, 2.2800), (10, 200, 1.9200), (10, 500, 1.6700), (10, 1000, 1.5000), (10, 2500, 1.4000), (10, 5000, 1.3000), (10, 10000, 1.1900)
) as v(colour_count, quantity_tier, unit_price)
where not exists (
  select 1
  from public.uk_trade_print_price_tiers existing
  where existing.pricing_set_code = 'UK_TRADE_PRINT_V1'
    and existing.position_code = 'STANDARD'
    and existing.colour_count = v.colour_count
    and existing.quantity_tier = v.quantity_tier
    and existing.is_active
);

insert into public.uk_trade_print_price_tiers (
  organisation_id,
  pricing_set_code,
  price_kind,
  region,
  position_code,
  colour_count,
  quantity_tier,
  unit_price,
  currency_code,
  setup_screen_count_strategy
)
select null, 'UK_TRADE_PRINT_V1', 'print', 'UK', v.position_code, v.colour_count, v.quantity_tier, v.unit_price::numeric(12,4), 'GBP', v.setup_screen_count_strategy
from (
  values
    ('NECK_PRINT_STANDARD', 1, 50, 0.8900, 'one'), ('NECK_PRINT_STANDARD', 1, 100, 0.6000, 'one'), ('NECK_PRINT_STANDARD', 1, 200, 0.6000, 'one'), ('NECK_PRINT_STANDARD', 1, 500, 0.6000, 'one'), ('NECK_PRINT_STANDARD', 1, 1000, 0.6000, 'one'), ('NECK_PRINT_STANDARD', 1, 2500, 0.6000, 'one'), ('NECK_PRINT_STANDARD', 1, 5000, 0.6000, 'one'), ('NECK_PRINT_STANDARD', 1, 10000, 0.6000, 'one'),
    ('NECK_PRINT_TRANSFER', null, 50, 1.3400, 'none'), ('NECK_PRINT_TRANSFER', null, 100, 0.9000, 'none'), ('NECK_PRINT_TRANSFER', null, 200, 0.9000, 'none'), ('NECK_PRINT_TRANSFER', null, 500, 0.9000, 'none'), ('NECK_PRINT_TRANSFER', null, 1000, 0.9000, 'none'), ('NECK_PRINT_TRANSFER', null, 2500, 0.9000, 'none'), ('NECK_PRINT_TRANSFER', null, 5000, 0.9000, 'none'), ('NECK_PRINT_TRANSFER', null, 10000, 0.9000, 'none')
) as v(position_code, colour_count, quantity_tier, unit_price, setup_screen_count_strategy)
where not exists (
  select 1
  from public.uk_trade_print_price_tiers existing
  where existing.pricing_set_code = 'UK_TRADE_PRINT_V1'
    and existing.position_code = v.position_code
    and existing.colour_count is not distinct from v.colour_count
    and existing.quantity_tier = v.quantity_tier
    and existing.is_active
);

insert into public.uk_trade_embroidery_pricing (
  organisation_id,
  pricing_set_code,
  price_kind,
  region,
  stitch_count,
  is_extra_1000_stitches,
  quantity_tier,
  unit_price,
  currency_code
)
select null, 'UK_TRADE_EMBROIDERY_V1', 'embroidery', 'UK', v.stitch_count, v.is_extra_1000_stitches, v.quantity_tier, v.unit_price::numeric(12,4), 'GBP'
from (
  values
    (7000, false, 50, 2.1500), (7000, false, 100, 2.0400), (7000, false, 200, 1.8700), (7000, false, 500, 1.8200), (7000, false, 1000, 1.8200), (7000, false, 2500, 1.8200),
    (8000, false, 50, 2.3700), (8000, false, 100, 2.2700), (8000, false, 200, 2.1000), (8000, false, 500, 2.0400), (8000, false, 1000, 2.0300), (8000, false, 2500, 2.0300),
    (9000, false, 50, 2.5900), (9000, false, 100, 2.4900), (9000, false, 200, 2.3200), (9000, false, 500, 2.2700), (9000, false, 1000, 2.2400), (9000, false, 2500, 2.2400),
    (10000, false, 50, 2.8200), (10000, false, 100, 2.7100), (10000, false, 200, 2.5400), (10000, false, 500, 2.4900), (10000, false, 1000, 2.4600), (10000, false, 2500, 2.4600),
    (11000, false, 50, 3.0400), (11000, false, 100, 2.9300), (11000, false, 200, 2.7600), (11000, false, 500, 2.7100), (11000, false, 1000, 2.6700), (11000, false, 2500, 2.6700),
    (12000, false, 50, 3.2600), (12000, false, 100, 3.1600), (12000, false, 200, 2.9900), (12000, false, 500, 2.9300), (12000, false, 1000, 2.8800), (12000, false, 2500, 2.8800),
    (13000, false, 50, 3.4800), (13000, false, 100, 3.3800), (13000, false, 200, 3.2100), (13000, false, 500, 3.1600), (13000, false, 1000, 3.0900), (13000, false, 2500, 3.0900),
    (14000, false, 50, 3.7100), (14000, false, 100, 3.6000), (14000, false, 200, 3.4300), (14000, false, 500, 3.3800), (14000, false, 1000, 3.3000), (14000, false, 2500, 3.3000),
    (15000, false, 50, 3.9300), (15000, false, 100, 3.8200), (15000, false, 200, 3.6500), (15000, false, 500, 3.6000), (15000, false, 1000, 3.5200), (15000, false, 2500, 3.5200),
    (1000, true, 50, 0.2100), (1000, true, 100, 0.2000), (1000, true, 200, 0.1900), (1000, true, 500, 0.1800), (1000, true, 1000, 0.1700), (1000, true, 2500, 0.1600)
) as v(stitch_count, is_extra_1000_stitches, quantity_tier, unit_price)
where not exists (
  select 1
  from public.uk_trade_embroidery_pricing existing
  where existing.pricing_set_code = 'UK_TRADE_EMBROIDERY_V1'
    and existing.stitch_count = v.stitch_count
    and existing.is_extra_1000_stitches = v.is_extra_1000_stitches
    and existing.quantity_tier = v.quantity_tier
    and existing.is_active
);

insert into public.calculator_fees (
  organisation_id,
  calculator_profile_id,
  fee_code,
  fee_label,
  amount,
  currency_code,
  applies_per,
  cost_side
)
select null, v.calculator_profile_id::uuid, v.fee_code, v.fee_label, v.amount::numeric(12,4), v.currency_code, v.applies_per, v.cost_side
from (
  values
    ('00000000-0000-0000-0000-000000000101', 'EU_DIGITISING', 'Digitising', 25.0000, 'EUR', 'embroidery_item', 'customer'),
    ('00000000-0000-0000-0000-000000000101', 'EU_DIGITISING', 'Digitising', 23.0000, 'EUR', 'embroidery_item', 'production'),
    ('00000000-0000-0000-0000-000000000101', 'EU_NECK_PRINT', 'Neck print', 0.7000, 'EUR', 'unit', 'customer'),
    ('00000000-0000-0000-0000-000000000101', 'EU_NECK_PRINT', 'Neck print', 0.7000, 'EUR', 'unit', 'production'),
    ('00000000-0000-0000-0000-000000000102', 'EU_DIGITISING', 'Digitising', 25.0000, 'EUR', 'embroidery_item', 'customer'),
    ('00000000-0000-0000-0000-000000000102', 'EU_DIGITISING', 'Digitising', 23.0000, 'EUR', 'embroidery_item', 'production'),
    ('00000000-0000-0000-0000-000000000102', 'EU_NECK_PRINT', 'Neck print', 0.7000, 'EUR', 'unit', 'customer'),
    ('00000000-0000-0000-0000-000000000102', 'EU_NECK_PRINT', 'Neck print', 0.7000, 'EUR', 'unit', 'production'),
    ('00000000-0000-0000-0000-000000000103', 'UK_SCREEN_SETUP', 'Screen setup', 20.0000, 'GBP', 'screen', 'trade'),
    ('00000000-0000-0000-0000-000000000103', 'UK_EMBROIDERY_SETUP', 'Embroidery setup', 30.0000, 'GBP', 'embroidery_item', 'trade')
) as v(calculator_profile_id, fee_code, fee_label, amount, currency_code, applies_per, cost_side)
where not exists (
  select 1
  from public.calculator_fees existing
  where existing.calculator_profile_id = v.calculator_profile_id::uuid
    and existing.fee_code = v.fee_code
    and existing.cost_side = v.cost_side
    and existing.is_active
);

insert into public.delivery_rates (
  organisation_id,
  pricing_set_code,
  price_kind,
  region,
  country,
  currency_code,
  cost_per_box,
  delivery_time,
  vat_rate
)
select null, 'EU_DELIVERY_V1', 'delivery', 'EU', v.country, 'EUR', v.cost_per_box::numeric(12,4), v.delivery_time, 27.00
from (
  values
    ('Austria', 25.0000, '1 day'),
    ('Czechia', 25.0000, '2 days'),
    ('Germany', 25.0000, '2 days'),
    ('Romania', 25.0000, '2 days'),
    ('Slovenia', 25.0000, '1 day'),
    ('Croatia', 30.0000, '3 days'),
    ('Slovakia', 30.0000, '2 days'),
    ('Italy', 40.0000, '3-4 days'),
    ('France', 45.0000, '3 days'),
    ('Poland', 45.0000, '2 days'),
    ('Netherlands', 45.0000, '2 days'),
    ('Greece', 50.0000, '6 days'),
    ('Portugal', 50.0000, '4 days'),
    ('Spain', 50.0000, '3 days'),
    ('Belgium', 55.0000, '2 days'),
    ('Bulgaria', 55.0000, '3 days'),
    ('Denmark', 55.0000, '3 days'),
    ('Estonia', 55.0000, '4 days'),
    ('Latvia', 55.0000, '3 days'),
    ('Lithuania', 55.0000, '3 days'),
    ('Luxembourg', 55.0000, '2 days'),
    ('Monaco', 55.0000, '3 days'),
    ('Sweden', 55.0000, '3 days'),
    ('England', 65.0000, '4 days'),
    ('Ireland', 65.0000, '5 days')
) as v(country, cost_per_box, delivery_time)
where not exists (
  select 1
  from public.delivery_rates existing
  where existing.pricing_set_code = 'EU_DELIVERY_V1'
    and existing.country = v.country
    and existing.is_active
);

insert into public.garments (
  organisation_id,
  code,
  alt_code,
  brand_name,
  name,
  colour,
  garment_type,
  eur_base_price,
  gbp_price,
  extra_size_cost,
  tags
)
select null, v.code, v.alt_code, v.brand_name, v.name, v.colour, v.garment_type, v.eur_base_price::numeric(12,4), v.gbp_price::numeric(12,4), v.extra_size_cost::numeric(12,4), v.tags
from (
  values
    ('5001', '', 'AS Colour', 'Staple Tee', '', 'TSHIRT', 4.6500, null, null, 'AS Colour, 5001, Staple'),
    ('5001C', '', 'AS Colour', 'Staple Camo Tee', '', 'TSHIRT', 6.6500, null, null, '5001c, camo, staple'),
    ('5020', '', 'AS Colour', 'Staple L/S Tee', '', 'TSHIRT', 6.6500, null, null, '5020, staple, long sleeve'),
    ('5020G', '', 'AS Colour', 'Staple Organic L/S Tee', '', 'TSHIRT', 6.9000, null, null, '5020G, Staple, organic, organic long sleeve, long sleeve'),
    ('5026', '', 'AS Colour', 'Classic Tee', '', 'TSHIRT', 6.5000, null, null, '5026, AS Colour, classic tee'),
    ('5030', '', 'AS Colour', 'Box Tee', '', 'TSHIRT', 7.1500, null, null, 'Box Tee, AS Colour, 5030'),
    ('5031', '', 'AS Colour', 'Box L/S Tee', '', 'TSHIRT', 8.9500, null, null, '5031. box, long sleeve'),
    ('5040', '', 'AS Colour', 'Staple Stone Wash Tee', '', 'TSHIRT', 7.8000, null, null, '5040, Staple Stone Wash Tee, washed, stone washed'),
    ('5050', '', 'AS Colour', 'Block Tubular Tee', '', 'TSHIRT', 3.2500, null, null, '5026, Block Tubular Tee'),
    ('5054', '', 'AS Colour', 'Block L/S Tee', '', 'TSHIRT', 4.8000, null, null, '5054. block, long sleeve'),
    ('5071', '', 'AS Colour', 'Classic L/S Tee', '', 'TSHIRT', 8.4000, null, null, '5071, Classic, long sleeve'),
    ('5080', '', 'AS Colour', 'Heavy Tee', '', 'TSHIRT', 7.7000, null, null, '5080, Heavy Tee'),
    ('5081', '', 'AS Colour', 'Heavy L/S Tee', '', 'TSHIRT', 10.2000, null, null, '5081, long sleeve'),
    ('5082', '', 'AS Colour', 'Heavy Faded Tee', '', 'TSHIRT', 7.7000, null, null, '5082, Heavy Faded Tee, faded'),
    ('5083', '', 'AS Colour', 'Heavy Faded L/S Tee', '', 'TSHIRT', 10.2000, null, null, '5083, Faded, faded long sleeve'),
    ('5085', '', 'AS Colour', 'Stone Wash Heavy Tee', '', 'TSHIRT', 8.2500, null, null, '5085, Stone Wash Heavy Tee, stone wash'),
    ('5086', '', 'AS Colour', 'Heavy Faded Minus Tee [-5cm]', '', 'TSHIRT', 7.7000, null, null, '5086, Heavy Faded Minus Tee [-5cm], faded, minus'),
    ('5102', '', 'AS Colour', 'Stencil Hood', '', 'TSHIRT', 19.5500, null, null, '5102, stencil hood'),
    ('5111', '', 'AS Colour', 'Standard Hood', '', 'TSHIRT', 12.2500, null, null, '5111, Standard hoodie'),
    ('5145', '', 'AS Colour', 'Heavy Crew', '', 'TSHIRT', 19.8000, null, null, '5145, sweater, heavy crew'),
    ('5146', '', 'AS Colour', 'Heavy Hood', '', 'TSHIRT', 22.2500, null, null, '5146, heavy hood'),
    ('5161', '', 'AS Colour', 'Relax Hood', '', 'TSHIRT', 16.9500, null, null, '5161, relax hood, hoodie'),
    ('5165', '', 'AS Colour', 'Relax Faded Crew', '', 'TSHIRT', 16.0500, null, null, '5165, relax faded crew, faded, faded sweater'),
    ('5166', '', 'AS Colour', 'Relax Faded Hood', '', 'TSHIRT', 18.0500, null, null, '5166, relax faded hood'),
    ('5171', '', 'AS Colour', 'Box Hood', '', 'TSHIRT', 19.5500, null, null, '5171, box hood'),
    ('B653', 'BC653', 'Beechfield', 'Beechfield Low Profile 6 Panel Dad Cap', '', 'TSHIRT', 3.2000, null, null, 'bb653, beechfield, cap, dad cap, BC653'),
    ('BB45', 'BC45', 'Beechfield', 'Original cuffed beanie', '', 'TSHIRT', 2.0000, null, null, 'Beanie, beechfield, BB45, BC45'),
    ('CV3001', '3001', 'Bella Canvas', 'Unisex Crew Neck T-Shirt', 'Colours', 'TSHIRT', 4.8000, null, null, 'Bella Canvas, tee, CV3001, 3001'),
    ('CV3001', '', 'Bella Canvas', 'Canvas Unisex Crew Neck T-Shirt', 'Whites', 'TSHIRT', 4.8000, null, null, 'Bella Canvas, tee, white, size note: 2XL: 5, 4 / 3XL: 7'),
    ('GD01', '64000', 'Gildan', 'Gildan SoftStyle Adult T-Shirt', 'Colours', 'TSHIRT', 2.2500, null, 0.7000, 'GD01, 64000, SOFT, SOFTSTYLE, GILDAN'),
    ('GD01', '64000', 'Gildan', 'Gildan SoftStyle Adult T-Shirt', 'Whites', 'TSHIRT', 1.8500, null, 0.6000, 'GD01, 64000, GILDAN SOFT, SOFTSTYLE'),
    ('GD02', '2000', 'Gildan', 'Gildan Ultra Cotton T-Shirt', 'Colours', 'TSHIRT', 2.8000, null, 1.1000, 'Gildan Ultra, Ultra, GD02, 2000'),
    ('GD02', '2000', 'Gildan', 'Gildan Ultra Cotton T-Shirt', 'Whites', 'TSHIRT', 2.3500, null, 1.1000, 'gildan ultra, GD02, 2000, ultra'),
    ('GD05', '5000', 'Gildan', 'Gildan Heavy Cotton T-Shirt', 'Colours', 'TSHIRT', 2.4000, null, 0.9000, 'Gildan, tee, black, HEAVY, GD05, 5000'),
    ('GD05', '5000', 'Gildan', 'Gildan Heavy Cotton T-Shirt', 'Whites', 'TSHIRT', 1.9500, null, 0.9000, 'Gildan, tee, white, GD05, 5000, HEAVY'),
    ('GD14', '2400', 'Gildan', 'Gildan Ultra Cotton Long Sleeve T-Shirt', 'Colours', 'LONGSLEEVE', 5.7000, null, 2.0000, 'Gildan, long sleeve, black, GD14, 2400, ULTRA, GILDAN ULTRA'),
    ('GD14', '2400', 'Gildan', 'Gildan Ultra Cotton Long Sleeve T-Shirt', 'Whites', 'LONGSLEEVE', 4.7000, null, 2.0000, 'GILDAN ULTRA LONG SLEEVE, LONG SLEEVE, GD14, ULTRA, 2400'),
    ('GD21', 'H000', 'Gildan', 'Gildan Hammer Heavyweight T-Shirt', 'Colours', 'TSHIRT', 3.1500, null, 1.2000, 'Gildan, tee, black, HAMMER, H000, GD21'),
    ('GD21', 'H000', 'Gildan', 'Gildan Hammer Heavyweight T-Shirt', 'Whites', 'TSHIRT', 2.6500, null, 1.0000, 'Gildan, tee, white, GD21, H000'),
    ('GD56', '18000', 'Gildan', 'GI18000 HEAVY SWEATSHIRT', 'Colours', 'HOODIE', 5.9000, null, 0.5000, 'Gildan, sweatshirt, black, GD56, 18000'),
    ('GD56', '18000', 'Gildan', 'GI18000 HEAVY SWEATSHIRT', 'Whites', 'HOODIE', 5.4000, null, 1.6500, 'Gildan, sweatshirt, white, GD56, 18000'),
    ('GD57', '18500', 'Gildan', 'Gildan Heavy Blend Hooded Sweatshirt', 'Colours', 'HOODIE', 8.2500, null, 2.0000, 'GD57, 18500, GILDAN HEAVY HOODIE, HOODIE, HEAVY'),
    ('GD57', '18500', 'Gildan', 'Gildan Heavy Blend Hooded Sweatshirt', 'Whites', 'HOODIE', 8.2500, null, 2.0000, 'Gildan, hoodie, white, GD57, 18500'),
    ('JH001', '', 'AWDis', 'AWDis College hoodie', 'Whites', 'HOODIE', 9.5000, null, 1.5000, 'AWDis, hoodie, white, college, JH001'),
    ('JH001', '', 'AWDis', 'AWDis College hoodie', 'colours', 'HOODIE', 9.5000, null, 1.5000, 'AWDis, JH001, College'),
    ('W101', 'WM101', 'Westford Mill', 'Westford Mill Bag For Life - Long Handles', '', 'TSHIRT', 1.5000, null, null, 'Westford Mill, tote, W101'),
    ('W265', 'WM265', 'Westford Mill', 'Westford Mill Organic Premium Cotton Maxi Tote Bag', '', 'TSHIRT', 3.6000, null, null, 'Westford Mill, tote, W265, WM265')
) as v(code, alt_code, brand_name, name, colour, garment_type, eur_base_price, gbp_price, extra_size_cost, tags)
where not exists (
  select 1
  from public.garments existing
  where existing.organisation_id is null
    and existing.code = v.code
    and existing.brand_name = v.brand_name
    and existing.name = v.name
    and existing.colour = v.colour
    and existing.is_active
);
