create or replace function public.has_pins_hub_access(required_access_level text default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organisation_members om
    join public.app_access aa
      on aa.organisation_member_id = om.id
    where om.user_id = auth.uid()
      and aa.app_key = 'pins_hub'
      and (
        (
          required_access_level is null
          and aa.access_level in ('admin', 'write', 'read')
        )
        or (
          required_access_level = 'admin'
          and aa.access_level = 'admin'
        )
      )
  );
$$;

revoke all on function public.has_pins_hub_access(text) from public;
revoke all on function public.has_pins_hub_access(text) from anon;
grant execute on function public.has_pins_hub_access(text) to authenticated;

create extension if not exists btree_gist;

create table public.garments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  code text not null,
  alt_code text not null default '',
  brand_name text not null default '',
  name text not null,
  colour text not null default '',
  garment_type text not null,
  eur_base_price numeric(12,4),
  gbp_price numeric(12,4),
  extra_size_cost numeric(12,4),
  tags text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint garments_global_only_chk check (organisation_id is null),
  constraint garments_type_chk check (garment_type in ('TSHIRT', 'LONGSLEEVE', 'HOODIE')),
  constraint garments_eur_base_price_chk check (eur_base_price is null or eur_base_price >= 0),
  constraint garments_gbp_price_chk check (gbp_price is null or gbp_price >= 0),
  constraint garments_extra_size_cost_chk check (extra_size_cost is null or extra_size_cost >= 0),
  constraint garments_code_not_blank_chk check (length(trim(code)) > 0),
  constraint garments_name_not_blank_chk check (length(trim(name)) > 0)
);

create table public.calculator_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  code text not null,
  name text not null,
  region text not null,
  currency_code char(3) not null,
  vat_rate numeric(5,2),
  min_quantity integer not null,
  max_quantity integer,
  max_colours integer,
  tier_strategy text not null,
  copy_formatter_code text not null,
  supports_delivery boolean not null default false,
  supports_pk_markup boolean not null default false,
  supports_embroidery boolean not null default false,
  supports_screen_setup boolean not null default false,
  is_deferred boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calculator_profiles_global_only_chk check (organisation_id is null),
  constraint calculator_profiles_code_chk check (code in ('EU_STANDARD', 'EU_US_CLIENTS', 'UK_TRADE')),
  constraint calculator_profiles_region_chk check (region in ('EU', 'UK')),
  constraint calculator_profiles_currency_chk check (currency_code in ('EUR', 'GBP')),
  constraint calculator_profiles_tier_strategy_chk check (tier_strategy in ('range', 'floor')),
  constraint calculator_profiles_min_quantity_chk check (min_quantity >= 1),
  constraint calculator_profiles_max_quantity_chk check (max_quantity is null or max_quantity >= min_quantity),
  constraint calculator_profiles_max_colours_chk check (max_colours is null or max_colours >= 1),
  constraint calculator_profiles_vat_rate_chk check (vat_rate is null or vat_rate >= 0),
  constraint calculator_profiles_no_active_eu_trade_chk check (code <> 'EU_TRADE'),
  constraint calculator_profiles_id_region_currency_key unique (id, region, currency_code)
);

create table public.calculator_pricing_sets (
  code text primary key,
  price_kind text not null,
  region text not null,
  currency_code char(3) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calculator_pricing_sets_kind_chk check (price_kind in ('print', 'embroidery', 'delivery')),
  constraint calculator_pricing_sets_region_chk check (region in ('EU', 'UK')),
  constraint calculator_pricing_sets_currency_chk check (currency_code in ('EUR', 'GBP')),
  constraint calculator_pricing_sets_region_currency_chk check (
    (region = 'EU' and currency_code = 'EUR')
    or (region = 'UK' and currency_code = 'GBP')
  ),
  constraint calculator_pricing_sets_code_kind_key unique (code, price_kind),
  constraint calculator_pricing_sets_code_kind_region_currency_key unique (code, price_kind, region, currency_code)
);

create table public.calculator_profile_price_sets (
  id uuid primary key default gen_random_uuid(),
  calculator_profile_id uuid not null references public.calculator_profiles(id) on delete cascade,
  price_kind text not null,
  pricing_set_code text not null,
  region text not null,
  currency_code char(3) not null,
  created_at timestamptz not null default now(),
  constraint calculator_profile_price_sets_kind_chk check (price_kind in ('print', 'embroidery', 'delivery')),
  constraint calculator_profile_price_sets_region_chk check (region in ('EU', 'UK')),
  constraint calculator_profile_price_sets_currency_chk check (currency_code in ('EUR', 'GBP')),
  constraint calculator_profile_price_sets_region_currency_chk check (
    (region = 'EU' and currency_code = 'EUR')
    or (region = 'UK' and currency_code = 'GBP')
  ),
  constraint calculator_profile_price_sets_code_not_blank_chk check (length(trim(pricing_set_code)) > 0),
  constraint calculator_profile_price_sets_pricing_set_fk foreign key (pricing_set_code, price_kind, region, currency_code)
    references public.calculator_pricing_sets(code, price_kind, region, currency_code),
  constraint calculator_profile_price_sets_profile_region_currency_fk foreign key (calculator_profile_id, region, currency_code)
    references public.calculator_profiles(id, region, currency_code),
  constraint calculator_profile_price_sets_profile_kind_key unique (calculator_profile_id, price_kind)
);

create table public.calculator_garment_markups (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  calculator_profile_id uuid not null references public.calculator_profiles(id) on delete cascade,
  garment_type text not null,
  markup_value numeric(12,4) not null,
  valid_from date not null default current_date,
  valid_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calculator_garment_markups_global_only_chk check (organisation_id is null),
  constraint calculator_garment_markups_type_chk check (garment_type in ('TSHIRT', 'LONGSLEEVE', 'HOODIE')),
  constraint calculator_garment_markups_value_chk check (markup_value >= 0),
  constraint calculator_garment_markups_valid_window_chk check (valid_to is null or valid_to >= valid_from)
);

create table public.eu_print_price_tiers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  pricing_set_code text not null,
  price_kind text not null default 'print',
  region text not null default 'EU',
  colour_count integer not null,
  quantity_min integer not null,
  quantity_max integer not null,
  production_unit_price numeric(12,4) not null,
  customer_unit_price numeric(12,4) not null,
  currency_code char(3) not null default 'EUR',
  valid_from date not null default current_date,
  valid_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eu_print_price_tiers_global_only_chk check (organisation_id is null),
  constraint eu_print_price_tiers_kind_chk check (price_kind = 'print'),
  constraint eu_print_price_tiers_region_chk check (region = 'EU'),
  constraint eu_print_price_tiers_currency_chk check (currency_code = 'EUR'),
  constraint eu_print_price_tiers_colour_chk check (colour_count between 1 and 9),
  constraint eu_print_price_tiers_quantity_min_chk check (quantity_min >= 50),
  constraint eu_print_price_tiers_quantity_max_chk check (quantity_max <= 2000),
  constraint eu_print_price_tiers_quantity_window_chk check (quantity_max >= quantity_min),
  constraint eu_print_price_tiers_production_price_chk check (production_unit_price >= 0),
  constraint eu_print_price_tiers_customer_price_chk check (customer_unit_price >= 0),
  constraint eu_print_price_tiers_valid_window_chk check (valid_to is null or valid_to >= valid_from),
  constraint eu_print_price_tiers_set_not_blank_chk check (length(trim(pricing_set_code)) > 0),
  constraint eu_print_price_tiers_pricing_set_fk foreign key (pricing_set_code, price_kind, region, currency_code)
    references public.calculator_pricing_sets(code, price_kind, region, currency_code)
);

create table public.uk_trade_print_price_tiers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  pricing_set_code text not null,
  price_kind text not null default 'print',
  region text not null default 'UK',
  position_code text not null,
  colour_count integer,
  quantity_tier integer not null,
  unit_price numeric(12,4) not null,
  currency_code char(3) not null default 'GBP',
  setup_screen_count_strategy text not null default 'colour_count',
  valid_from date not null default current_date,
  valid_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uk_trade_print_price_tiers_global_only_chk check (organisation_id is null),
  constraint uk_trade_print_price_tiers_kind_chk check (price_kind = 'print'),
  constraint uk_trade_print_price_tiers_region_chk check (region = 'UK'),
  constraint uk_trade_print_price_tiers_currency_chk check (currency_code = 'GBP'),
  constraint uk_trade_print_price_tiers_position_chk check (position_code in ('STANDARD', 'NECK_PRINT_STANDARD', 'NECK_PRINT_TRANSFER')),
  constraint uk_trade_print_price_tiers_quantity_chk check (quantity_tier in (50, 100, 200, 500, 1000, 2500, 5000, 10000)),
  constraint uk_trade_print_price_tiers_position_setup_chk check (
    (
      position_code = 'STANDARD'
      and colour_count between 1 and 10
      and setup_screen_count_strategy = 'colour_count'
    )
    or (
      position_code = 'NECK_PRINT_STANDARD'
      and colour_count = 1
      and setup_screen_count_strategy = 'one'
    )
    or (
      position_code = 'NECK_PRINT_TRANSFER'
      and colour_count is null
      and setup_screen_count_strategy = 'none'
    )
  ),
  constraint uk_trade_print_price_tiers_unit_price_chk check (unit_price >= 0),
  constraint uk_trade_print_price_tiers_valid_window_chk check (valid_to is null or valid_to >= valid_from),
  constraint uk_trade_print_price_tiers_set_not_blank_chk check (length(trim(pricing_set_code)) > 0),
  constraint uk_trade_print_price_tiers_pricing_set_fk foreign key (pricing_set_code, price_kind, region, currency_code)
    references public.calculator_pricing_sets(code, price_kind, region, currency_code)
);

create table public.eu_embroidery_pricing (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  pricing_set_code text not null,
  price_kind text not null default 'embroidery',
  region text not null default 'EU',
  size_code text not null,
  label text not null,
  production_unit_price numeric(12,4) not null,
  customer_unit_price numeric(12,4) not null,
  currency_code char(3) not null default 'EUR',
  valid_from date not null default current_date,
  valid_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eu_embroidery_pricing_global_only_chk check (organisation_id is null),
  constraint eu_embroidery_pricing_kind_chk check (price_kind = 'embroidery'),
  constraint eu_embroidery_pricing_region_chk check (region = 'EU'),
  constraint eu_embroidery_pricing_currency_chk check (currency_code = 'EUR'),
  constraint eu_embroidery_pricing_size_chk check (size_code in ('small', 'medium', 'large')),
  constraint eu_embroidery_pricing_production_price_chk check (production_unit_price >= 0),
  constraint eu_embroidery_pricing_customer_price_chk check (customer_unit_price >= 0),
  constraint eu_embroidery_pricing_valid_window_chk check (valid_to is null or valid_to >= valid_from),
  constraint eu_embroidery_pricing_set_not_blank_chk check (length(trim(pricing_set_code)) > 0),
  constraint eu_embroidery_pricing_label_not_blank_chk check (length(trim(label)) > 0),
  constraint eu_embroidery_pricing_pricing_set_fk foreign key (pricing_set_code, price_kind, region, currency_code)
    references public.calculator_pricing_sets(code, price_kind, region, currency_code)
);

create table public.uk_trade_embroidery_pricing (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  pricing_set_code text not null,
  price_kind text not null default 'embroidery',
  region text not null default 'UK',
  stitch_count integer not null,
  is_extra_1000_stitches boolean not null default false,
  quantity_tier integer not null,
  unit_price numeric(12,4) not null,
  currency_code char(3) not null default 'GBP',
  valid_from date not null default current_date,
  valid_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uk_trade_embroidery_pricing_global_only_chk check (organisation_id is null),
  constraint uk_trade_embroidery_pricing_kind_chk check (price_kind = 'embroidery'),
  constraint uk_trade_embroidery_pricing_region_chk check (region = 'UK'),
  constraint uk_trade_embroidery_pricing_currency_chk check (currency_code = 'GBP'),
  constraint uk_trade_embroidery_pricing_quantity_chk check (quantity_tier in (50, 100, 200, 500, 1000, 2500)),
  constraint uk_trade_embroidery_pricing_stitch_chk check (
    (
      is_extra_1000_stitches = false
      and stitch_count in (7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000)
    )
    or (
      is_extra_1000_stitches = true
      and stitch_count = 1000
    )
  ),
  constraint uk_trade_embroidery_pricing_unit_price_chk check (unit_price >= 0),
  constraint uk_trade_embroidery_pricing_valid_window_chk check (valid_to is null or valid_to >= valid_from),
  constraint uk_trade_embroidery_pricing_set_not_blank_chk check (length(trim(pricing_set_code)) > 0),
  constraint uk_trade_embroidery_pricing_pricing_set_fk foreign key (pricing_set_code, price_kind, region, currency_code)
    references public.calculator_pricing_sets(code, price_kind, region, currency_code)
);

create table public.calculator_fees (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  calculator_profile_id uuid not null references public.calculator_profiles(id) on delete cascade,
  fee_code text not null,
  fee_label text not null,
  amount numeric(12,4) not null,
  currency_code char(3) not null,
  applies_per text not null,
  cost_side text not null,
  valid_from date not null default current_date,
  valid_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calculator_fees_global_only_chk check (organisation_id is null),
  constraint calculator_fees_code_chk check (fee_code in ('EU_DIGITISING', 'EU_NECK_PRINT', 'UK_SCREEN_SETUP', 'UK_EMBROIDERY_SETUP')),
  constraint calculator_fees_currency_chk check (currency_code in ('EUR', 'GBP')),
  constraint calculator_fees_applies_per_chk check (applies_per in ('embroidery_item', 'unit', 'screen')),
  constraint calculator_fees_cost_side_chk check (cost_side in ('production', 'customer', 'trade')),
  constraint calculator_fees_amount_chk check (amount >= 0),
  constraint calculator_fees_valid_window_chk check (valid_to is null or valid_to >= valid_from),
  constraint calculator_fees_label_not_blank_chk check (length(trim(fee_label)) > 0)
);

create table public.delivery_rates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  pricing_set_code text not null,
  price_kind text not null default 'delivery',
  region text not null default 'EU',
  country text not null,
  currency_code char(3) not null default 'EUR',
  cost_per_box numeric(12,4) not null,
  delivery_time text not null,
  vat_rate numeric(5,2) not null default 27.00,
  valid_from date not null default current_date,
  valid_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_rates_global_only_chk check (organisation_id is null),
  constraint delivery_rates_kind_chk check (price_kind = 'delivery'),
  constraint delivery_rates_region_chk check (region = 'EU'),
  constraint delivery_rates_currency_chk check (currency_code = 'EUR'),
  constraint delivery_rates_cost_per_box_chk check (cost_per_box >= 0),
  constraint delivery_rates_vat_rate_chk check (vat_rate >= 0),
  constraint delivery_rates_country_not_blank_chk check (length(trim(country)) > 0),
  constraint delivery_rates_delivery_time_not_blank_chk check (length(trim(delivery_time)) > 0),
  constraint delivery_rates_set_not_blank_chk check (length(trim(pricing_set_code)) > 0),
  constraint delivery_rates_valid_window_chk check (valid_to is null or valid_to >= valid_from),
  constraint delivery_rates_pricing_set_fk foreign key (pricing_set_code, price_kind, region, currency_code)
    references public.calculator_pricing_sets(code, price_kind, region, currency_code)
);

create unique index garments_global_active_identity_uidx
  on public.garments (code, brand_name, name, colour)
  where organisation_id is null and is_active;

create index garments_global_active_idx on public.garments (organisation_id, is_active);
create index garments_code_idx on public.garments (code);
create index garments_brand_name_idx on public.garments (brand_name);
create index garments_type_idx on public.garments (garment_type);

create unique index calculator_profiles_global_code_uidx
  on public.calculator_profiles (code)
  where organisation_id is null;

create index calculator_profiles_region_currency_active_idx
  on public.calculator_profiles (region, currency_code, is_active);

create index calculator_profile_price_sets_profile_idx
  on public.calculator_profile_price_sets (calculator_profile_id);
create index calculator_profile_price_sets_kind_code_idx
  on public.calculator_profile_price_sets (price_kind, pricing_set_code);

create unique index calculator_garment_markups_active_uidx
  on public.calculator_garment_markups (calculator_profile_id, garment_type)
  where is_active;
create index calculator_garment_markups_profile_type_active_idx
  on public.calculator_garment_markups (calculator_profile_id, garment_type, is_active);

create unique index eu_print_price_tiers_active_uidx
  on public.eu_print_price_tiers (pricing_set_code, colour_count, quantity_min, quantity_max)
  where is_active;

alter table public.eu_print_price_tiers
  add constraint eu_print_price_tiers_no_active_overlap_excl
  exclude using gist (
    pricing_set_code with =,
    colour_count with =,
    int4range(quantity_min, quantity_max, '[]') with &&
  )
  where (is_active);

create index eu_print_price_tiers_lookup_idx
  on public.eu_print_price_tiers (pricing_set_code, colour_count, quantity_min, quantity_max, is_active);

create unique index uk_trade_print_price_tiers_active_uidx
  on public.uk_trade_print_price_tiers (pricing_set_code, position_code, coalesce(colour_count, 0), quantity_tier)
  where is_active;
create index uk_trade_print_price_tiers_lookup_idx
  on public.uk_trade_print_price_tiers (pricing_set_code, position_code, colour_count, quantity_tier, is_active);

create unique index eu_embroidery_pricing_active_uidx
  on public.eu_embroidery_pricing (pricing_set_code, size_code)
  where is_active;
create index eu_embroidery_pricing_lookup_idx
  on public.eu_embroidery_pricing (pricing_set_code, size_code, is_active);

create unique index uk_trade_embroidery_pricing_active_uidx
  on public.uk_trade_embroidery_pricing (pricing_set_code, stitch_count, is_extra_1000_stitches, quantity_tier)
  where is_active;
create index uk_trade_embroidery_pricing_lookup_idx
  on public.uk_trade_embroidery_pricing (pricing_set_code, stitch_count, is_extra_1000_stitches, quantity_tier, is_active);

create unique index calculator_fees_active_uidx
  on public.calculator_fees (calculator_profile_id, fee_code, cost_side)
  where is_active;
create index calculator_fees_profile_code_active_idx
  on public.calculator_fees (calculator_profile_id, fee_code, is_active);

create unique index delivery_rates_active_uidx
  on public.delivery_rates (pricing_set_code, country)
  where is_active;
create index delivery_rates_lookup_idx
  on public.delivery_rates (pricing_set_code, country, is_active);

create trigger garments_set_updated_at
  before update on public.garments
  for each row execute function public.set_updated_at();

create trigger calculator_profiles_set_updated_at
  before update on public.calculator_profiles
  for each row execute function public.set_updated_at();

create trigger calculator_pricing_sets_set_updated_at
  before update on public.calculator_pricing_sets
  for each row execute function public.set_updated_at();

create trigger calculator_garment_markups_set_updated_at
  before update on public.calculator_garment_markups
  for each row execute function public.set_updated_at();

create trigger eu_print_price_tiers_set_updated_at
  before update on public.eu_print_price_tiers
  for each row execute function public.set_updated_at();

create trigger uk_trade_print_price_tiers_set_updated_at
  before update on public.uk_trade_print_price_tiers
  for each row execute function public.set_updated_at();

create trigger eu_embroidery_pricing_set_updated_at
  before update on public.eu_embroidery_pricing
  for each row execute function public.set_updated_at();

create trigger uk_trade_embroidery_pricing_set_updated_at
  before update on public.uk_trade_embroidery_pricing
  for each row execute function public.set_updated_at();

create trigger calculator_fees_set_updated_at
  before update on public.calculator_fees
  for each row execute function public.set_updated_at();

create trigger delivery_rates_set_updated_at
  before update on public.delivery_rates
  for each row execute function public.set_updated_at();

alter table public.garments enable row level security;
alter table public.calculator_profiles enable row level security;
alter table public.calculator_pricing_sets enable row level security;
alter table public.calculator_profile_price_sets enable row level security;
alter table public.calculator_garment_markups enable row level security;
alter table public.eu_print_price_tiers enable row level security;
alter table public.uk_trade_print_price_tiers enable row level security;
alter table public.eu_embroidery_pricing enable row level security;
alter table public.uk_trade_embroidery_pricing enable row level security;
alter table public.calculator_fees enable row level security;
alter table public.delivery_rates enable row level security;

grant select, insert, update on public.garments to authenticated;
grant select, insert, update on public.calculator_profiles to authenticated;
grant select, insert, update on public.calculator_pricing_sets to authenticated;
grant select, insert, update on public.calculator_profile_price_sets to authenticated;
grant select, insert, update on public.calculator_garment_markups to authenticated;
grant select, insert, update on public.eu_print_price_tiers to authenticated;
grant select, insert, update on public.uk_trade_print_price_tiers to authenticated;
grant select, insert, update on public.eu_embroidery_pricing to authenticated;
grant select, insert, update on public.uk_trade_embroidery_pricing to authenticated;
grant select, insert, update on public.calculator_fees to authenticated;
grant select, insert, update on public.delivery_rates to authenticated;

create policy "calculator_garments_read"
  on public.garments for select to authenticated
  using (public.has_pins_hub_access());
create policy "calculator_garments_insert_admin"
  on public.garments for insert to authenticated
  with check (public.has_pins_hub_access('admin') and organisation_id is null);
create policy "calculator_garments_update_admin"
  on public.garments for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin') and organisation_id is null);

create policy "calculator_profiles_read"
  on public.calculator_profiles for select to authenticated
  using (public.has_pins_hub_access());
create policy "calculator_profiles_insert_admin"
  on public.calculator_profiles for insert to authenticated
  with check (public.has_pins_hub_access('admin') and organisation_id is null);
create policy "calculator_profiles_update_admin"
  on public.calculator_profiles for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin') and organisation_id is null);

create policy "calculator_pricing_sets_read"
  on public.calculator_pricing_sets for select to authenticated
  using (public.has_pins_hub_access());
create policy "calculator_pricing_sets_insert_admin"
  on public.calculator_pricing_sets for insert to authenticated
  with check (public.has_pins_hub_access('admin'));
create policy "calculator_pricing_sets_update_admin"
  on public.calculator_pricing_sets for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin'));

create policy "calculator_profile_price_sets_read"
  on public.calculator_profile_price_sets for select to authenticated
  using (public.has_pins_hub_access());
create policy "calculator_profile_price_sets_insert_admin"
  on public.calculator_profile_price_sets for insert to authenticated
  with check (public.has_pins_hub_access('admin'));
create policy "calculator_profile_price_sets_update_admin"
  on public.calculator_profile_price_sets for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin'));

create policy "calculator_garment_markups_read"
  on public.calculator_garment_markups for select to authenticated
  using (public.has_pins_hub_access());
create policy "calculator_garment_markups_insert_admin"
  on public.calculator_garment_markups for insert to authenticated
  with check (public.has_pins_hub_access('admin') and organisation_id is null);
create policy "calculator_garment_markups_update_admin"
  on public.calculator_garment_markups for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin') and organisation_id is null);

create policy "eu_print_price_tiers_read"
  on public.eu_print_price_tiers for select to authenticated
  using (public.has_pins_hub_access());
create policy "eu_print_price_tiers_insert_admin"
  on public.eu_print_price_tiers for insert to authenticated
  with check (public.has_pins_hub_access('admin') and organisation_id is null);
create policy "eu_print_price_tiers_update_admin"
  on public.eu_print_price_tiers for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin') and organisation_id is null);

create policy "uk_trade_print_price_tiers_read"
  on public.uk_trade_print_price_tiers for select to authenticated
  using (public.has_pins_hub_access());
create policy "uk_trade_print_price_tiers_insert_admin"
  on public.uk_trade_print_price_tiers for insert to authenticated
  with check (public.has_pins_hub_access('admin') and organisation_id is null);
create policy "uk_trade_print_price_tiers_update_admin"
  on public.uk_trade_print_price_tiers for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin') and organisation_id is null);

create policy "eu_embroidery_pricing_read"
  on public.eu_embroidery_pricing for select to authenticated
  using (public.has_pins_hub_access());
create policy "eu_embroidery_pricing_insert_admin"
  on public.eu_embroidery_pricing for insert to authenticated
  with check (public.has_pins_hub_access('admin') and organisation_id is null);
create policy "eu_embroidery_pricing_update_admin"
  on public.eu_embroidery_pricing for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin') and organisation_id is null);

create policy "uk_trade_embroidery_pricing_read"
  on public.uk_trade_embroidery_pricing for select to authenticated
  using (public.has_pins_hub_access());
create policy "uk_trade_embroidery_pricing_insert_admin"
  on public.uk_trade_embroidery_pricing for insert to authenticated
  with check (public.has_pins_hub_access('admin') and organisation_id is null);
create policy "uk_trade_embroidery_pricing_update_admin"
  on public.uk_trade_embroidery_pricing for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin') and organisation_id is null);

create policy "calculator_fees_read"
  on public.calculator_fees for select to authenticated
  using (public.has_pins_hub_access());
create policy "calculator_fees_insert_admin"
  on public.calculator_fees for insert to authenticated
  with check (public.has_pins_hub_access('admin') and organisation_id is null);
create policy "calculator_fees_update_admin"
  on public.calculator_fees for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin') and organisation_id is null);

create policy "delivery_rates_read"
  on public.delivery_rates for select to authenticated
  using (public.has_pins_hub_access());
create policy "delivery_rates_insert_admin"
  on public.delivery_rates for insert to authenticated
  with check (public.has_pins_hub_access('admin') and organisation_id is null);
create policy "delivery_rates_update_admin"
  on public.delivery_rates for update to authenticated
  using (public.has_pins_hub_access('admin'))
  with check (public.has_pins_hub_access('admin') and organisation_id is null);
