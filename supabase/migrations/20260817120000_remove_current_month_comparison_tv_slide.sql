-- Forward-only cleanup for organisations that may already have the comparison slide.
-- Existing slide durations, enabled states, and relative order are retained where possible.
create temporary table tv_setting_organisations on commit drop as
select distinct organisation_id
from public.sales_dashboard_tv_settings;

delete from public.sales_dashboard_tv_settings
where slide_key = 'current-month-comparison';

alter table public.sales_dashboard_tv_settings
  drop constraint if exists sales_dashboard_tv_settings_slide_key_chk,
  add constraint sales_dashboard_tv_settings_slide_key_chk
    check (slide_key in ('overview', 'ytd', 'year_comparison', 'snuggle', 'team_members', 'live-zoo-cam'));

insert into public.sales_dashboard_tv_settings (organisation_id, slide_key, is_enabled, display_order, duration_seconds)
select organisations.organisation_id, 'team_members', true, coalesce(max(settings.display_order), -1) + 1, 30
from tv_setting_organisations organisations
left join public.sales_dashboard_tv_settings settings on settings.organisation_id = organisations.organisation_id
where not exists (
  select 1 from public.sales_dashboard_tv_settings existing
  where existing.organisation_id = organisations.organisation_id and existing.slide_key = 'team_members'
)
group by organisations.organisation_id;

-- Move Team Members to the final position while retaining the order of every other slide.
update public.sales_dashboard_tv_settings
set display_order = display_order + 10000;

with ordered as (
  select ctid, row_number() over (
    partition by organisation_id
    order by (slide_key = 'team_members'), display_order
  ) - 1 as new_order
  from public.sales_dashboard_tv_settings
)
update public.sales_dashboard_tv_settings settings
set display_order = ordered.new_order,
    is_enabled = case when settings.slide_key = 'team_members' then true else settings.is_enabled end
from ordered
where settings.ctid = ordered.ctid;

create or replace function public.save_sales_dashboard_tv_settings(
  p_organisation_id uuid,
  p_settings jsonb
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  expected_keys constant text[] := array['overview', 'ytd', 'year_comparison', 'snuggle', 'team_members', 'live-zoo-cam'];
begin
  if not public.has_pins_hub_access_for_organisation(p_organisation_id, 'admin') then
    raise exception 'Only Pins Hub administrators can change TV settings';
  end if;
  if jsonb_typeof(p_settings) <> 'array' or jsonb_array_length(p_settings) <> 6 then
    raise exception 'TV settings must contain exactly six rows';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer)
    where row.slide_key is null or row.is_enabled is null or row.display_order is null or row.duration_seconds is null
      or row.slide_key <> all(expected_keys) or row.duration_seconds not between 10 and 300 or row.display_order < 0
  ) then
    raise exception 'TV settings contain invalid values';
  end if;
  if (select count(distinct row.slide_key) from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer)) <> 6
    or (select count(distinct row.display_order) from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer)) <> 6
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
    '[{"slide_key":"overview","is_enabled":true,"display_order":0,"duration_seconds":30},{"slide_key":"ytd","is_enabled":true,"display_order":1,"duration_seconds":30},{"slide_key":"year_comparison","is_enabled":true,"display_order":2,"duration_seconds":30},{"slide_key":"snuggle","is_enabled":true,"display_order":3,"duration_seconds":30},{"slide_key":"live-zoo-cam","is_enabled":true,"display_order":4,"duration_seconds":30},{"slide_key":"team_members","is_enabled":true,"display_order":5,"duration_seconds":30}]'::jsonb
  );
end;
$$;
