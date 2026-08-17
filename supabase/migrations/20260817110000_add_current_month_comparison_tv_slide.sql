alter table public.sales_dashboard_tv_settings
  drop constraint if exists sales_dashboard_tv_settings_slide_key_chk,
  add constraint sales_dashboard_tv_settings_slide_key_chk
    check (slide_key in ('overview', 'ytd', 'year_comparison', 'snuggle', 'team_members', 'live-zoo-cam', 'current-month-comparison'));

insert into public.sales_dashboard_tv_settings (
  organisation_id,
  slide_key,
  is_enabled,
  display_order,
  duration_seconds
)
select
  organisation.id,
  'current-month-comparison',
  true,
  6,
  30
from public.organisations organisation
where organisation.slug = 'pins-knuckles'
  and not exists (
    select 1
    from public.sales_dashboard_tv_settings existing
    where existing.organisation_id = organisation.id
      and existing.slide_key = 'current-month-comparison'
  );

create or replace function public.save_sales_dashboard_tv_settings(
  p_organisation_id uuid,
  p_settings jsonb
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  expected_keys constant text[] := array['overview', 'ytd', 'year_comparison', 'snuggle', 'team_members', 'live-zoo-cam', 'current-month-comparison'];
begin
  if not public.has_pins_hub_access_for_organisation(p_organisation_id, 'admin') then
    raise exception 'Only Pins Hub administrators can change TV settings';
  end if;
  if jsonb_typeof(p_settings) <> 'array' or jsonb_array_length(p_settings) <> 7 then
    raise exception 'TV settings must contain exactly seven rows';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer)
    where row.slide_key is null or row.is_enabled is null or row.display_order is null or row.duration_seconds is null
      or row.slide_key <> all(expected_keys)
      or row.duration_seconds not between 10 and 300
      or row.display_order < 0
  ) then
    raise exception 'TV settings contain invalid values';
  end if;
  if (select count(distinct row.slide_key) from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer)) <> 7
    or (select count(distinct row.display_order) from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer)) <> 7
    or exists (select 1 from unnest(expected_keys) key where not exists (select 1 from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer) where row.slide_key = key))
    or not exists (select 1 from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer) where row.is_enabled) then
    raise exception 'TV settings must contain unique complete order and at least one enabled slide';
  end if;

  set constraints sales_dashboard_tv_settings_order_key deferred;
  delete from public.sales_dashboard_tv_settings where organisation_id = p_organisation_id;
  insert into public.sales_dashboard_tv_settings (organisation_id, slide_key, is_enabled, display_order, duration_seconds, updated_by)
  select p_organisation_id, row.slide_key, row.is_enabled, row.display_order, row.duration_seconds, auth.uid()
  from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer);
end;
$$;

create or replace function public.reset_sales_dashboard_tv_settings(p_organisation_id uuid)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  perform public.save_sales_dashboard_tv_settings(
    p_organisation_id,
    '[{"slide_key":"overview","is_enabled":true,"display_order":0,"duration_seconds":30},{"slide_key":"ytd","is_enabled":true,"display_order":1,"duration_seconds":30},{"slide_key":"year_comparison","is_enabled":true,"display_order":2,"duration_seconds":30},{"slide_key":"snuggle","is_enabled":true,"display_order":3,"duration_seconds":30},{"slide_key":"team_members","is_enabled":true,"display_order":4,"duration_seconds":30},{"slide_key":"live-zoo-cam","is_enabled":true,"display_order":5,"duration_seconds":30},{"slide_key":"current-month-comparison","is_enabled":true,"display_order":6,"duration_seconds":30}]'::jsonb
  );
end;
$$;
