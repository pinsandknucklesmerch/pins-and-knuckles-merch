-- Approved Product Type and READY garment import.
-- Expected source counts: 42 Product Types; 45 READY garment rows; 19 EXACT_IDENTITY updates;
-- 11 NO_MATCH inserts; 15 NEAR_MATCH rows intentionally skipped; 16 REVIEW_REQUIRED hoodie rows intentionally deferred.
-- The 16 deferred hoodies are not staged here, so this migration never guesses cotton or poly/cotton Product Types.

alter table public.garments
  alter column alt_code drop not null,
  alter column brand_name drop not null,
  alter column colour drop not null,
  alter column tags drop not null;

create temp table _product_type_import (
  name text not null,
  commodity_code text not null,
  pricing_category text not null,
  is_active boolean not null,
  source_row text not null,
  notes text null
) on commit drop;

insert into _product_type_import (name, commodity_code, pricing_category, is_active, source_row, notes)
values
  ('Baseball cap', '6505 00 30 00', 'OTHER', true, 'Commodity Codes!2', null),
  ('Bath robe - cotton', '61072100', 'OTHER', true, 'Commodity Codes!3', null),
  ('Beanies', '65050090', 'OTHER', true, 'Commodity Codes!4', null),
  ('CD / DVD', '85238090', 'OTHER', true, 'Commodity Codes!5', null),
  ('Ceramic mug', '69120021', 'OTHER', true, 'Commodity Codes!6', null),
  ('Cotton patch', '93039100', 'OTHER', true, 'Commodity Codes!7', null),
  ('Cotton T-shirt/Tank Top', '61091000', 'TSHIRT', true, 'Commodity Codes!8', null),
  ('Cotton Trousers', '61046200', 'OTHER', true, 'Commodity Codes!9', null),
  ('Enamel badge', '71179000', 'OTHER', true, 'Commodity Codes!10', null),
  ('Flag', '63079098', 'OTHER', true, 'Commodity Codes!11', null),
  ('Guitar pick', '92099200', 'OTHER', true, 'Commodity Codes!12', null),
  ('Hoodies - cotton', '61102091', 'HOODIE', true, 'Commodity Codes!13', null),
  ('Hoodies - poly / cotton', '61103091', 'HOODIE', true, 'Commodity Codes!14', null),
  ('Jacket', '61032300', 'OTHER', true, 'Commodity Codes!15', null),
  ('Long sleeve tees', '61102010', 'LONGSLEEVE', true, 'Commodity Codes!16', null),
  ('Metal charm / necklace', '71779000', 'OTHER', true, 'Commodity Codes!17', null),
  ('Metal keyrings', '73261990', 'OTHER', true, 'Commodity Codes!18', null),
  ('Metal pin badge set', '73261990', 'OTHER', true, 'Commodity Codes!19', null),
  ('Notepad', '48026900', 'OTHER', true, 'Commodity Codes!20', null),
  ('Pen', '96081000', 'OTHER', true, 'Commodity Codes!21', null),
  ('Pencil set', '96091010', 'OTHER', true, 'Commodity Codes!22', null),
  ('Phone grip', '93028990', 'OTHER', true, 'Commodity Codes!23', null),
  ('Plastic lanyards', '39261000', 'OTHER', true, 'Commodity Codes!24', null),
  ('Posters', '49019100', 'OTHER', true, 'Commodity Codes!25', null),
  ('Programmes', '49019100', 'OTHER', true, 'Commodity Codes!26', null),
  ('Ring / bracelet', '71179000', 'OTHER', true, 'Commodity Codes!27', null),
  ('Scarf - cotton', '61179000', 'OTHER', true, 'Commodity Codes!28', null),
  ('Socks - cotton', '61159500', 'OTHER', true, 'Commodity Codes!29', null),
  ('Tea towel', '63025100', 'OTHER', true, 'Commodity Codes!30', null),
  ('Tote bags', '63052000', 'OTHER', true, 'Commodity Codes!31', null),
  ('Vest', '61091000', 'TSHIRT', true, 'Commodity Codes!32', 'Pricing category confirmed as TSHIRT.'),
  ('Vinyl', '85238090', 'OTHER', true, 'Commodity Codes!33', null),
  ('Water bottle', '70109043', 'OTHER', true, 'Commodity Codes!34', null),
  ('Wristbands - fabric', '61169900', 'OTHER', true, 'Commodity Codes!35', null),
  ('Wristbands - rubber', '40159000', 'OTHER', true, 'Commodity Codes!36', null),
  ('Skateboards', '9506 70 30', 'OTHER', true, 'Commodity Codes!37', null),
  ('Woven Patches', '5807 10 10', 'OTHER', true, 'Commodity Codes!38', null),
  ('Embroidered Patches', '5810 99 90', 'OTHER', true, 'Commodity Codes!39', null),
  ('Sunglasses with Plastic Lenses (Not optically worked)', '9004 10 91', 'OTHER', true, 'Commodity Codes!40-41', 'Includes the following workbook note: (Not optically worked).'),
  ('Silk Bandanas/Scarves', '6214 10 00', 'OTHER', true, 'Commodity Codes!42', null),
  ('Cotton Bandanas/Scarves', '6214 30 00', 'OTHER', true, 'Commodity Codes!43', null),
  ('Sweat Shorts', '62034290', 'OTHER', true, 'Commodity Codes!44', null);

-- Active names are compared using the same normalized form as the partial unique index.
insert into public.product_types (name, commodity_code, pricing_category, is_active)
select source.name, source.commodity_code, source.pricing_category, source.is_active
from _product_type_import source
where not exists (
  select 1
  from public.product_types target
  where target.is_active
    and lower(regexp_replace(trim(target.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.name), '\s+', ' ', 'g'))
);

create temp table _ready_garment_import (
  source_row text primary key,
  code text not null,
  alt_code text null,
  brand_name text null,
  name text not null,
  colour text null,
  product_type_name text not null,
  garment_type text not null,
  eur_base_price numeric(12,4) null,
  gbp_price numeric(12,4) null,
  extra_size_cost numeric(12,4) null,
  tags text null,
  match_type text not null check (match_type in ('EXACT_IDENTITY', 'NEAR_MATCH', 'NO_MATCH'))
) on commit drop;

insert into _ready_garment_import (
  source_row, code, alt_code, brand_name, name, colour, product_type_name, garment_type,
  eur_base_price, gbp_price, extra_size_cost, tags, match_type
)
values
  ('Garments!2', 'BB610', null, 'Beechfield', '5-panel snapback rapper cap', null, 'Baseball cap', 'OTHER', 2.7, 2.16, null, 'cap5 panelrapper capsnapback', 'NO_MATCH'),
  ('Garments!3', 'W101', 'WM101', 'Westford Mill', 'Bag for life - long handles', 'White / Natural', 'Tote bags', 'OTHER', 1.5, 0.99, null, 'W101WM101Tote', 'NEAR_MATCH'),
  ('Garments!4', 'BB653', 'BC653', 'Beechfield', 'Beechfield Low Profile 6 Panel Dad Cap', null, 'Baseball cap', 'OTHER', 3.2, 2.48, null, 'bb653beechfieldcapdad capBC653', 'NEAR_MATCH'),
  ('Garments!5', '5054', null, 'AS Colour', 'Block L/S Tee', null, 'Long sleeve tees', 'LONGSLEEVE', 4.8, 4.05, null, '5054. blocklong sleeve', 'EXACT_IDENTITY'),
  ('Garments!6', '5050', null, 'AS Colour', 'Block Tubular Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 3.25, 2.55, null, '5050Block Tubular Tee', 'EXACT_IDENTITY'),
  ('Garments!8', '5031', null, 'AS Colour', 'Box L/S Tee', null, 'Long sleeve tees', 'LONGSLEEVE', 8.95, 5.95, null, '5031. boxlong sleeve', 'EXACT_IDENTITY'),
  ('Garments!9', '5030', null, 'AS Colour', 'Box Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 7.15, 5.8, null, 'Box TeeAS Colour5030', 'EXACT_IDENTITY'),
  ('Garments!10', '5071', null, 'AS Colour', 'Classic L/S Tee', null, 'Long sleeve tees', 'LONGSLEEVE', 8.4, 5.95, null, '5071Classiclong sleeve', 'EXACT_IDENTITY'),
  ('Garments!11', '5026', null, 'AS Colour', 'Classic Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 6.5, 5.3, null, '5026AS Colourclassic tee', 'EXACT_IDENTITY'),
  ('Garments!14', 'STTU976', 'SX236', 'Stanley Stella', 'Crafter Vintage', 'colours', 'Cotton T-shirt/Tank Top', 'TSHIRT', 6.18, 3.04, null, 'STTU976SX236teevintage tee', 'NO_MATCH'),
  ('Garments!15', 'STTU169', 'SX701', 'Stanley/Stella', 'Creator 2.0', 'Black & Colours', 'Cotton T-shirt/Tank Top', 'TSHIRT', 4.45, 3.5, 0.9, 'creator iconic t-shirtcreatororganic cotton', 'NO_MATCH'),
  ('Garments!16', 'STTU169', 'SX701', 'Stanley/Stella', 'Creator 2.0', 'White', 'Cotton T-shirt/Tank Top', 'TSHIRT', 4.13, 2.32, 1, 'creator iconic t-shirtcreatororganic cotton', 'NO_MATCH'),
  ('Garments!20', 'GD21', 'H000', 'Gildan', 'Hammer Heavyweight T-Shirt', 'Whites', 'Cotton T-shirt/Tank Top', 'TSHIRT', 2.65, 2.51, 1, 'GildanteewhiteGD21H000', 'NEAR_MATCH'),
  ('Garments!21', 'GD21', 'H000', 'Gildan', 'Hammer Heavyweight T-Shirt', 'Colours', 'Cotton T-shirt/Tank Top', 'TSHIRT', 3.15, 2.98, 1.2, 'GildanteeblackHAMMERH000GD21', 'NEAR_MATCH'),
  ('Garments!24', 'GD05', '5000', 'Gildan', 'Heavy Cotton T-Shirt', 'Colours', 'Cotton T-shirt/Tank Top', 'TSHIRT', 2.4, 1.96, 0.9, 'GildanteeblackHEAVYGD055000', 'NEAR_MATCH'),
  ('Garments!25', 'GD05', '5000', 'Gildan', 'Heavy Cotton T-Shirt', 'White, Natural', 'Cotton T-shirt/Tank Top', 'TSHIRT', 1.95, 1.57, 0.9, 'GildanteewhiteGD055000HEAVY', 'NEAR_MATCH'),
  ('Garments!27', '5083', null, 'AS Colour', 'Heavy Faded L/S Tee', null, 'Long sleeve tees', 'LONGSLEEVE', 10.2, 8.15, null, '5083Fadedfaded long sleeve', 'EXACT_IDENTITY'),
  ('Garments!28', '5086', null, 'AS Colour', 'Heavy Faded Minus Tee [-5cm]', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 7.7, 6.45, null, '5086Heavy Faded Minus Tee [-5cm]fadedminus', 'EXACT_IDENTITY'),
  ('Garments!29', '5082', null, 'AS Colour', 'Heavy Faded Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 7.7, 6.45, null, '5082Heavy Faded Teefaded', 'EXACT_IDENTITY'),
  ('Garments!31', '5081', null, 'AS Colour', 'Heavy L/S Tee', null, 'Long sleeve tees', 'LONGSLEEVE', 10.2, 8.15, null, '5081long sleeve', 'EXACT_IDENTITY'),
  ('Garments!32', '5080', null, 'AS Colour', 'Heavy Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 7.7, 6.45, null, '5080Heavy Tee', 'EXACT_IDENTITY'),
  ('Garments!33', 'BY102', null, 'Build Your Brand', 'Heavy oversized tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 6.25, 6.05, 0.5, 'Oversized tee', 'NO_MATCH'),
  ('Garments!34', 'BB655', 'BC655', 'Beechfield', 'Low-profile vintage cap', null, 'Baseball cap', 'OTHER', 3.81, 6.83, null, 'B655capvintage cap', 'NO_MATCH'),
  ('Garments!35', 'W265', 'WM265', 'Westford Mill', 'Organic Premium Cotton Maxi Tote Bag', null, 'Tote bags', 'OTHER', 3.6, 2.8, null, 'Westford MilltoteW265WM265', 'NEAR_MATCH'),
  ('Garments!36', 'B652N', null, 'Beechfield', 'Organic cotton 6-panel dad cap', null, 'Baseball cap', 'OTHER', 4.25, 2.98, null, 'Caporganic cap6 paneldad cap', 'NO_MATCH'),
  ('Garments!37', 'BB45', 'BC45', 'Beechfield', 'Original cuffed beanie', null, 'Beanies', 'OTHER', 2, 1.56, null, 'BeaniebeechfieldBB45BC45', 'EXACT_IDENTITY'),
  ('Garments!38', 'W606', 'WM606', 'Westford Mills', 'Oversized heavy duty canvas tote bag', null, 'Tote bags', 'OTHER', 7.1, 5.65, null, 'Toteoversized toteheavy tote', 'NO_MATCH'),
  ('Garments!42', 'GD01', '64000', 'Gildan', 'SoftStyle Adult T-Shirt', 'Colours', 'Cotton T-shirt/Tank Top', 'TSHIRT', 2.25, 1.96, 0.7, 'GD0164000SOFTSOFTSTYLEGILDAN', 'NEAR_MATCH'),
  ('Garments!43', 'GD01', '64000', 'Gildan', 'SoftStyle Adult T-Shirt', 'Whites', 'Cotton T-shirt/Tank Top', 'TSHIRT', 1.85, 1.59, 0.6, 'GD0164000GILDAN SOFTSOFTSTYLE', 'NEAR_MATCH'),
  ('Garments!45', '5001C', null, 'AS Colour', 'Staple Camo Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 6.7, 5.7, null, '5001ccamostaple', 'EXACT_IDENTITY'),
  ('Garments!46', '5020', null, 'AS Colour', 'Staple L/S Tee', null, 'Long sleeve tees', 'LONGSLEEVE', 6.65, 5.45, null, '5020staplelong sleeve', 'EXACT_IDENTITY'),
  ('Garments!47', '5020G', null, 'AS Colour', 'Staple Organic L/S Tee', null, 'Long sleeve tees', 'LONGSLEEVE', 6.9, 5.6, null, '5020GStapleorganicorganic long sleevelong sleeve', 'EXACT_IDENTITY'),
  ('Garments!48', '5040', null, 'AS Colour', 'Staple Stone Wash Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 7.8, 6.3, null, '5040Staple Stone Wash Teewashedstone washed', 'EXACT_IDENTITY'),
  ('Garments!49', '5001', null, 'AS Colour', 'Staple Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 4.7, 3.95, null, 'AS Colour5001Staple', 'EXACT_IDENTITY'),
  ('Garments!51', '5085', null, 'AS Colour', 'Stone Wash Heavy Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 8.25, 6.7, null, '5085Stone Wash Heavy Teestone wash', 'EXACT_IDENTITY'),
  ('Garments!52', 'GD14', '2400', 'Gildan', 'Ultra Cotton Long Sleeve T-Shirt', 'Colours', 'Long sleeve tees', 'LONGSLEEVE', 5.7, 4.64, 2, 'Gildanlong sleeveblackGD142400ULTRAGILDAN ULTRA', 'NEAR_MATCH'),
  ('Garments!53', 'GD14', '2400', 'Gildan', 'Ultra Cotton Long Sleeve T-Shirt', 'Whites', 'Long sleeve tees', 'LONGSLEEVE', 4.7, 3.71, 2, 'GILDAN ULTRA LONG SLEEVELONG SLEEVEGD14ULTRA2400', 'NEAR_MATCH'),
  ('Garments!54', 'GD02', '2000', 'Gildan', 'Ultra Cotton T-Shirt', 'Whites', 'Cotton T-shirt/Tank Top', 'TSHIRT', 2.35, 2.11, 1.1, 'gildan ultraGD022000ultra', 'NEAR_MATCH'),
  ('Garments!55', 'GD02', '2000', 'Gildan', 'Ultra Cotton T-Shirt', 'Colours', 'Cotton T-shirt/Tank Top', 'TSHIRT', 2.8, 2.56, 1.1, 'Gildan UltraUltraGD022000', 'NEAR_MATCH'),
  ('Garments!56', 'CV3001', '3001', 'Bella Canvas', 'Unisex Crew Neck T-Shirt', 'Colours', 'Cotton T-shirt/Tank Top', 'TSHIRT', 4.8, 3.45, null, 'Bella CanvasteeCV30013001', 'EXACT_IDENTITY'),
  ('Garments!57', 'CV3001', null, 'Bella Canvas', 'Unisex Crew Neck T-Shirt', 'Whites', 'Cotton T-shirt/Tank Top', 'TSHIRT', 4.8, 3.45, null, 'Bella Canvasteewhitesize note: 2XL: 54 / 3XL: 7CV0013001cv3001', 'NEAR_MATCH'),
  ('Garments!58', 'W101', 'WM101', 'Westford Mill', 'Westford Mill Bag For Life - Long Handles', 'Colours', 'Tote bags', 'OTHER', 1.5, 1.19, null, 'Westford MilltoteW101', 'NEAR_MATCH'),
  ('Garments!59', '4062', null, 'AS Colour', 'Wo''s Crop Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 4.4, 3.6, null, '4062crop tee', 'NO_MATCH'),
  ('Garments!60', '4089', null, 'AS Colour', 'Wo''s Heavy Faded Crop Tee', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 7.6, null, null, '4089faded crop', 'NO_MATCH'),
  ('Garments!61', '4064G', null, 'AS Colour', 'Wo''s Organic Rib Crop Tank', null, 'Cotton T-shirt/Tank Top', 'TSHIRT', 7.45, 6.15, null, 'crop tankladies tankwomens tank', 'NO_MATCH');

create temp table _imported_garments (
  garment_id uuid primary key,
  source_row text not null,
  operation text not null check (operation in ('UPDATE', 'INSERT'))
) on commit drop;

-- Resolve each Product Type ID by normalized active name, never by a workbook-generated ID.
with resolved as (
  select source.*, product_type.id as product_type_id
  from _ready_garment_import source
  join public.product_types product_type
    on product_type.is_active
   and lower(regexp_replace(trim(product_type.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.product_type_name), '\s+', ' ', 'g'))
), updated as (
  update public.garments target
  set alt_code = source.alt_code,
      brand_name = source.brand_name,
      name = source.name,
      colour = source.colour,
      garment_type = source.garment_type,
      product_type_id = source.product_type_id,
      eur_base_price = source.eur_base_price,
      gbp_price = source.gbp_price,
      extra_size_cost = source.extra_size_cost,
      tags = source.tags,
      is_active = true
  from resolved source
  where source.match_type = 'EXACT_IDENTITY'
    and target.is_active
    and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.code), '\s+', ' ', 'g'))
    and lower(regexp_replace(trim(coalesce(target.brand_name, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(source.brand_name, '')), '\s+', ' ', 'g'))
    and lower(regexp_replace(trim(target.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.name), '\s+', ' ', 'g'))
    and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(source.colour, '')), '\s+', ' ', 'g'))
    and (target.alt_code, target.brand_name, target.name, target.colour, target.garment_type,
         target.product_type_id, target.eur_base_price, target.gbp_price, target.extra_size_cost,
         target.tags, target.is_active)
        is distinct from
        (source.alt_code, source.brand_name, source.name, source.colour, source.garment_type,
         source.product_type_id, source.eur_base_price, source.gbp_price, source.extra_size_cost,
         source.tags, true)
  returning target.id, source.source_row
)
insert into _imported_garments (garment_id, source_row, operation)
select id, source_row, 'UPDATE'
from updated;

with resolved as (
  select source.*, product_type.id as product_type_id
  from _ready_garment_import source
  join public.product_types product_type
    on product_type.is_active
   and lower(regexp_replace(trim(product_type.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.product_type_name), '\s+', ' ', 'g'))
), inserted as (
  insert into public.garments (
    organisation_id, code, alt_code, brand_name, name, colour, garment_type, product_type_id,
    eur_base_price, gbp_price, extra_size_cost, tags, is_active
  )
  select null, source.code, source.alt_code, source.brand_name, source.name, source.colour,
         source.garment_type, source.product_type_id, source.eur_base_price, source.gbp_price,
         source.extra_size_cost, source.tags, true
  from resolved source
  where source.match_type = 'NO_MATCH'
    and not exists (
      select 1
      from public.garments target
      where target.is_active
        and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.code), '\s+', ' ', 'g'))
        and lower(regexp_replace(trim(coalesce(target.brand_name, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(source.brand_name, '')), '\s+', ' ', 'g'))
        and lower(regexp_replace(trim(target.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.name), '\s+', ' ', 'g'))
        and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(source.colour, '')), '\s+', ' ', 'g'))
    )
  returning id, code, brand_name, name, colour
)
insert into _imported_garments (garment_id, source_row, operation)
select inserted.id, source.source_row, 'INSERT'
from inserted
join _ready_garment_import source
  on source.match_type = 'NO_MATCH'
 and lower(regexp_replace(trim(source.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(inserted.code), '\s+', ' ', 'g'))
 and lower(regexp_replace(trim(coalesce(source.brand_name, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(inserted.brand_name, '')), '\s+', ' ', 'g'))
 and lower(regexp_replace(trim(source.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(inserted.name), '\s+', ' ', 'g'))
 and lower(regexp_replace(trim(coalesce(source.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(inserted.colour, '')), '\s+', ' ', 'g'));

do $$
begin
  if (select count(*) from public.product_types) <> 42 then
    raise exception 'Product Type import assertion failed: expected 42 Product Types';
  end if;

  if exists (
    select 1
    from _ready_garment_import source
    where source.match_type in ('EXACT_IDENTITY', 'NO_MATCH')
      and not exists (
        select 1
        from public.garments target
        where target.is_active
          and target.product_type_id is not null
          and lower(regexp_replace(trim(target.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.code), '\s+', ' ', 'g'))
          and lower(regexp_replace(trim(coalesce(target.brand_name, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(source.brand_name, '')), '\s+', ' ', 'g'))
          and lower(regexp_replace(trim(target.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.name), '\s+', ' ', 'g'))
          and lower(regexp_replace(trim(coalesce(target.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(source.colour, '')), '\s+', ' ', 'g'))
      )
  ) then
    raise exception 'READY garment import assertion failed: imported row lacks product_type_id';
  end if;

  if exists (
    select 1
    from _ready_garment_import source
    join public.garments garment
      on garment.is_active
     and lower(regexp_replace(trim(garment.code), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.code), '\s+', ' ', 'g'))
     and lower(regexp_replace(trim(coalesce(garment.brand_name, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(source.brand_name, '')), '\s+', ' ', 'g'))
     and lower(regexp_replace(trim(garment.name), '\s+', ' ', 'g')) = lower(regexp_replace(trim(source.name), '\s+', ' ', 'g'))
     and lower(regexp_replace(trim(coalesce(garment.colour, '')), '\s+', ' ', 'g')) = lower(regexp_replace(trim(coalesce(source.colour, '')), '\s+', ' ', 'g'))
    where source.match_type in ('EXACT_IDENTITY', 'NO_MATCH')
      and garment.eur_base_price is null
      and garment.gbp_price is null
  ) then
    raise exception 'READY garment import assertion failed: imported active garment has no price';
  end if;

  if exists (
    select 1
    from public.garments garment
    where garment.is_active
    group by lower(regexp_replace(trim(garment.code), '\s+', ' ', 'g')),
             lower(regexp_replace(trim(coalesce(garment.brand_name, '')), '\s+', ' ', 'g')),
             lower(regexp_replace(trim(garment.name), '\s+', ' ', 'g')),
             lower(regexp_replace(trim(coalesce(garment.colour, '')), '\s+', ' ', 'g'))
    having count(*) > 1
  ) then
    raise exception 'READY garment import assertion failed: duplicate normalized active garment identity';
  end if;

  if exists (
    select 1
    from _imported_garments imported
    join public.garments garment on garment.id = imported.garment_id
    where garment.garment_type = 'HOODIE'
  ) then
    raise exception 'READY garment import assertion failed: a deferred hoodie was imported';
  end if;

  if exists (
    select 1
    from _imported_garments imported
    join _ready_garment_import source on source.source_row = imported.source_row
    where source.match_type = 'NEAR_MATCH'
  ) then
    raise exception 'READY garment import assertion failed: a near-match row was modified automatically';
  end if;
end;
$$;
