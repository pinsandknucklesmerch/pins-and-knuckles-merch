-- Temporary generic hoodie fallback for workbook rows without reliable material data.
-- The HOODIE pricing category continues to use the existing profile-driven garment markup.

insert into public.product_types (name, commodity_code, pricing_category, is_active)
select 'Hoodies', '6110', 'HOODIE', true
where not exists (
  select 1
  from public.product_types product_type
  where product_type.is_active
    and lower(regexp_replace(trim(product_type.name), '\s+', ' ', 'g')) = 'hoodies'
);

-- The calculator markup key is garment_type, not Product Type ID. This preserves the
-- established EU US Clients HOODIE markup and intentionally leaves EU Standard and UK Trade alone.
insert into public.calculator_garment_markups (
  organisation_id,
  calculator_profile_id,
  garment_type,
  markup_value
)
select null, profile.id, 'HOODIE', 4.0000
from public.calculator_profiles profile
where profile.organisation_id is null
  and profile.code = 'EU_US_CLIENTS'
  and profile.region = 'EU'
  and profile.currency_code = 'EUR'
  and profile.is_active
  and not exists (
    select 1
    from public.calculator_garment_markups markup
    where markup.calculator_profile_id = profile.id
      and markup.garment_type = 'HOODIE'
      and markup.is_active
  );

create temp table _generic_hoodie_import (
  source_row text primary key,
  code text not null,
  alt_code text null,
  brand_name text not null,
  name text not null,
  colour text null,
  eur_base_price numeric(12,4) not null,
  gbp_price numeric(12,4) null,
  extra_size_cost numeric(12,4) null,
  tags text null,
  match_strategy text not null check (match_strategy in ('EXACT_IDENTITY', 'SAFE_CODE_BRAND_COLOUR'))
) on commit drop;

insert into _generic_hoodie_import (
  source_row, code, alt_code, brand_name, name, colour, eur_base_price, gbp_price,
  extra_size_cost, tags, match_strategy
)
values
  ('Garments!7', '5171', null, 'AS Colour', 'Box Hood', null, 19.55, 16.15, null, '5171box hood', 'EXACT_IDENTITY'),
  ('Garments!12', 'JH001', null, 'AWDis', 'College hoodie', 'Whites', 9.5, 7.24, 1.5, 'AWDishoodiewhitecollegeJH001', 'SAFE_CODE_BRAND_COLOUR'),
  ('Garments!13', 'JH001', null, 'AWDis', 'College hoodie', 'colours', 9.5, 8.24, 1.5, 'AWDisJH001College', 'SAFE_CODE_BRAND_COLOUR'),
  ('Garments!17', 'JH011', null, 'AWDis', 'Epic Print Hoodie', null, 10.5, 7.46, 1.5, 'HoodieAWDisepic printJH011', 'EXACT_IDENTITY'),
  ('Garments!18', 'GD56', '18000', 'Gildan', 'HEAVY SWEATSHIRT', 'Colours', 5.9, 5.67, 0.5, 'GildansweatshirtblackGD5618000', 'SAFE_CODE_BRAND_COLOUR'),
  ('Garments!19', 'GD56', '18000', 'Gildan', 'HEAVY SWEATSHIRT', 'Whites', 5.4, 5.51, 1.65, 'GildansweatshirtwhiteGD5618000', 'SAFE_CODE_BRAND_COLOUR'),
  ('Garments!22', 'GD57', '18500', 'Gildan', 'Heavy Blend Hooded Sweatshirt', 'Whites', 8.25, 6.88, 2, 'GildanhoodiewhiteGD5718500', 'SAFE_CODE_BRAND_COLOUR'),
  ('Garments!23', 'GD57', '18500', 'Gildan', 'Heavy Blend Hooded Sweatshirt', 'Colours', 8.25, 6.88, 2, 'GD5718500GILDAN HEAVY HOODIEHOODIEHEAVY', 'SAFE_CODE_BRAND_COLOUR'),
  ('Garments!26', '5145', null, 'AS Colour', 'Heavy Crew', null, 19.8, 17.15, null, '5145sweaterheavy crew', 'EXACT_IDENTITY'),
  ('Garments!30', '5146', null, 'AS Colour', 'Heavy Hood', null, 22.25, 18.7, null, '5146heavy hood', 'EXACT_IDENTITY'),
  ('Garments!39', '5165', null, 'AS Colour', 'Relax Faded Crew', null, 16.05, 13.25, null, '5165relax faded crewfadedfaded sweater', 'EXACT_IDENTITY'),
  ('Garments!40', '5166', null, 'AS Colour', 'Relax Faded Hood', null, 18.05, 14.7, null, '5166relax faded hood', 'EXACT_IDENTITY'),
  ('Garments!41', '5161', null, 'AS Colour', 'Relax Hood', null, 16.95, 13.95, null, '5161relax hoodhoodie', 'EXACT_IDENTITY'),
  ('Garments!44', '5111', null, 'AS Colour', 'Standard Hood', null, 12.25, 10.15, null, '5111Standard hoodie', 'EXACT_IDENTITY'),
  ('Garments!50', '5102', null, 'AS Colour', 'Stencil Hood', null, 19.55, 16.45, null, '5102stencil hood', 'EXACT_IDENTITY'),
  ('Garments!62', 'JH050', null, 'AWDis', 'Zoodie', null, 11.8, 10.15, 1.5, 'AWDisJH050Zip HoodieZoodie', 'EXACT_IDENTITY');

create temp table _generic_hoodie_matches as
with candidates as (
  select source.source_row, target.id as garment_id,
         count(target.id) over (partition by source.source_row) as candidate_count
  from _generic_hoodie_import source
  join public.garments target
    on target.organisation_id is null
   and target.is_active
   and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.code), '\s+', ' ', 'g'))
   and lower(regexp_replace(trim(coalesce(target.brand_name, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.brand_name), '\s+', ' ', 'g'))
   and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(source.colour, '')), '\s+', ' ', 'g'))
   and (
     source.match_strategy = 'SAFE_CODE_BRAND_COLOUR'
     or lower(regexp_replace(trim(target.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.name), '\s+', ' ', 'g'))
   )
)
select source_row, garment_id
from candidates
where candidate_count = 1;

-- A matched existing row retains its import identity and all price fields. Only the
-- classification is synchronized, and a specific hoodie Product Type is never replaced.
update public.garments target
set product_type_id = generic_hoodies.id,
    garment_type = generic_hoodies.pricing_category
from _generic_hoodie_matches matched
join public.product_types generic_hoodies
  on generic_hoodies.is_active
 and lower(regexp_replace(trim(generic_hoodies.name), '\s+', ' ', 'g')) = 'hoodies'
where target.id = matched.garment_id
  and not exists (
    select 1
    from public.product_types existing_type
    where existing_type.id = target.product_type_id
      and existing_type.is_active
      and lower(regexp_replace(trim(existing_type.name), '\s+', ' ', 'g')) in ('hoodies - cotton', 'hoodies - poly / cotton')
  )
  and (target.product_type_id, target.garment_type)
      is distinct from (generic_hoodies.id, generic_hoodies.pricing_category);

-- Insert only source identities for which no single safe existing row was found.
insert into public.garments (
  organisation_id, code, alt_code, brand_name, name, colour, garment_type, product_type_id,
  eur_base_price, gbp_price, extra_size_cost, tags, is_active
)
select null, source.code, source.alt_code, source.brand_name, source.name, source.colour,
       generic_hoodies.pricing_category, generic_hoodies.id, source.eur_base_price,
       source.gbp_price, source.extra_size_cost, source.tags, true
from _generic_hoodie_import source
join public.product_types generic_hoodies
  on generic_hoodies.is_active
 and lower(regexp_replace(trim(generic_hoodies.name), '\s+', ' ', 'g')) = 'hoodies'
where not exists (
  select 1
  from _generic_hoodie_matches matched
  where matched.source_row = source.source_row
)
and not exists (
  select 1
  from public.garments target
  where target.organisation_id is null
    and target.is_active
    and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.code), '\s+', ' ', 'g'))
    and lower(regexp_replace(trim(coalesce(target.brand_name, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.brand_name), '\s+', ' ', 'g'))
    and lower(regexp_replace(trim(target.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.name), '\s+', ' ', 'g'))
    and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(source.colour, '')), '\s+', ' ', 'g'))
);

do $$
begin
  if (select count(*) from public.product_types where is_active and lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = 'hoodies') <> 1 then
    raise exception 'Generic Hoodies Product Type assertion failed: expected exactly one active row';
  end if;

  if (
    select count(*)
    from public.calculator_garment_markups markup
    join public.calculator_profiles profile on profile.id = markup.calculator_profile_id
    where profile.code = 'EU_US_CLIENTS'
      and profile.region = 'EU'
      and profile.currency_code = 'EUR'
      and profile.is_active
      and markup.garment_type = 'HOODIE'
      and markup.markup_value = 4.0000
      and markup.is_active
      and markup.valid_from <= current_date
      and (markup.valid_to is null or markup.valid_to >= current_date)
  ) <> 1 then
    raise exception 'EU US Clients hoodie markup assertion failed: expected exactly one applicable EUR 4.00 row';
  end if;

  if (
    select count(*)
    from public.garments garment
    join public.product_types product_type on product_type.id = garment.product_type_id
    where garment.organisation_id is null
      and garment.is_active
      and lower(regexp_replace(trim(product_type.name), '\s+', ' ', 'g')) = 'hoodies'
      and garment.garment_type = 'HOODIE'
  ) <> 16 then
    raise exception 'Generic Hoodies garment assertion failed: expected 16 active hoodie mappings';
  end if;

  if exists (
    select 1
    from public.garments garment
    where garment.organisation_id is null
      and garment.is_active
    group by lower(regexp_replace(trim(garment.code), '\s+', ' ', 'g')),
             lower(regexp_replace(trim(coalesce(garment.brand_name, '')), '\s+', ' ', 'g')),
             lower(regexp_replace(trim(garment.name), '\s+', ' ', 'g')),
             lower(regexp_replace(trim(coalesce(garment.colour, '')), '\s+', ' ', 'g'))
    having count(*) > 1
  ) then
    raise exception 'Generic Hoodies garment assertion failed: duplicate normalized active garment identity';
  end if;
end;
$$;
