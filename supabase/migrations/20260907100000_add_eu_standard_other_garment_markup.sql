insert into public.calculator_garment_markups (
  organisation_id,
  calculator_profile_id,
  garment_type,
  markup_value,
  valid_from,
  valid_to,
  is_active
)
select
  null,
  profile.id,
  'OTHER',
  3.0000,
  current_date,
  null,
  true
from public.calculator_profiles profile
where profile.organisation_id is null
  and profile.code = 'EU_STANDARD'
  and profile.region = 'EU'
  and profile.currency_code = 'EUR'
  and profile.is_active
  and not exists (
    select 1
    from public.calculator_garment_markups markup
    where markup.calculator_profile_id = profile.id
      and markup.organisation_id is null
      and markup.garment_type = 'OTHER'
      and markup.is_active
      and markup.valid_from <= current_date
      and (markup.valid_to is null or markup.valid_to >= current_date)
  );
