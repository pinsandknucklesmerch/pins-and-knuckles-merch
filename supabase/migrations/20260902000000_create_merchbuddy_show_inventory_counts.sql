create table public.merchbuddy_show_inventory_counts (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.merchbuddy_shows(id) on delete restrict,
  variant_id uuid not null references public.merchbuddy_product_variants(id) on delete restrict,
  count_in_quantity integer,
  count_out_quantity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint merchbuddy_show_inventory_counts_show_variant_key unique (show_id, variant_id),
  constraint merchbuddy_show_inventory_counts_count_in_nonnegative check (count_in_quantity is null or count_in_quantity >= 0),
  constraint merchbuddy_show_inventory_counts_count_out_nonnegative check (count_out_quantity is null or count_out_quantity >= 0),
  constraint merchbuddy_show_inventory_counts_count_out_requires_count_in check (count_out_quantity is null or count_in_quantity is not null),
  constraint merchbuddy_show_inventory_counts_count_out_not_above_count_in check (count_in_quantity is null or count_out_quantity is null or count_out_quantity <= count_in_quantity)
);

create or replace function public.merchbuddy_validate_show_inventory_count_tour()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.merchbuddy_shows as show_row
    join public.merchbuddy_product_variants as variant_row on variant_row.id = new.variant_id
    join public.merchbuddy_products as product_row
      on product_row.id = variant_row.product_id
     and product_row.tour_id = show_row.tour_id
    where show_row.id = new.show_id
  ) then
    raise exception 'Show and product variant must belong to the same tour';
  end if;
  return new;
end;
$$;

revoke all on function public.merchbuddy_validate_show_inventory_count_tour() from public, anon;
grant execute on function public.merchbuddy_validate_show_inventory_count_tour() to authenticated;

create trigger merchbuddy_show_inventory_counts_validate_tour
before insert or update of show_id, variant_id on public.merchbuddy_show_inventory_counts
for each row execute function public.merchbuddy_validate_show_inventory_count_tour();

create or replace function public.merchbuddy_set_show_inventory_count_updated_by()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

revoke all on function public.merchbuddy_set_show_inventory_count_updated_by() from public, anon;
grant execute on function public.merchbuddy_set_show_inventory_count_updated_by() to authenticated;

create trigger merchbuddy_show_inventory_counts_set_updated_by
before insert or update on public.merchbuddy_show_inventory_counts
for each row execute function public.merchbuddy_set_show_inventory_count_updated_by();

create trigger merchbuddy_show_inventory_counts_set_updated_at
before update on public.merchbuddy_show_inventory_counts
for each row execute function public.set_updated_at();

alter table public.merchbuddy_show_inventory_counts enable row level security;

grant select, insert, update on public.merchbuddy_show_inventory_counts to authenticated;

create policy "merchbuddy_show_inventory_counts_read"
on public.merchbuddy_show_inventory_counts
for select to authenticated
using (
  exists (
    select 1
    from public.merchbuddy_shows as show_row
    where show_row.id = merchbuddy_show_inventory_counts.show_id
      and public.can_access_merchbuddy_tour(show_row.tour_id)
  )
);

create policy "merchbuddy_show_inventory_counts_insert_manage"
on public.merchbuddy_show_inventory_counts
for insert to authenticated
with check (
  exists (
    select 1
    from public.merchbuddy_shows as show_row
    where show_row.id = merchbuddy_show_inventory_counts.show_id
      and public.can_manage_merchbuddy_tour(show_row.tour_id)
  )
);

create policy "merchbuddy_show_inventory_counts_update_manage"
on public.merchbuddy_show_inventory_counts
for update to authenticated
using (
  exists (
    select 1
    from public.merchbuddy_shows as show_row
    where show_row.id = merchbuddy_show_inventory_counts.show_id
      and public.can_manage_merchbuddy_tour(show_row.tour_id)
  )
)
with check (
  exists (
    select 1
    from public.merchbuddy_shows as show_row
    where show_row.id = merchbuddy_show_inventory_counts.show_id
      and public.can_manage_merchbuddy_tour(show_row.tour_id)
  )
);
