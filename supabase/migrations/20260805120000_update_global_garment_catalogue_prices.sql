-- Forward-only authoritative global garment catalogue update.
-- Existing rows are matched only by normalized code and colour. Product Type,
-- transitional garment type, active state, tags, and timestamps are preserved.

create temp table _authoritative_garment_catalogue (
  source_row text primary key,
  code text not null,
  alt_code text null,
  brand_name text not null,
  name text not null,
  colour text null,
  eur_base_price numeric(12,4) null,
  gbp_price numeric(12,4) null,
  extra_size_cost numeric(12,4) null,
  product_type_name text not null,
  garment_type text not null
) on commit drop;

insert into _authoritative_garment_catalogue (
  source_row, code, alt_code, brand_name, name, colour, eur_base_price, gbp_price,
  extra_size_cost, product_type_name, garment_type
)
values
  ('BB610/null', 'BB610', null, 'Beechfield', '5-panel snapback rapper cap', null, 2.7000, 2.1600, null, 'Baseball cap', 'OTHER'),
  ('W101/white-natural', 'W101', 'WM101', 'Westford Mill', 'Bag for life - long handles', 'White / Natural', 1.5000, 0.9900, null, 'Tote bags', 'OTHER'),
  ('BB653/null', 'BB653', 'BC653', 'Beechfield', 'Beechfield Low Profile 6 Panel Dad Cap', null, 3.2000, 2.4800, null, 'Baseball cap', 'OTHER'),
  ('5054/null', '5054', null, 'AS Colour', 'Block L/S Tee', null, 4.8000, 4.0500, null, 'Long sleeve tees', 'LONGSLEEVE'),
  ('5050/null', '5050', null, 'AS Colour', 'Block Tubular Tee', null, 3.2500, 2.5500, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('5171/null', '5171', null, 'AS Colour', 'Box Hood', null, 19.5500, 16.1500, null, 'Hoodies', 'HOODIE'),
  ('5031/null', '5031', null, 'AS Colour', 'Box L/S Tee', null, 8.9500, 5.9500, null, 'Long sleeve tees', 'LONGSLEEVE'),
  ('5030/null', '5030', null, 'AS Colour', 'Box Tee', null, 7.1500, 5.8000, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('5071/null', '5071', null, 'AS Colour', 'Classic L/S Tee', null, 8.4000, 5.9500, null, 'Long sleeve tees', 'LONGSLEEVE'),
  ('5026/null', '5026', null, 'AS Colour', 'Classic Tee', null, 6.5000, 5.3000, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('JH001/whites', 'JH001', null, 'AWDis', 'College hoodie', 'Whites', 9.5000, 7.2400, 1.5000, 'Hoodies', 'HOODIE'),
  ('JH001/colours', 'JH001', null, 'AWDis', 'College hoodie', 'colours', 9.5000, 8.2400, 1.5000, 'Hoodies', 'HOODIE'),
  ('STTU976/colours', 'STTU976', 'SX236', 'Stanley/Stella', 'Crafter Vintage', 'colours', 6.1800, 3.0400, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('STTU169/black-colours', 'STTU169', 'SX701', 'Stanley/Stella', 'Creator 2.0', 'Black & Colours', 4.4500, 3.5000, 0.9000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('STTU169/white', 'STTU169', 'SX701', 'Stanley/Stella', 'Creator 2.0', 'White', 4.1300, 2.3200, 1.0000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('JH011/null', 'JH011', null, 'AWDis', 'Epic Print Hoodie', null, 10.5000, 7.4600, 1.5000, 'Hoodies', 'HOODIE'),
  ('GD56/colours', 'GD56', '18000', 'Gildan', 'HEAVY SWEATSHIRT', 'Colours', 5.9000, 5.6700, 0.5000, 'Hoodies', 'HOODIE'),
  ('GD56/whites', 'GD56', '18000', 'Gildan', 'HEAVY SWEATSHIRT', 'Whites', 5.4000, 5.5100, 1.6500, 'Hoodies', 'HOODIE'),
  ('GD21/whites', 'GD21', 'H000', 'Gildan', 'Hammer Heavyweight T-Shirt', 'Whites', 2.6500, 2.5100, 1.0000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('GD21/colours', 'GD21', 'H000', 'Gildan', 'Hammer Heavyweight T-Shirt', 'Colours', 3.1500, 2.9800, 1.2000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('GD57/whites', 'GD57', '18500', 'Gildan', 'Heavy Blend Hooded Sweatshirt', 'Whites', 8.2500, 6.8800, 2.0000, 'Hoodies', 'HOODIE'),
  ('GD57/colours', 'GD57', '18500', 'Gildan', 'Heavy Blend Hooded Sweatshirt', 'Colours', 8.2500, 6.8800, 2.0000, 'Hoodies', 'HOODIE'),
  ('GD05/colours', 'GD05', '5000', 'Gildan', 'Heavy Cotton T-Shirt', 'Colours', 2.4000, 1.9600, 0.9000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('GD05/white-natural', 'GD05', '5000', 'Gildan', 'Heavy Cotton T-Shirt', 'White, Natural', 1.9500, 1.5700, 0.9000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('5145/null', '5145', null, 'AS Colour', 'Heavy Crew', null, 19.8000, 17.1500, null, 'Hoodies', 'HOODIE'),
  ('5083/null', '5083', null, 'AS Colour', 'Heavy Faded L/S Tee', null, 10.2000, 8.1500, null, 'Long sleeve tees', 'LONGSLEEVE'),
  ('5086/null', '5086', null, 'AS Colour', 'Heavy Faded Minus Tee [-5cm]', null, 7.7000, 6.4500, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('5082/null', '5082', null, 'AS Colour', 'Heavy Faded Tee', null, 7.7000, 6.4500, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('5146/null', '5146', null, 'AS Colour', 'Heavy Hood', null, 22.2500, 18.7000, null, 'Hoodies', 'HOODIE'),
  ('5081/null', '5081', null, 'AS Colour', 'Heavy L/S Tee', null, 10.2000, 8.1500, null, 'Long sleeve tees', 'LONGSLEEVE'),
  ('5080/null', '5080', null, 'AS Colour', 'Heavy Tee', null, 7.7000, 6.4500, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('BY102/null', 'BY102', null, 'Build Your Brand', 'Heavy oversized tee', null, 6.2500, 6.0500, 0.5000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('BB655/null', 'BB655', 'BC655', 'Beechfield', 'Low-profile vintage cap', null, 3.8100, 6.8300, null, 'Baseball cap', 'OTHER'),
  ('W265/null', 'W265', 'WM265', 'Westford Mill', 'Organic Premium Cotton Maxi Tote Bag', null, 3.6000, 2.8000, null, 'Tote bags', 'OTHER'),
  ('B652N/null', 'B652N', null, 'Beechfield', 'Organic cotton 6-panel dad cap', null, 4.2500, 2.9800, null, 'Baseball cap', 'OTHER'),
  ('BB45/null', 'BB45', 'BC45', 'Beechfield', 'Original cuffed beanie', null, 2.0000, 1.5600, null, 'Beanies', 'OTHER'),
  ('W606/null', 'W606', 'WM606', 'Westford Mill', 'Oversized heavy duty canvas tote bag', null, 7.1000, 5.6500, null, 'Tote bags', 'OTHER'),
  ('5165/null', '5165', null, 'AS Colour', 'Relax Faded Crew', null, 16.0500, 13.2500, null, 'Hoodies', 'HOODIE'),
  ('5166/null', '5166', null, 'AS Colour', 'Relax Faded Hood', null, 18.0500, 14.7000, null, 'Hoodies', 'HOODIE'),
  ('5161/null', '5161', null, 'AS Colour', 'Relax Hood', null, 16.9500, 13.9500, null, 'Hoodies', 'HOODIE'),
  ('GD01/colours', 'GD01', '64000', 'Gildan', 'SoftStyle Adult T-Shirt', 'Colours', 2.2500, 1.9600, 0.7000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('GD01/whites', 'GD01', '64000', 'Gildan', 'SoftStyle Adult T-Shirt', 'Whites', 1.8500, 1.5900, 0.6000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('5111/null', '5111', null, 'AS Colour', 'Standard Hood', null, 12.2500, 10.1500, null, 'Hoodies', 'HOODIE'),
  ('5001C/null', '5001C', null, 'AS Colour', 'Staple Camo Tee', null, 6.7000, 5.7000, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('5020/null', '5020', null, 'AS Colour', 'Staple L/S Tee', null, 6.6500, 5.4500, null, 'Long sleeve tees', 'LONGSLEEVE'),
  ('5020G/null', '5020G', null, 'AS Colour', 'Staple Organic L/S Tee', null, 6.9000, 5.6000, null, 'Long sleeve tees', 'LONGSLEEVE'),
  ('5040/null', '5040', null, 'AS Colour', 'Staple Stone Wash Tee', null, 7.8000, 6.3000, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('5001/null', '5001', null, 'AS Colour', 'Staple Tee', null, 4.7000, 3.9500, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('5102/null', '5102', null, 'AS Colour', 'Stencil Hood', null, 19.5500, 16.4500, null, 'Hoodies', 'HOODIE'),
  ('5085/null', '5085', null, 'AS Colour', 'Stone Wash Heavy Tee', null, 8.2500, 6.7000, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('GD14/colours', 'GD14', '2400', 'Gildan', 'Ultra Cotton Long Sleeve T-Shirt', 'Colours', 5.7000, 4.6400, 2.0000, 'Long sleeve tees', 'LONGSLEEVE'),
  ('GD14/whites', 'GD14', '2400', 'Gildan', 'Ultra Cotton Long Sleeve T-Shirt', 'Whites', 4.7000, 3.7100, 2.0000, 'Long sleeve tees', 'LONGSLEEVE'),
  ('GD02/whites', 'GD02', '2000', 'Gildan', 'Ultra Cotton T-Shirt', 'Whites', 2.3500, 2.1100, 1.1000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('GD02/colours', 'GD02', '2000', 'Gildan', 'Ultra Cotton T-Shirt', 'Colours', 2.8000, 2.5600, 1.1000, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('CV3001/colours', 'CV3001', '3001', 'Bella Canvas', 'Unisex Crew Neck T-Shirt', 'Colours', 4.8000, 3.4500, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('CV3001/whites', 'CV3001', null, 'Bella Canvas', 'Unisex Crew Neck T-Shirt', 'Whites', 4.8000, 3.4500, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('W101/colours', 'W101', 'WM101', 'Westford Mill', 'Westford Mill Bag For Life - Long Handles', 'Colours', 1.5000, 1.1900, null, 'Tote bags', 'OTHER'),
  ('4062/null', '4062', null, 'AS Colour', 'Wo''s Crop Tee', null, 4.4000, 3.6000, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('4089/null', '4089', null, 'AS Colour', 'Wo''s Heavy Faded Crop Tee', null, 7.6000, null, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('4064G/null', '4064G', null, 'AS Colour', 'Wo''s Organic Rib Crop Tank', null, 7.4500, 6.1500, null, 'Cotton T-shirt/Tank Top', 'TSHIRT'),
  ('JH050/null', 'JH050', null, 'AWDis', 'Zoodie', null, 11.8000, 10.1500, 1.5000, 'Hoodies', 'HOODIE');

create temp table _authoritative_garment_changes (
  source_row text not null,
  garment_id uuid not null,
  operation text not null check (operation in ('UPDATE', 'INSERT', 'DEACTIVATE')),
  primary key (source_row, operation)
) on commit drop;

do $$
begin
  if exists (
    select 1
    from _authoritative_garment_catalogue source
    join public.garments target
      on target.organisation_id is null
     and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.code), '\s+', ' ', 'g'))
     and (
       (source.colour is null and nullif(trim(coalesce(target.colour, '')), '') is null)
       or (
         source.colour is not null
         and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.colour), '\s+', ' ', 'g'))
       )
     )
    group by source.source_row
    having count(target.id) > 1
  ) then
    raise exception 'Authoritative garment catalogue migration aborted: a code-and-colour source row resolves to multiple global garments';
  end if;
end;
$$;

with matches as (
  select source.source_row, target.id as garment_id
  from _authoritative_garment_catalogue source
  join public.garments target
    on target.organisation_id is null
   and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.code), '\s+', ' ', 'g'))
   and (
     (source.colour is null and nullif(trim(coalesce(target.colour, '')), '') is null)
     or (
       source.colour is not null
       and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.colour), '\s+', ' ', 'g'))
     )
   )
), updated as (
  update public.garments target
  set alt_code = source.alt_code,
      brand_name = source.brand_name,
      name = source.name,
      colour = source.colour,
      eur_base_price = source.eur_base_price,
      gbp_price = source.gbp_price,
      extra_size_cost = source.extra_size_cost
  from _authoritative_garment_catalogue source
  join matches matched on matched.source_row = source.source_row
  where target.id = matched.garment_id
    and (target.alt_code, target.brand_name, target.name, target.colour,
         target.eur_base_price, target.gbp_price, target.extra_size_cost)
        is distinct from
        (source.alt_code, source.brand_name, source.name, source.colour,
         source.eur_base_price, source.gbp_price, source.extra_size_cost)
  returning source.source_row, target.id
)
insert into _authoritative_garment_changes (source_row, garment_id, operation)
select source_row, id, 'UPDATE'
from updated;

with resolved_product_types as (
  select source.source_row, (array_agg(product_type.id))[1] as product_type_id
  from _authoritative_garment_catalogue source
  join public.product_types product_type
    on product_type.is_active
   and lower(regexp_replace(trim(product_type.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.product_type_name), '\s+', ' ', 'g'))
  group by source.source_row
  having count(product_type.id) = 1
), inserted as (
  insert into public.garments (
    organisation_id, code, alt_code, brand_name, name, colour, garment_type, product_type_id,
    eur_base_price, gbp_price, extra_size_cost, tags
  )
  select null, source.code, source.alt_code, source.brand_name, source.name, source.colour,
         source.garment_type, resolved.product_type_id, source.eur_base_price, source.gbp_price,
         source.extra_size_cost, concat_ws(' ', source.code, source.alt_code, source.brand_name, source.name, source.colour)
  from _authoritative_garment_catalogue source
  join resolved_product_types resolved on resolved.source_row = source.source_row
  where not exists (
    select 1
    from public.garments target
    where target.organisation_id is null
      and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.code), '\s+', ' ', 'g'))
      and (
        (source.colour is null and nullif(trim(coalesce(target.colour, '')), '') is null)
        or (
          source.colour is not null
          and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.colour), '\s+', ' ', 'g'))
        )
      )
  )
  returning id, code, colour
)
insert into _authoritative_garment_changes (source_row, garment_id, operation)
select source.source_row, inserted.id, 'INSERT'
from inserted
join _authoritative_garment_catalogue source
  on lower(regexp_replace(trim(source.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(inserted.code), '\s+', ' ', 'g'))
 and (
   (source.colour is null and nullif(trim(coalesce(inserted.colour, '')), '') is null)
   or (
     source.colour is not null
     and lower(regexp_replace(trim(coalesce(inserted.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.colour), '\s+', ' ', 'g'))
   )
 );

do $$
begin
  if (
    select count(*)
    from public.garments target
    where target.organisation_id is null
      and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = 'b653'
      and nullif(trim(coalesce(target.colour, '')), '') is null
      and lower(regexp_replace(trim(coalesce(target.brand_name, '')), '\s+', ' ', 'g')) = 'beechfield'
      and lower(regexp_replace(trim(target.name), '\s+', ' ', 'g')) = 'beechfield low profile 6 panel dad cap'
  ) > 1 then
    raise exception 'Authoritative garment catalogue migration aborted: B653 legacy deactivation resolves to multiple global garments';
  end if;

  if (
    select count(*)
    from public.garments target
    where target.organisation_id is null
      and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = 'w101'
      and nullif(trim(coalesce(target.colour, '')), '') is null
  ) > 1 then
    raise exception 'Authoritative garment catalogue migration aborted: blank-colour W101 deactivation resolves to multiple global garments';
  end if;

  if (
    select count(*)
    from public.garments target
    where target.organisation_id is null
      and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = 'gd05'
      and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = 'whites'
  ) > 1 then
    raise exception 'Authoritative garment catalogue migration aborted: GD05 Whites deactivation resolves to multiple global garments';
  end if;
end;
$$;

with deactivated as (
  update public.garments target
  set is_active = false
  where target.organisation_id is null
    and target.is_active
    and (
      (
        lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = 'b653'
        and nullif(trim(coalesce(target.colour, '')), '') is null
        and lower(regexp_replace(trim(coalesce(target.brand_name, '')), '\s+', ' ', 'g')) = 'beechfield'
        and lower(regexp_replace(trim(target.name), '\s+', ' ', 'g')) = 'beechfield low profile 6 panel dad cap'
      )
      or (
        lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = 'w101'
        and nullif(trim(coalesce(target.colour, '')), '') is null
      )
      or (
        lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = 'gd05'
        and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = 'whites'
      )
    )
  returning target.id,
    case
      when lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = 'b653' then 'B653/legacy'
      when lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = 'w101' then 'W101/blank-colour-legacy'
      else 'GD05/whites-legacy'
    end as source_row
)
insert into _authoritative_garment_changes (source_row, garment_id, operation)
select source_row, id, 'DEACTIVATE'
from deactivated;

do $$
declare
  skipped record;
begin
  for skipped in
    select source.source_row
    from _authoritative_garment_catalogue source
    where not exists (
      select 1
      from public.garments target
      where target.organisation_id is null
        and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.code), '\s+', ' ', 'g'))
        and (
          (source.colour is null and nullif(trim(coalesce(target.colour, '')), '') is null)
          or (
            source.colour is not null
            and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.colour), '\s+', ' ', 'g'))
          )
        )
    )
    and (
      select count(*)
      from public.product_types product_type
      where product_type.is_active
        and lower(regexp_replace(trim(product_type.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.product_type_name), '\s+', ' ', 'g'))
    ) <> 1
  loop
    raise warning 'Authoritative garment catalogue row % was not inserted because its Product Type could not be resolved uniquely', skipped.source_row;
  end loop;

  raise notice 'Authoritative garment catalogue migration: % rows updated, % rows inserted, % rows deactivated',
    (select count(*) from _authoritative_garment_changes where operation = 'UPDATE'),
    (select count(*) from _authoritative_garment_changes where operation = 'INSERT'),
    (select count(*) from _authoritative_garment_changes where operation = 'DEACTIVATE');
end;
$$;
