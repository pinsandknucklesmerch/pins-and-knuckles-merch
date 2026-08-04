-- Seed the approved invoice companies without overwriting manual changes.

do $$
declare
  canonical_organisation_id uuid;
  canonical_organisation_count integer;
begin
  select count(*)::integer
    into canonical_organisation_count
    from public.organisations
   where slug = 'pins-knuckles';

  if canonical_organisation_count <> 1 then
    raise exception
      'Expected exactly one canonical organisation with slug pins-knuckles; found %.',
      canonical_organisation_count;
  end if;

  select id
    into canonical_organisation_id
    from public.organisations
   where slug = 'pins-knuckles';

  insert into public.invoice_companies (
    organisation_id,
    label,
    company_name,
    contact_name,
    country,
    eori,
    vat_number,
    tax_id,
    telephone,
    email,
    address_line_1,
    address_line_2,
    city,
    region,
    postal_code,
    notes,
    is_active
  )
  select
    canonical_organisation_id,
    seed.label,
    seed.company_name,
    seed.contact_name,
    seed.country,
    seed.eori,
    seed.vat_number,
    seed.tax_id,
    seed.telephone,
    seed.email,
    seed.address_line_1,
    seed.address_line_2,
    seed.city,
    seed.region,
    seed.postal_code,
    seed.notes,
    seed.is_active
  from (
    values
      (
        'AAA Vans',
        'AAA Vans Ireland',
        '',
        'Ireland',
        '04397934NH',
        'FR19999447618',
        '',
        '',
        'Chris@AAAVANS.com',
        'Unit R, Jordanstown Road',
        'Aerodrome Business Park',
        'Rathcoole',
        'Co. Dublin',
        '',
        '',
        true
      ),
      (
        'EPCC',
        'The Embroidered & Printed Clothing Company',
        '',
        'United Kingdom',
        'GB995260876000',
        '',
        '',
        '',
        '',
        'Premier House',
        '82 Sweyn Road',
        'Margate',
        'Kent',
        'CT9 2DD',
        '',
        true
      ),
      (
        'Sportimadok',
        'Sportimadok.hu kft',
        '',
        'Hungary',
        'HU0044897613',
        'HU25464807',
        '',
        '',
        'peter@sportimadok.hu',
        'Sasadi ut 145',
        '',
        'Budapest',
        '',
        '1112',
        '',
        true
      )
  ) as seed(
    label,
    company_name,
    contact_name,
    country,
    eori,
    vat_number,
    tax_id,
    telephone,
    email,
    address_line_1,
    address_line_2,
    city,
    region,
    postal_code,
    notes,
    is_active
  )
  where not exists (
    select 1
      from public.invoice_companies existing
     where existing.organisation_id = canonical_organisation_id
       and lower(regexp_replace(trim(existing.label), '\s+', ' ', 'g')) =
           lower(regexp_replace(trim(seed.label), '\s+', ' ', 'g'))
  );
end;
$$;
