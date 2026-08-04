-- Invoice directory schema and organisation-aware access.

create or replace function public.has_pins_hub_access_for_organisation(
  target_organisation_id uuid,
  required_access_level text default null
)
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
      and om.organisation_id = target_organisation_id
      and aa.app_key = 'pins_hub'
      and (
        -- NULL and read mean any valid Pins Hub access; write/admin preserve
        -- the existing access hierarchy used by the application.
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

revoke all on function public.has_pins_hub_access_for_organisation(uuid, text) from public;
revoke all on function public.has_pins_hub_access_for_organisation(uuid, text) from anon;
grant execute on function public.has_pins_hub_access_for_organisation(uuid, text) to authenticated;

create or replace function public.is_canonical_pins_knuckles_organisation(
  target_organisation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organisations organisation
    where organisation.id = target_organisation_id
      and organisation.slug = 'pins-knuckles'
  );
$$;

revoke all on function public.is_canonical_pins_knuckles_organisation(uuid) from public;
revoke all on function public.is_canonical_pins_knuckles_organisation(uuid) from anon;
grant execute on function public.is_canonical_pins_knuckles_organisation(uuid) to authenticated;

create table public.invoice_companies (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  label text not null,
  company_name text not null,
  contact_name text not null default '',
  country text not null default '',
  eori text not null default '',
  vat_number text not null default '',
  tax_id text not null default '',
  telephone text not null default '',
  email text not null default '',
  address_line_1 text not null default '',
  address_line_2 text not null default '',
  city text not null default '',
  region text not null default '',
  postal_code text not null default '',
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_companies_label_not_blank_chk
    check (length(trim(label)) > 0),
  constraint invoice_companies_name_not_blank_chk
    check (length(trim(company_name)) > 0)
);

create unique index invoice_companies_active_label_uidx
  on public.invoice_companies (
    organisation_id,
    lower(regexp_replace(trim(label), '\s+', ' ', 'g'))
  )
  where is_active;

create index invoice_companies_active_lookup_idx
  on public.invoice_companies (organisation_id, is_active, label);

create table public.invoice_products (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  product_code text not null,
  product_name text not null,
  type_material text not null default '',
  description text not null default '',
  commodity_code text not null,
  country_of_origin text not null default '',
  default_cost numeric(12, 4),
  currency_code text,
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_products_code_not_blank_chk
    check (length(trim(product_code)) > 0),
  constraint invoice_products_name_not_blank_chk
    check (length(trim(product_name)) > 0),
  constraint invoice_products_commodity_code_not_blank_chk
    check (length(trim(commodity_code)) > 0),
  constraint invoice_products_default_cost_chk
    check (default_cost is null or default_cost >= 0),
  constraint invoice_products_currency_chk
    check (currency_code is null or currency_code in ('GBP', 'EUR'))
);

create unique index invoice_products_active_code_uidx
  on public.invoice_products (
    organisation_id,
    lower(regexp_replace(trim(product_code), '\s+', ' ', 'g'))
  )
  where is_active;

create index invoice_products_active_lookup_idx
  on public.invoice_products (
    organisation_id,
    is_active,
    product_name,
    product_code,
    commodity_code
  );

create trigger invoice_companies_set_updated_at
  before update on public.invoice_companies
  for each row execute function public.set_updated_at();

create trigger invoice_products_set_updated_at
  before update on public.invoice_products
  for each row execute function public.set_updated_at();

create or replace function public.enforce_invoice_directory_row_scope()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_canonical_pins_knuckles_organisation(new.organisation_id) then
    raise exception 'Invoice directory rows must belong to the canonical pins-knuckles organisation.';
  end if;

  if tg_op = 'UPDATE'
     and old.is_active is distinct from new.is_active
     and not public.has_pins_hub_access_for_organisation(old.organisation_id, 'admin') then
    raise exception 'Only Pins Hub administrators may change invoice directory activation state.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_invoice_directory_row_scope() from public;
revoke all on function public.enforce_invoice_directory_row_scope() from anon;

create trigger invoice_companies_enforce_row_scope
  before insert or update on public.invoice_companies
  for each row execute function public.enforce_invoice_directory_row_scope();

create trigger invoice_products_enforce_row_scope
  before insert or update on public.invoice_products
  for each row execute function public.enforce_invoice_directory_row_scope();

alter table public.invoice_companies enable row level security;
alter table public.invoice_products enable row level security;

grant select, insert, update, delete on public.invoice_companies to authenticated;
grant select, insert, update, delete on public.invoice_products to authenticated;

create policy "invoice_companies_read"
  on public.invoice_companies
  for select
  to authenticated
  using (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id)
    and (
      is_active
      or public.has_pins_hub_access_for_organisation(organisation_id, 'write')
    )
  );

create policy "invoice_companies_insert_write"
  on public.invoice_companies
  for insert
  to authenticated
  with check (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'write')
  );

create policy "invoice_companies_update_write"
  on public.invoice_companies
  for update
  to authenticated
  using (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'write')
  )
  with check (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'write')
  );

create policy "invoice_companies_delete_admin"
  on public.invoice_companies
  for delete
  to authenticated
  using (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'admin')
  );

create policy "invoice_products_read"
  on public.invoice_products
  for select
  to authenticated
  using (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id)
    and (
      is_active
      or public.has_pins_hub_access_for_organisation(organisation_id, 'write')
    )
  );

create policy "invoice_products_insert_write"
  on public.invoice_products
  for insert
  to authenticated
  with check (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'write')
  );

create policy "invoice_products_update_write"
  on public.invoice_products
  for update
  to authenticated
  using (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'write')
  )
  with check (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'write')
  );

create policy "invoice_products_delete_admin"
  on public.invoice_products
  for delete
  to authenticated
  using (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'admin')
  );

comment on policy "invoice_companies_update_write" on public.invoice_companies is
  'Write users may edit company content; the lifecycle trigger reserves activation changes for admins.';
comment on policy "invoice_products_update_write" on public.invoice_products is
  'Write users may edit product content; the lifecycle trigger reserves activation changes for admins.';
comment on policy "invoice_companies_delete_admin" on public.invoice_companies is
  'Only administrators may permanently delete invoice companies.';
comment on policy "invoice_products_delete_admin" on public.invoice_products is
  'Only administrators may permanently delete invoice products.';
