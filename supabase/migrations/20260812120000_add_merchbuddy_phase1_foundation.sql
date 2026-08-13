-- MerchBuddy Phase 1: organisation-scoped tour merchandising foundation.

create table public.merchbuddy_customers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete restrict,
  name text not null,
  status text not null default 'active',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchbuddy_customers_status_chk check (status in ('active', 'inactive')),
  constraint merchbuddy_customers_name_not_blank_chk check (length(trim(name)) > 0),
  constraint merchbuddy_customers_id_organisation_key unique (id, organisation_id)
);

create table public.merchbuddy_customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.merchbuddy_customers(id) on delete restrict,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  position text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchbuddy_customer_contacts_name_not_blank_chk check (length(trim(name)) > 0)
);

create table public.merchbuddy_customer_account_managers (
  customer_id uuid not null references public.merchbuddy_customers(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (customer_id, profile_id)
);

create table public.merchbuddy_tours (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  customer_id uuid not null,
  name text not null,
  start_date date,
  end_date date,
  status text not null default 'draft',
  currency text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchbuddy_tours_organisation_fkey
    foreign key (organisation_id) references public.organisations(id) on delete restrict,
  constraint merchbuddy_tours_customer_organisation_fkey
    foreign key (customer_id, organisation_id)
    references public.merchbuddy_customers(id, organisation_id) on delete restrict,
  constraint merchbuddy_tours_name_not_blank_chk check (length(trim(name)) > 0),
  constraint merchbuddy_tours_status_chk check (status in ('draft', 'active', 'completed', 'archived')),
  constraint merchbuddy_tours_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint merchbuddy_tours_date_range_chk check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.merchbuddy_tour_users (
  tour_id uuid not null references public.merchbuddy_tours(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (tour_id, profile_id),
  constraint merchbuddy_tour_users_role_chk check (role in ('owner', 'manager', 'staff', 'viewer'))
);

create table public.merchbuddy_products (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.merchbuddy_tours(id) on delete restrict,
  name text not null,
  sku text,
  sale_price numeric(12, 2),
  image_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchbuddy_products_name_not_blank_chk check (length(trim(name)) > 0),
  constraint merchbuddy_products_sale_price_chk check (sale_price is null or sale_price >= 0)
);

create table public.merchbuddy_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.merchbuddy_products(id) on delete restrict,
  name text not null,
  starting_quantity integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchbuddy_product_variants_name_not_blank_chk check (length(trim(name)) > 0),
  constraint merchbuddy_product_variants_starting_quantity_chk check (starting_quantity >= 0)
);

create table public.merchbuddy_shows (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.merchbuddy_tours(id) on delete restrict,
  venue_name text not null,
  show_date date not null,
  street_address text,
  city text not null,
  postal_code text,
  country text not null,
  set_type text not null,
  sell_type text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchbuddy_shows_venue_name_not_blank_chk check (length(trim(venue_name)) > 0),
  constraint merchbuddy_shows_city_not_blank_chk check (length(trim(city)) > 0),
  constraint merchbuddy_shows_country_not_blank_chk check (length(trim(country)) > 0),
  constraint merchbuddy_shows_set_type_chk check (set_type in ('headliner', 'support', 'festival')),
  constraint merchbuddy_shows_sell_type_chk check (sell_type in ('self_sell', 'venue_sell'))
);

create index merchbuddy_customers_organisation_status_name_idx
  on public.merchbuddy_customers (organisation_id, status, name);
create index merchbuddy_customer_contacts_customer_id_idx
  on public.merchbuddy_customer_contacts (customer_id);
create index merchbuddy_customer_contacts_profile_id_idx
  on public.merchbuddy_customer_contacts (profile_id) where profile_id is not null;
create index merchbuddy_customer_account_managers_profile_id_idx
  on public.merchbuddy_customer_account_managers (profile_id);
create index merchbuddy_tours_organisation_customer_idx
  on public.merchbuddy_tours (organisation_id, customer_id);
create index merchbuddy_tours_customer_id_idx on public.merchbuddy_tours (customer_id);
create index merchbuddy_tour_users_profile_id_idx on public.merchbuddy_tour_users (profile_id);
create index merchbuddy_products_tour_sort_order_idx on public.merchbuddy_products (tour_id, sort_order, name);
create index merchbuddy_product_variants_product_sort_order_idx on public.merchbuddy_product_variants (product_id, sort_order, name);
create unique index merchbuddy_product_variants_product_name_uidx
  on public.merchbuddy_product_variants (product_id, lower(regexp_replace(trim(name), '\s+', ' ', 'g')));
create index merchbuddy_shows_tour_id_idx on public.merchbuddy_shows (tour_id);
create index merchbuddy_shows_show_date_idx on public.merchbuddy_shows (show_date);
create index merchbuddy_shows_tour_show_date_idx on public.merchbuddy_shows (tour_id, show_date);

create trigger set_merchbuddy_customers_updated_at before update on public.merchbuddy_customers for each row execute function public.set_updated_at();
create trigger set_merchbuddy_customer_contacts_updated_at before update on public.merchbuddy_customer_contacts for each row execute function public.set_updated_at();
create trigger set_merchbuddy_tours_updated_at before update on public.merchbuddy_tours for each row execute function public.set_updated_at();
create trigger set_merchbuddy_products_updated_at before update on public.merchbuddy_products for each row execute function public.set_updated_at();
create trigger set_merchbuddy_product_variants_updated_at before update on public.merchbuddy_product_variants for each row execute function public.set_updated_at();
create trigger set_merchbuddy_shows_updated_at before update on public.merchbuddy_shows for each row execute function public.set_updated_at();

create or replace function public.has_merchbuddy_access(required_access_level text default null)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organisation_members membership
    join public.app_access access on access.organisation_member_id = membership.id
    where membership.user_id = auth.uid() and membership.is_active and access.app_key = 'merchbuddy'
      and ((required_access_level is null and access.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'read' and access.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'write' and access.access_level in ('write', 'admin', 'developer'))
        or (required_access_level = 'admin' and access.access_level in ('admin', 'developer'))
        or (required_access_level = 'developer' and access.access_level = 'developer'))
  );
$$;

create or replace function public.has_merchbuddy_access_for_organisation(target_organisation_id uuid, required_access_level text default null)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organisation_members membership
    join public.app_access access on access.organisation_member_id = membership.id
    where membership.user_id = auth.uid() and membership.organisation_id = target_organisation_id
      and membership.is_active and access.app_key = 'merchbuddy'
      and ((required_access_level is null and access.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'read' and access.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'write' and access.access_level in ('write', 'admin', 'developer'))
        or (required_access_level = 'admin' and access.access_level in ('admin', 'developer'))
        or (required_access_level = 'developer' and access.access_level = 'developer'))
  );
$$;

create or replace function public.has_merchbuddy_admin_access()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organisation_members membership
    join public.app_access access on access.organisation_member_id = membership.id and access.app_key = 'merchbuddy'
    where membership.user_id = auth.uid() and membership.is_active
      and (membership.role = 'owner' or access.access_level in ('admin', 'developer'))
  );
$$;

create or replace function public.has_merchbuddy_admin_access_for_organisation(target_organisation_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organisation_members membership
    join public.app_access access on access.organisation_member_id = membership.id and access.app_key = 'merchbuddy'
    where membership.user_id = auth.uid() and membership.organisation_id = target_organisation_id and membership.is_active
      and (membership.role = 'owner' or access.access_level in ('admin', 'developer'))
  );
$$;

create or replace function public.can_access_merchbuddy_tour(target_tour_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.merchbuddy_tours tour
    where tour.id = target_tour_id
      and (public.has_merchbuddy_access_for_organisation(tour.organisation_id)
        or exists (
          select 1 from public.merchbuddy_tour_users tour_user
          where tour_user.tour_id = tour.id and tour_user.profile_id = auth.uid()
        ))
  );
$$;

create or replace function public.can_manage_merchbuddy_tour(target_tour_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.merchbuddy_tours tour
    where tour.id = target_tour_id
      and (public.has_merchbuddy_access_for_organisation(tour.organisation_id, 'write')
        or exists (
          select 1 from public.merchbuddy_tour_users tour_user
          where tour_user.tour_id = tour.id and tour_user.profile_id = auth.uid()
            and tour_user.role in ('owner', 'manager', 'staff')
        ))
  );
$$;

create or replace function public.can_manage_merchbuddy_tour_definition(target_tour_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.merchbuddy_tours tour
    where tour.id = target_tour_id
      and (public.has_merchbuddy_access_for_organisation(tour.organisation_id, 'write')
        or exists (
          select 1 from public.merchbuddy_tour_users tour_user
          where tour_user.tour_id = tour.id and tour_user.profile_id = auth.uid()
            and tour_user.role in ('owner', 'manager')
        ))
  );
$$;

create or replace function public.can_access_merchbuddy_customer(target_customer_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.merchbuddy_customers customer
    where customer.id = target_customer_id
      and (public.has_merchbuddy_access_for_organisation(customer.organisation_id)
        or exists (
          select 1 from public.merchbuddy_tours tour
          where tour.customer_id = customer.id and public.can_access_merchbuddy_tour(tour.id)
        ))
  );
$$;

revoke all on function public.has_merchbuddy_access(text) from public, anon;
revoke all on function public.has_merchbuddy_access_for_organisation(uuid, text) from public, anon;
revoke all on function public.has_merchbuddy_admin_access() from public, anon;
revoke all on function public.has_merchbuddy_admin_access_for_organisation(uuid) from public, anon;
revoke all on function public.can_access_merchbuddy_tour(uuid) from public, anon;
revoke all on function public.can_manage_merchbuddy_tour(uuid) from public, anon;
revoke all on function public.can_manage_merchbuddy_tour_definition(uuid) from public, anon;
revoke all on function public.can_access_merchbuddy_customer(uuid) from public, anon;
grant execute on function public.has_merchbuddy_access(text) to authenticated;
grant execute on function public.has_merchbuddy_access_for_organisation(uuid, text) to authenticated;
grant execute on function public.has_merchbuddy_admin_access() to authenticated;
grant execute on function public.has_merchbuddy_admin_access_for_organisation(uuid) to authenticated;
grant execute on function public.can_access_merchbuddy_tour(uuid) to authenticated;
grant execute on function public.can_manage_merchbuddy_tour(uuid) to authenticated;
grant execute on function public.can_manage_merchbuddy_tour_definition(uuid) to authenticated;
grant execute on function public.can_access_merchbuddy_customer(uuid) to authenticated;

alter table public.merchbuddy_customers enable row level security;
alter table public.merchbuddy_customer_contacts enable row level security;
alter table public.merchbuddy_customer_account_managers enable row level security;
alter table public.merchbuddy_tours enable row level security;
alter table public.merchbuddy_tour_users enable row level security;
alter table public.merchbuddy_products enable row level security;
alter table public.merchbuddy_product_variants enable row level security;
alter table public.merchbuddy_shows enable row level security;

grant select, insert, update on public.merchbuddy_customers, public.merchbuddy_customer_contacts, public.merchbuddy_tours, public.merchbuddy_products, public.merchbuddy_product_variants, public.merchbuddy_shows to authenticated;
grant select, insert, update, delete on public.merchbuddy_customer_account_managers, public.merchbuddy_tour_users to authenticated;

create policy "merchbuddy_customers_read" on public.merchbuddy_customers for select to authenticated using (public.can_access_merchbuddy_customer(id));
create policy "merchbuddy_customers_insert_write" on public.merchbuddy_customers for insert to authenticated with check (public.has_merchbuddy_access_for_organisation(organisation_id, 'write') and created_by = auth.uid());
create policy "merchbuddy_customers_update_write" on public.merchbuddy_customers for update to authenticated using (public.has_merchbuddy_access_for_organisation(organisation_id, 'write')) with check (public.has_merchbuddy_access_for_organisation(organisation_id, 'write'));

create policy "merchbuddy_customer_contacts_read" on public.merchbuddy_customer_contacts for select to authenticated using (public.can_access_merchbuddy_customer(customer_id));
create policy "merchbuddy_customer_contacts_insert_write" on public.merchbuddy_customer_contacts for insert to authenticated with check (public.has_merchbuddy_access_for_organisation((select customer.organisation_id from public.merchbuddy_customers customer where customer.id = customer_id), 'write'));
create policy "merchbuddy_customer_contacts_update_write" on public.merchbuddy_customer_contacts for update to authenticated using (public.has_merchbuddy_access_for_organisation((select customer.organisation_id from public.merchbuddy_customers customer where customer.id = customer_id), 'write')) with check (public.has_merchbuddy_access_for_organisation((select customer.organisation_id from public.merchbuddy_customers customer where customer.id = customer_id), 'write'));

create policy "merchbuddy_customer_account_managers_read" on public.merchbuddy_customer_account_managers for select to authenticated using (public.has_merchbuddy_access_for_organisation((select customer.organisation_id from public.merchbuddy_customers customer where customer.id = customer_id)));
create policy "merchbuddy_customer_account_managers_insert_admin" on public.merchbuddy_customer_account_managers for insert to authenticated with check (public.has_merchbuddy_admin_access_for_organisation((select customer.organisation_id from public.merchbuddy_customers customer where customer.id = customer_id)));
create policy "merchbuddy_customer_account_managers_update_admin" on public.merchbuddy_customer_account_managers for update to authenticated using (public.has_merchbuddy_admin_access_for_organisation((select customer.organisation_id from public.merchbuddy_customers customer where customer.id = customer_id))) with check (public.has_merchbuddy_admin_access_for_organisation((select customer.organisation_id from public.merchbuddy_customers customer where customer.id = customer_id)));
create policy "merchbuddy_customer_account_managers_delete_admin" on public.merchbuddy_customer_account_managers for delete to authenticated using (public.has_merchbuddy_admin_access_for_organisation((select customer.organisation_id from public.merchbuddy_customers customer where customer.id = customer_id)));

create policy "merchbuddy_tours_read" on public.merchbuddy_tours for select to authenticated using (public.can_access_merchbuddy_tour(id));
create policy "merchbuddy_tours_insert_write" on public.merchbuddy_tours for insert to authenticated with check (public.has_merchbuddy_access_for_organisation(organisation_id, 'write') and created_by = auth.uid());
create policy "merchbuddy_tours_update_manage" on public.merchbuddy_tours for update to authenticated using (public.can_manage_merchbuddy_tour_definition(id)) with check (public.can_manage_merchbuddy_tour_definition(id));

create policy "merchbuddy_tour_users_read" on public.merchbuddy_tour_users for select to authenticated using (public.can_access_merchbuddy_tour(tour_id));
create policy "merchbuddy_tour_users_insert_admin" on public.merchbuddy_tour_users for insert to authenticated with check (public.has_merchbuddy_admin_access_for_organisation((select tour.organisation_id from public.merchbuddy_tours tour where tour.id = tour_id)));
create policy "merchbuddy_tour_users_update_admin" on public.merchbuddy_tour_users for update to authenticated using (public.has_merchbuddy_admin_access_for_organisation((select tour.organisation_id from public.merchbuddy_tours tour where tour.id = tour_id))) with check (public.has_merchbuddy_admin_access_for_organisation((select tour.organisation_id from public.merchbuddy_tours tour where tour.id = tour_id)));
create policy "merchbuddy_tour_users_delete_admin" on public.merchbuddy_tour_users for delete to authenticated using (public.has_merchbuddy_admin_access_for_organisation((select tour.organisation_id from public.merchbuddy_tours tour where tour.id = tour_id)));

create policy "merchbuddy_products_read" on public.merchbuddy_products for select to authenticated using (public.can_access_merchbuddy_tour(tour_id));
create policy "merchbuddy_products_insert_manage" on public.merchbuddy_products for insert to authenticated with check (public.can_manage_merchbuddy_tour(tour_id));
create policy "merchbuddy_products_update_manage" on public.merchbuddy_products for update to authenticated using (public.can_manage_merchbuddy_tour(tour_id)) with check (public.can_manage_merchbuddy_tour(tour_id));

create policy "merchbuddy_product_variants_read" on public.merchbuddy_product_variants for select to authenticated using (public.can_access_merchbuddy_tour((select product.tour_id from public.merchbuddy_products product where product.id = product_id)));
create policy "merchbuddy_product_variants_insert_manage" on public.merchbuddy_product_variants for insert to authenticated with check (public.can_manage_merchbuddy_tour((select product.tour_id from public.merchbuddy_products product where product.id = product_id)));
create policy "merchbuddy_product_variants_update_manage" on public.merchbuddy_product_variants for update to authenticated using (public.can_manage_merchbuddy_tour((select product.tour_id from public.merchbuddy_products product where product.id = product_id))) with check (public.can_manage_merchbuddy_tour((select product.tour_id from public.merchbuddy_products product where product.id = product_id)));

create policy "merchbuddy_shows_read" on public.merchbuddy_shows for select to authenticated using (public.can_access_merchbuddy_tour(tour_id));
create policy "merchbuddy_shows_insert_manage" on public.merchbuddy_shows for insert to authenticated with check (public.can_manage_merchbuddy_tour(tour_id));
create policy "merchbuddy_shows_update_manage" on public.merchbuddy_shows for update to authenticated using (public.can_manage_merchbuddy_tour(tour_id)) with check (public.can_manage_merchbuddy_tour(tour_id));
