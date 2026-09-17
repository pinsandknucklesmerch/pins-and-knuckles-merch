-- Centrally managed operational reference content for the canonical Pins & Knuckles organisation.

create table public.quick_reference_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  title text not null,
  category text not null,
  body text not null,
  warning text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quick_reference_records_title_not_blank_chk check (length(trim(title)) > 0),
  constraint quick_reference_records_category_not_blank_chk check (length(trim(category)) > 0),
  constraint quick_reference_records_body_not_blank_chk check (length(trim(body)) > 0),
  constraint quick_reference_records_display_order_non_negative_chk check (display_order >= 0)
);

create unique index quick_reference_records_organisation_title_uidx
  on public.quick_reference_records (
    organisation_id,
    lower(regexp_replace(trim(title), '\s+', ' ', 'g'))
  );

create index quick_reference_records_active_display_idx
  on public.quick_reference_records (organisation_id, is_active, category, display_order, title);

create trigger quick_reference_records_set_updated_at
  before update on public.quick_reference_records
  for each row execute function public.set_updated_at();

create or replace function public.enforce_quick_reference_record_scope()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_canonical_pins_knuckles_organisation(new.organisation_id) then
    raise exception 'Quick Reference records must belong to the canonical pins-knuckles organisation.';
  end if;

  if tg_op = 'UPDATE'
     and old.is_active is distinct from new.is_active
     and not public.has_pins_hub_access_for_organisation(old.organisation_id, 'admin') then
    raise exception 'Only Pins Hub administrators may change Quick Reference activation state.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_quick_reference_record_scope() from public;
revoke all on function public.enforce_quick_reference_record_scope() from anon;

create trigger quick_reference_records_enforce_scope
  before insert or update on public.quick_reference_records
  for each row execute function public.enforce_quick_reference_record_scope();

alter table public.quick_reference_records enable row level security;

grant select, insert, update, delete on public.quick_reference_records to authenticated;

create policy "quick_reference_records_read"
  on public.quick_reference_records
  for select to authenticated
  using (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id)
    and (
      is_active
      or public.has_pins_hub_access_for_organisation(organisation_id, 'write')
    )
  );

create policy "quick_reference_records_insert_write"
  on public.quick_reference_records
  for insert to authenticated
  with check (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'write')
  );

create policy "quick_reference_records_update_write"
  on public.quick_reference_records
  for update to authenticated
  using (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'write')
  )
  with check (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'write')
  );

create policy "quick_reference_records_delete_admin"
  on public.quick_reference_records
  for delete to authenticated
  using (
    public.is_canonical_pins_knuckles_organisation(organisation_id)
    and public.has_pins_hub_access_for_organisation(organisation_id, 'admin')
  );

comment on policy "quick_reference_records_update_write" on public.quick_reference_records is
  'Write users may edit reference content; the lifecycle trigger reserves activation changes for admins.';
comment on policy "quick_reference_records_delete_admin" on public.quick_reference_records is
  'Only administrators may permanently delete Quick Reference records.';

-- Seed confirmed legacy content without overwriting centrally managed changes.
do $$
declare
  canonical_organisation_id uuid;
  canonical_organisation_count integer;
begin
  select count(*)::integer into canonical_organisation_count
  from public.organisations
  where slug = 'pins-knuckles';

  if canonical_organisation_count <> 1 then
    raise exception 'Expected exactly one canonical organisation with slug pins-knuckles; found %.', canonical_organisation_count;
  end if;

  select id into canonical_organisation_id
  from public.organisations
  where slug = 'pins-knuckles';

  insert into public.quick_reference_records (
    organisation_id, title, category, body, warning, display_order, is_active
  )
  select canonical_organisation_id, seed.title, seed.category, seed.body, seed.warning, seed.display_order, true
  from (
    values
      ('Pins & Knuckles UK Billing Information', 'Billing', E'Pins & Knuckles Clothing Ltd\n73 Main Road\nQueenborough\nKent\nME11 5DJ\nUnited Kingdom', null::text, 10),
      ('Ramsgate Warehouse Delivery Address', 'Delivery', E'Pins & Knuckles Merch\nUnit 5, The Old Timber Yard\nManston Road\nRamsgate\nKent\nCT12 6HJ\nUnited Kingdom', null::text, 20),
      ('Margate Warehouse Address', 'Delivery', E'Premier House,\n82 Sweyn Road\nMargate\nKent\nCT9 2DD\nUnited Kingdom', null::text, 30),
      ('Corporate Information for UK Imports', 'Imports', E'The Embroidered and Printed Clothing Company\nPremier House, 82 Sweyn Road\nMargate\nKent\nCT9 2DD\nUNITED KINGDOM\nEORI Number: GB995260876000', null::text, 40),
      ('Hungary Warehouse Delivery Address', 'Delivery', E'Soroksári út 110-112, E épület, 2. emelet\n1095 Budapest\nHungary', null::text, 40),
      ('Hungary Corporate Information for EU Imports', 'Imports', E'Sportimadok.hu kft\nHungary, Budapest, Sasadi ut 145\nPost Code: 1112\nEORI Number: HU0044897613\nVAT Number: HU25464807', 'THESE NUMBERS ARE NOT TO BE USED FOR INTRA-COMPANY TAX WITHIN THE EU. IMPORTS ONLY.', 50)
  ) as seed(title, category, body, warning, display_order)
  where not exists (
    select 1
    from public.quick_reference_records existing
    where existing.organisation_id = canonical_organisation_id
      and lower(regexp_replace(trim(existing.title), '\s+', ' ', 'g')) = lower(regexp_replace(trim(seed.title), '\s+', ' ', 'g'))
  );
end;
$$;
