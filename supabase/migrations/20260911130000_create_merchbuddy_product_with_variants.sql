-- Product and variant creation must be one database transaction. This migration
-- follows the Band-first authorization cutover by delegating Tour management to
-- the canonical helper rather than deriving permissions from organisation access.
create or replace function public.create_merchbuddy_product_with_variants(
  p_tour_id uuid,
  p_name text,
  p_sale_price numeric,
  p_variants jsonb
)
returns table (
  product jsonb,
  variants jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
  v_product_name text := regexp_replace(btrim(p_name), '\s+', ' ', 'g');
  v_product public.merchbuddy_products%rowtype;
  v_variants jsonb;
begin
  if v_caller_id is null then
    raise exception 'Authentication is required to create products.' using errcode = '42501';
  end if;

  if p_tour_id is null then
    raise exception 'A tour is required to create a product.' using errcode = '22023';
  end if;

  if not public.can_manage_merchbuddy_tour_definition(p_tour_id) then
    raise exception 'You do not have permission to create products for this tour.' using errcode = '42501';
  end if;

  -- Product creation is intentionally unavailable for inactive Bands, even when
  -- an old Tour assignment would otherwise be readable by the caller.
  if not exists (
    select 1
    from public.merchbuddy_tours as tour
    join public.merchbuddy_customers as band on band.id = tour.customer_id
    where tour.id = p_tour_id
      and band.status = 'active'
  ) then
    raise exception 'Products can only be created for an active Band.' using errcode = '23514';
  end if;

  if v_product_name is null or v_product_name = '' then
    raise exception 'Product name is required.' using errcode = '22023';
  end if;

  if p_sale_price is not null and (
    p_sale_price = 'NaN'::numeric
    or p_sale_price < 0
    or p_sale_price > 9999999999.99
    or p_sale_price <> trunc(p_sale_price, 2)
  ) then
    raise exception 'Sale price must be a non-negative amount with up to two decimal places.' using errcode = '22023';
  end if;

  if p_variants is null
    or jsonb_typeof(p_variants) <> 'array'
    or jsonb_array_length(p_variants) = 0 then
    raise exception 'At least one variant is required.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_variants) as input(item)
    where jsonb_typeof(input.item) <> 'object'
      or regexp_replace(btrim(input.item ->> 'name'), '\s+', ' ', 'g') is null
      or regexp_replace(btrim(input.item ->> 'name'), '\s+', ' ', 'g') = ''
      or jsonb_typeof(input.item -> 'starting_quantity') <> 'number'
      or (input.item ->> 'starting_quantity') !~ '^[0-9]+$'
      or case
        when (input.item ->> 'starting_quantity') ~ '^[0-9]+$'
          then (input.item ->> 'starting_quantity')::numeric > 2147483647
        else false
      end
  ) then
    raise exception 'Each variant requires a non-blank name and a non-negative whole-number starting quantity.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from (
      select lower(regexp_replace(btrim(input.item ->> 'name'), '\s+', ' ', 'g')) as normalized_name
      from jsonb_array_elements(p_variants) as input(item)
    ) as names
    group by normalized_name
    having count(*) > 1
  ) then
    raise exception 'Variant names must be unique within a product.' using errcode = '23505';
  end if;

  insert into public.merchbuddy_products (tour_id, name, sale_price)
  values (p_tour_id, v_product_name, p_sale_price)
  returning * into v_product;

  with variant_inputs as (
    select
      regexp_replace(btrim(input.item ->> 'name'), '\s+', ' ', 'g') as name,
      (input.item ->> 'starting_quantity')::integer as starting_quantity,
      (input.ordinality - 1)::integer as sort_order
    from jsonb_array_elements(p_variants) with ordinality as input(item, ordinality)
  ), inserted_variants as (
    insert into public.merchbuddy_product_variants (product_id, name, starting_quantity, sort_order)
    select v_product.id, name, starting_quantity, sort_order
    from variant_inputs
    order by sort_order
    returning *
  )
  select coalesce(jsonb_agg(to_jsonb(inserted_variants) order by inserted_variants.sort_order), '[]'::jsonb)
  into v_variants
  from inserted_variants;

  return query
  select to_jsonb(v_product), v_variants;
end;
$$;

revoke all on function public.create_merchbuddy_product_with_variants(uuid, text, numeric, jsonb) from public;
grant execute on function public.create_merchbuddy_product_with_variants(uuid, text, numeric, jsonb) to authenticated;
