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
          (required_access_level is null or required_access_level = 'read')
          and aa.access_level in ('admin', 'write', 'read')
        )
        or (
          required_access_level = 'write'
          and aa.access_level in ('admin', 'write')
        )
        or (
          required_access_level = 'admin'
          and aa.access_level = 'admin'
        )
      )
  );
$$;

create table public.product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  commodity_code text not null,
  pricing_category text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_types_name_not_blank_chk check (length(trim(name)) > 0),
  constraint product_types_commodity_code_not_blank_chk check (length(trim(commodity_code)) > 0),
  constraint product_types_pricing_category_chk check (
    pricing_category in ('TSHIRT', 'LONGSLEEVE', 'HOODIE', 'OTHER')
  )
);

create unique index product_types_active_normalized_name_uidx
  on public.product_types ((lower(regexp_replace(trim(name), '\s+', ' ', 'g'))))
  where is_active;
create index product_types_active_idx on public.product_types (is_active);
create index product_types_pricing_category_idx on public.product_types (pricing_category);

create trigger product_types_set_updated_at
  before update on public.product_types
  for each row execute function public.set_updated_at();

alter table public.garments
  add column product_type_id uuid null references public.product_types(id) on delete restrict;
create index garments_product_type_id_idx on public.garments (product_type_id);

comment on column public.garments.garment_type is
  'Transitional calculator pricing category. Product Type pricing_category becomes authoritative after garment data migration.';

alter table public.garments
  drop constraint garments_type_chk,
  add constraint garments_type_chk check (garment_type in ('TSHIRT', 'LONGSLEEVE', 'HOODIE', 'OTHER'));

alter table public.calculator_garment_markups
  drop constraint calculator_garment_markups_type_chk,
  add constraint calculator_garment_markups_type_chk check (garment_type in ('TSHIRT', 'LONGSLEEVE', 'HOODIE', 'OTHER'));

alter table public.product_types enable row level security;

grant select, insert, update, delete on public.product_types to authenticated;

create policy "product_types_read"
  on public.product_types for select to authenticated
  using (public.has_pins_hub_access());
create policy "product_types_insert_write"
  on public.product_types for insert to authenticated
  with check (public.has_pins_hub_access('write'));
create policy "product_types_update_write"
  on public.product_types for update to authenticated
  using (public.has_pins_hub_access('write'))
  with check (public.has_pins_hub_access('write'));
create policy "product_types_delete_admin"
  on public.product_types for delete to authenticated
  using (public.has_pins_hub_access('admin'));
