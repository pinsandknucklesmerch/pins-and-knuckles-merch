-- Batch 2B: atomic operational RLS/helper cutover. Requires the Band foundation
-- and Batch 2A. No Band creation or access-administration RPCs are introduced.

begin;
set local search_path = pg_catalog, public, pg_temp;

-- Publish the entire policy/grant/helper change together. Block requests on all
-- affected operational tables while replacing the old permissive policy set.
lock table public.merchbuddy_customers,
  public.merchbuddy_tours,
  public.merchbuddy_products,
  public.merchbuddy_product_variants,
  public.merchbuddy_shows,
  public.merchbuddy_show_inventory_counts,
  public.merchbuddy_customer_contacts,
  public.merchbuddy_customer_account_managers,
  public.merchbuddy_tour_users
  in access exclusive mode;

create or replace function public.can_access_merchbuddy_tour(target_tour_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1 from public.merchbuddy_tour_access_context(target_tour_id)
  );
$$;

create or replace function public.can_manage_merchbuddy_tour(target_tour_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1 from public.merchbuddy_tour_access_context(target_tour_id) access
    where access.band_status = 'active'
      and (access.effective_band_role in ('manager', 'owner')
        or access.legacy_tour_role in ('staff', 'manager', 'owner'))
  );
$$;

create or replace function public.can_manage_merchbuddy_tour_definition(target_tour_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1 from public.merchbuddy_tour_access_context(target_tour_id) access
    where access.band_status = 'active'
      and (access.effective_band_role in ('manager', 'owner')
        or access.legacy_tour_role in ('manager', 'owner'))
  );
$$;

-- Separate inventory capability: new Band staff must not inherit the wider
-- Product/Show permissions retained temporarily for legacy Tour staff.
create function public.can_operate_merchbuddy_tour(target_tour_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1 from public.merchbuddy_tour_access_context(target_tour_id) access
    where access.band_status = 'active'
      and (access.effective_band_role in ('staff', 'manager', 'owner')
        or access.legacy_tour_role in ('staff', 'manager', 'owner'))
  );
$$;

-- Parent-Band visibility is deliberately separate from Band-wide authority.
-- Legacy Tour users may see this Band row, but not its contacts, membership
-- directories, sibling Tours, or Band-wide management capabilities.
create or replace function public.can_access_merchbuddy_customer(target_customer_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select target_customer_id is not null
    and (public.can_access_merchbuddy_band(target_customer_id)
      or exists (
        select 1 from public.merchbuddy_legacy_tour_access(target_customer_id) legacy
        where legacy.customer_id = target_customer_id
      ));
$$;

-- Column grants below allow owner-only name/status updates. A historical Band
-- must be reactivated in a separate status-only operation before editing its
-- definition. This trigger needs no privileged reads or SECURITY DEFINER.
create function public.merchbuddy_guard_inactive_band_definition()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if old.status = 'inactive' and new.name is distinct from old.name then
    raise exception 'Reactivate the Band in a separate status-only update before changing its definition'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger guard_merchbuddy_inactive_band_definition
  before update on public.merchbuddy_customers
  for each row execute function public.merchbuddy_guard_inactive_band_definition();

comment on function public.can_access_merchbuddy_tour(uuid) is
  'Band-first Tour read: canonical Band-wide access or an existing caller grant for this Tour only; inactive historical reads allowed.';
comment on function public.can_manage_merchbuddy_tour(uuid) is
  'Active Band manager/owner or legacy staff/manager/owner on this Tour only. Product/variant/Show writes, not the new Band-staff inventory capability.';
comment on function public.can_manage_merchbuddy_tour_definition(uuid) is
  'Active Band manager/owner or legacy manager/owner on this Tour only; ordinary parent/identity updates are separately denied by column grants.';
comment on function public.can_operate_merchbuddy_tour(uuid) is
  'Inventory capability: active Band staff/manager/owner or legacy staff/manager/owner on this Tour only.';
comment on function public.can_access_merchbuddy_customer(uuid) is
  'Band identity read only: Band-wide access or the parent of a caller-assigned legacy Tour. Does not confer Band-wide authority.';
comment on function public.merchbuddy_tour_access_context(uuid) is
  'Internal canonical Band/status and separate Band/Tour roles, now used by the Batch 2B operational Tour helpers. No client EXECUTE grant.';
comment on column public.merchbuddy_customers.organisation_id is
  'Legacy nullable Organisation metadata, never a Band authorization source. Authenticated clients cannot insert Bands or update this column; management relationships use merchbuddy_band_organisations.';
comment on column public.merchbuddy_tours.organisation_id is
  'Legacy nullable Organisation metadata, never a Tour authorization source. Accepted on insert for older clients but immutable through authenticated updates; customer_id is canonical.';

revoke all on function
  public.can_access_merchbuddy_tour(uuid),
  public.can_manage_merchbuddy_tour(uuid),
  public.can_manage_merchbuddy_tour_definition(uuid),
  public.can_operate_merchbuddy_tour(uuid),
  public.can_access_merchbuddy_customer(uuid),
  public.merchbuddy_guard_inactive_band_definition()
  from public, anon, authenticated, service_role;

grant execute on function
  public.can_access_merchbuddy_tour(uuid),
  public.can_manage_merchbuddy_tour(uuid),
  public.can_manage_merchbuddy_tour_definition(uuid),
  public.can_operate_merchbuddy_tour(uuid),
  public.can_access_merchbuddy_customer(uuid)
  to authenticated;

-- Remove the entire known policy set, including September 9's altered SELECT
-- policies and both legacy association-table DELETE policies. Adding a stricter
-- policy alongside any old permissive one would not narrow access.
drop policy if exists merchbuddy_customers_read on public.merchbuddy_customers;
drop policy if exists merchbuddy_customers_insert_write on public.merchbuddy_customers;
drop policy if exists merchbuddy_customers_update_write on public.merchbuddy_customers;
drop policy if exists merchbuddy_tours_read on public.merchbuddy_tours;
drop policy if exists merchbuddy_tours_insert_write on public.merchbuddy_tours;
drop policy if exists merchbuddy_tours_update_manage on public.merchbuddy_tours;
drop policy if exists merchbuddy_products_read on public.merchbuddy_products;
drop policy if exists merchbuddy_products_insert_manage on public.merchbuddy_products;
drop policy if exists merchbuddy_products_update_manage on public.merchbuddy_products;
drop policy if exists merchbuddy_product_variants_read on public.merchbuddy_product_variants;
drop policy if exists merchbuddy_product_variants_insert_manage on public.merchbuddy_product_variants;
drop policy if exists merchbuddy_product_variants_update_manage on public.merchbuddy_product_variants;
drop policy if exists merchbuddy_shows_read on public.merchbuddy_shows;
drop policy if exists merchbuddy_shows_insert_manage on public.merchbuddy_shows;
drop policy if exists merchbuddy_shows_update_manage on public.merchbuddy_shows;
drop policy if exists merchbuddy_show_inventory_counts_read on public.merchbuddy_show_inventory_counts;
drop policy if exists merchbuddy_show_inventory_counts_insert_manage on public.merchbuddy_show_inventory_counts;
drop policy if exists merchbuddy_show_inventory_counts_update_manage on public.merchbuddy_show_inventory_counts;
drop policy if exists merchbuddy_customer_contacts_read on public.merchbuddy_customer_contacts;
drop policy if exists merchbuddy_customer_contacts_insert_write on public.merchbuddy_customer_contacts;
drop policy if exists merchbuddy_customer_contacts_update_write on public.merchbuddy_customer_contacts;
drop policy if exists merchbuddy_customer_account_managers_read on public.merchbuddy_customer_account_managers;
drop policy if exists merchbuddy_customer_account_managers_insert_admin on public.merchbuddy_customer_account_managers;
drop policy if exists merchbuddy_customer_account_managers_update_admin on public.merchbuddy_customer_account_managers;
drop policy if exists merchbuddy_customer_account_managers_delete_admin on public.merchbuddy_customer_account_managers;
drop policy if exists merchbuddy_tour_users_read on public.merchbuddy_tour_users;
drop policy if exists merchbuddy_tour_users_insert_admin on public.merchbuddy_tour_users;
drop policy if exists merchbuddy_tour_users_update_admin on public.merchbuddy_tour_users;
drop policy if exists merchbuddy_tour_users_delete_admin on public.merchbuddy_tour_users;

-- Fail closed on unexpected policy drift instead of committing with a hidden
-- permissive fallback or silently deleting an unfamiliar policy. This guard is
-- part of the migration transaction, not a separate verification command.
do $$
declare
  remaining_policies text;
begin
  select string_agg(format('%s: %I', policy.polrelid::regclass, policy.polname), ', ')
    into remaining_policies
  from pg_catalog.pg_policy policy
  where policy.polrelid in (
    'public.merchbuddy_customers'::regclass,
    'public.merchbuddy_tours'::regclass,
    'public.merchbuddy_products'::regclass,
    'public.merchbuddy_product_variants'::regclass,
    'public.merchbuddy_shows'::regclass,
    'public.merchbuddy_show_inventory_counts'::regclass,
    'public.merchbuddy_customer_contacts'::regclass,
    'public.merchbuddy_customer_account_managers'::regclass,
    'public.merchbuddy_tour_users'::regclass
  );

  if remaining_policies is not null then
    raise exception 'Unexpected MerchBuddy policies remain: %', remaining_policies
      using errcode = '23514',
        hint = 'Review the unexpected policies before retrying the atomic Band-first cutover. This transaction must not retain old authorization fallbacks.';
  end if;
end;
$$;

alter table public.merchbuddy_customers enable row level security;
alter table public.merchbuddy_tours enable row level security;
alter table public.merchbuddy_products enable row level security;
alter table public.merchbuddy_product_variants enable row level security;
alter table public.merchbuddy_shows enable row level security;
alter table public.merchbuddy_show_inventory_counts enable row level security;
alter table public.merchbuddy_customer_contacts enable row level security;
alter table public.merchbuddy_customer_account_managers enable row level security;
alter table public.merchbuddy_tour_users enable row level security;

-- Table-level UPDATE would override any column allowlist. Clear both table and
-- existing column grants, then explicitly authorize only supported fields.
-- SELECT is row-scoped by the new policies; there are no client DELETE grants.
revoke all on table public.merchbuddy_customers,
  public.merchbuddy_tours,
  public.merchbuddy_products,
  public.merchbuddy_product_variants,
  public.merchbuddy_shows,
  public.merchbuddy_show_inventory_counts,
  public.merchbuddy_customer_contacts,
  public.merchbuddy_customer_account_managers,
  public.merchbuddy_tour_users
  from public, anon, authenticated;

do $$
declare
  target record;
begin
  for target in
    select relation.relname,
      string_agg(format('%I', attribute.attname), ', ' order by attribute.attnum) as columns
    from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
    join pg_catalog.pg_attribute attribute on attribute.attrelid = relation.oid
    where namespace.nspname = 'public'
      and relation.relname in (
        'merchbuddy_customers', 'merchbuddy_tours', 'merchbuddy_products',
        'merchbuddy_product_variants', 'merchbuddy_shows', 'merchbuddy_show_inventory_counts',
        'merchbuddy_customer_contacts', 'merchbuddy_customer_account_managers', 'merchbuddy_tour_users'
      )
      and attribute.attnum > 0 and not attribute.attisdropped
    group by relation.relname
  loop
    execute format('revoke all (%s) on table public.%I from public, anon, authenticated', target.columns, target.relname);
  end loop;
end;
$$;

grant select on table public.merchbuddy_customers,
  public.merchbuddy_tours,
  public.merchbuddy_products,
  public.merchbuddy_product_variants,
  public.merchbuddy_shows,
  public.merchbuddy_show_inventory_counts,
  public.merchbuddy_customer_contacts,
  public.merchbuddy_customer_account_managers,
  public.merchbuddy_tour_users
  to authenticated;

-- No Band INSERT, account-manager writes, or legacy Tour-grant writes. Their
-- future authorized creation/administration operations belong to Batch 2C.
grant update (name, status) on public.merchbuddy_customers to authenticated;

grant insert (organisation_id, customer_id, name, start_date, end_date, status, currency, created_by),
  update (name, start_date, end_date, status, currency)
  on public.merchbuddy_tours to authenticated;
grant insert (tour_id, name, sku, sale_price, image_path, sort_order, is_active),
  update (name, sku, sale_price, image_path, sort_order, is_active)
  on public.merchbuddy_products to authenticated;
grant insert (product_id, name, starting_quantity, sort_order),
  update (name, starting_quantity, sort_order)
  on public.merchbuddy_product_variants to authenticated;
grant insert (tour_id, venue_name, show_date, street_address, city, postal_code, country, set_type, sell_type, notes),
  update (venue_name, show_date, street_address, city, postal_code, country, set_type, sell_type, notes)
  on public.merchbuddy_shows to authenticated;
grant insert (show_id, variant_id, count_in_quantity, count_out_quantity),
  update (count_in_quantity, count_out_quantity)
  on public.merchbuddy_show_inventory_counts to authenticated;
grant insert (customer_id, profile_id, name, email, phone, position, is_primary),
  update (profile_id, name, email, phone, position, is_primary)
  on public.merchbuddy_customer_contacts to authenticated;

create policy merchbuddy_customers_read on public.merchbuddy_customers
  for select to authenticated
  using (public.can_access_merchbuddy_customer(id));
create policy merchbuddy_customers_update_owner on public.merchbuddy_customers
  for update to authenticated
  using (public.can_administer_merchbuddy_band(id))
  with check (public.can_administer_merchbuddy_band(id));

-- INSERT RETURNING checks the policy row's canonical parent directly. The
-- Band branch does not look up the newly inserted Tour in a STABLE snapshot.
-- The second branch preserves legacy access for existing assigned Tours only.
create policy merchbuddy_tours_read on public.merchbuddy_tours
  for select to authenticated
  using (public.can_access_merchbuddy_band(customer_id) or public.can_access_merchbuddy_tour(id));
create policy merchbuddy_tours_insert_manage_band on public.merchbuddy_tours
  for insert to authenticated
  with check (public.can_manage_merchbuddy_band(customer_id) and created_by = auth.uid());
create policy merchbuddy_tours_update_manage on public.merchbuddy_tours
  for update to authenticated
  using (public.can_manage_merchbuddy_tour_definition(id))
  with check (public.can_manage_merchbuddy_tour_definition(id));

-- All descendant SELECT/INSERT policies use existing parent rows, never a
-- lookup of the newly inserted Product, Variant, Show, contact, or count itself.
create policy merchbuddy_products_read on public.merchbuddy_products
  for select to authenticated using (public.can_access_merchbuddy_tour(tour_id));
create policy merchbuddy_products_insert_manage on public.merchbuddy_products
  for insert to authenticated with check (public.can_manage_merchbuddy_tour(tour_id));
create policy merchbuddy_products_update_manage on public.merchbuddy_products
  for update to authenticated
  using (public.can_manage_merchbuddy_tour(tour_id))
  with check (public.can_manage_merchbuddy_tour(tour_id));

create policy merchbuddy_product_variants_read on public.merchbuddy_product_variants
  for select to authenticated
  using (public.can_access_merchbuddy_tour((
    select product.tour_id from public.merchbuddy_products product
    where product.id = merchbuddy_product_variants.product_id
  )));
create policy merchbuddy_product_variants_insert_manage on public.merchbuddy_product_variants
  for insert to authenticated
  with check (public.can_manage_merchbuddy_tour((
    select product.tour_id from public.merchbuddy_products product
    where product.id = merchbuddy_product_variants.product_id
  )));
create policy merchbuddy_product_variants_update_manage on public.merchbuddy_product_variants
  for update to authenticated
  using (public.can_manage_merchbuddy_tour((
    select product.tour_id from public.merchbuddy_products product
    where product.id = merchbuddy_product_variants.product_id
  )))
  with check (public.can_manage_merchbuddy_tour((
    select product.tour_id from public.merchbuddy_products product
    where product.id = merchbuddy_product_variants.product_id
  )));

create policy merchbuddy_shows_read on public.merchbuddy_shows
  for select to authenticated using (public.can_access_merchbuddy_tour(tour_id));
create policy merchbuddy_shows_insert_manage on public.merchbuddy_shows
  for insert to authenticated with check (public.can_manage_merchbuddy_tour(tour_id));
create policy merchbuddy_shows_update_manage on public.merchbuddy_shows
  for update to authenticated
  using (public.can_manage_merchbuddy_tour(tour_id))
  with check (public.can_manage_merchbuddy_tour(tour_id));

create policy merchbuddy_show_inventory_counts_read on public.merchbuddy_show_inventory_counts
  for select to authenticated
  using (public.can_access_merchbuddy_tour((
    select show_row.tour_id from public.merchbuddy_shows show_row
    where show_row.id = merchbuddy_show_inventory_counts.show_id
  )));
create policy merchbuddy_show_inventory_counts_insert_operate on public.merchbuddy_show_inventory_counts
  for insert to authenticated
  with check (public.can_operate_merchbuddy_tour((
    select show_row.tour_id from public.merchbuddy_shows show_row
    where show_row.id = merchbuddy_show_inventory_counts.show_id
  )));
create policy merchbuddy_show_inventory_counts_update_operate on public.merchbuddy_show_inventory_counts
  for update to authenticated
  using (public.can_operate_merchbuddy_tour((
    select show_row.tour_id from public.merchbuddy_shows show_row
    where show_row.id = merchbuddy_show_inventory_counts.show_id
  )))
  with check (public.can_operate_merchbuddy_tour((
    select show_row.tour_id from public.merchbuddy_shows show_row
    where show_row.id = merchbuddy_show_inventory_counts.show_id
  )));

-- Contacts are Band-wide operational data, not part of limited Tour-parent
-- identity visibility. Account-manager associations never grant authorization.
create policy merchbuddy_customer_contacts_read on public.merchbuddy_customer_contacts
  for select to authenticated using (public.can_access_merchbuddy_band(customer_id));
create policy merchbuddy_customer_contacts_insert_manage_band on public.merchbuddy_customer_contacts
  for insert to authenticated with check (public.can_manage_merchbuddy_band(customer_id));
create policy merchbuddy_customer_contacts_update_manage_band on public.merchbuddy_customer_contacts
  for update to authenticated
  using (public.can_manage_merchbuddy_band(customer_id))
  with check (public.can_manage_merchbuddy_band(customer_id));
create policy merchbuddy_customer_account_managers_read_owner on public.merchbuddy_customer_account_managers
  for select to authenticated using (public.can_administer_merchbuddy_band(customer_id));

-- Existing Tour grants remain, but their directory is visible only to the grant
-- subject or a direct Band owner. All client grant mutations are frozen.
create policy merchbuddy_tour_users_read_self_or_owner on public.merchbuddy_tour_users
  for select to authenticated
  using (profile_id = auth.uid() or exists (
    select 1 from public.merchbuddy_tours tour
    where tour.id = merchbuddy_tour_users.tour_id
      and public.can_administer_merchbuddy_band(tour.customer_id)
  ));

-- The three Band access tables retain Batch 1/2A's private grants and no direct
-- authenticated policies. Existing entitlement helpers remain one-way sources
-- only; none of the policies above uses Organisation entitlement as authority.
commit;
