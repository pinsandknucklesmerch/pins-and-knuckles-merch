-- Normalize the two EU calculator profiles to their independent legacy garment markup matrices.
-- Only global EU Standard and EU US Clients rows are in scope; UK Trade is intentionally untouched.

create temp table _legacy_eu_garment_markups (
  profile_code text not null,
  garment_type text not null,
  markup_value numeric(12,4) not null,
  primary key (profile_code, garment_type)
) on commit drop;

insert into _legacy_eu_garment_markups (profile_code, garment_type, markup_value)
values
  ('EU_STANDARD', 'TSHIRT', 3.0000),
  ('EU_STANDARD', 'LONGSLEEVE', 3.5000),
  ('EU_STANDARD', 'HOODIE', 5.0000),
  ('EU_US_CLIENTS', 'TSHIRT', 2.0000),
  ('EU_US_CLIENTS', 'LONGSLEEVE', 3.0000),
  ('EU_US_CLIENTS', 'HOODIE', 4.0000);

-- Retain incorrect or ineffective rows as history. Deactivation releases the partial
-- active-row unique index before the replacement row is inserted.
update public.calculator_garment_markups markup
set is_active = false,
    valid_to = case
      when markup.valid_to is null or markup.valid_to >= current_date
        then greatest(markup.valid_from, current_date)
      else markup.valid_to
    end
from public.calculator_profiles profile
join _legacy_eu_garment_markups legacy
  on legacy.profile_code = profile.code
where markup.calculator_profile_id = profile.id
  and markup.organisation_id is null
  and profile.organisation_id is null
  and profile.region = 'EU'
  and profile.currency_code = 'EUR'
  and profile.is_active
  and markup.is_active
  and legacy.garment_type = markup.garment_type
  and (
    markup.markup_value is distinct from legacy.markup_value
    or markup.valid_from > current_date
    or (markup.valid_to is not null and markup.valid_to < current_date)
  );

insert into public.calculator_garment_markups (
  organisation_id,
  calculator_profile_id,
  garment_type,
  markup_value,
  valid_from,
  valid_to,
  is_active
)
select null, profile.id, legacy.garment_type, legacy.markup_value, current_date, null, true
from public.calculator_profiles profile
join _legacy_eu_garment_markups legacy on legacy.profile_code = profile.code
where profile.organisation_id is null
  and profile.region = 'EU'
  and profile.currency_code = 'EUR'
  and profile.is_active
  and not exists (
    select 1
    from public.calculator_garment_markups markup
    where markup.calculator_profile_id = profile.id
      and markup.organisation_id is null
      and markup.garment_type = legacy.garment_type
      and markup.markup_value = legacy.markup_value
      and markup.is_active
      and markup.valid_from <= current_date
      and (markup.valid_to is null or markup.valid_to >= current_date)
  );

do $$
begin
  if (
    select count(*)
    from public.calculator_profiles profile
    join public.calculator_garment_markups markup on markup.calculator_profile_id = profile.id
    join _legacy_eu_garment_markups legacy
      on legacy.profile_code = profile.code
     and legacy.garment_type = markup.garment_type
     and legacy.markup_value = markup.markup_value
    where profile.organisation_id is null
      and profile.region = 'EU'
      and profile.currency_code = 'EUR'
      and profile.is_active
      and markup.organisation_id is null
      and markup.is_active
      and markup.valid_from <= current_date
      and (markup.valid_to is null or markup.valid_to >= current_date)
  ) <> 6 then
    raise exception 'EU calculator markup assertion failed: expected six exact applicable legacy markup rows';
  end if;

  if (
    select count(*)
    from public.calculator_profiles profile
    join public.calculator_garment_markups markup on markup.calculator_profile_id = profile.id
    join _legacy_eu_garment_markups legacy
      on legacy.profile_code = profile.code
     and legacy.garment_type = markup.garment_type
    where profile.organisation_id is null
      and profile.region = 'EU'
      and profile.currency_code = 'EUR'
      and profile.is_active
      and markup.organisation_id is null
      and markup.is_active
  ) <> 6 then
    raise exception 'EU calculator markup assertion failed: expected one active row per profile and garment type';
  end if;
end;
$$;
