-- Forward-only RPC migration. Apply separately after reviewing; do not run from the app.
create or replace function public.save_sales_dashboard_tv_settings(
  p_organisation_id uuid,
  p_settings jsonb
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  expected_keys constant text[] := array['overview', 'ytd', 'year_comparison', 'snuggle', 'team_members'];
begin
  if not public.has_pins_hub_access_for_organisation(p_organisation_id, 'admin') then
    raise exception 'Only Pins Hub administrators can change TV settings';
  end if;
  if jsonb_typeof(p_settings) <> 'array' or jsonb_array_length(p_settings) <> 5 then
    raise exception 'TV settings must contain exactly five rows';
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
  if (select count(distinct row.slide_key) from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer)) <> 5
    or (select count(distinct row.display_order) from jsonb_to_recordset(p_settings) as row(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer)) <> 5
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

revoke all on function public.save_sales_dashboard_tv_settings(uuid, jsonb) from public, anon;
grant execute on function public.save_sales_dashboard_tv_settings(uuid, jsonb) to authenticated;

create or replace function public.reset_sales_dashboard_tv_settings(p_organisation_id uuid)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  perform public.save_sales_dashboard_tv_settings(
    p_organisation_id,
    '[{"slide_key":"overview","is_enabled":true,"display_order":0,"duration_seconds":30},{"slide_key":"ytd","is_enabled":true,"display_order":1,"duration_seconds":30},{"slide_key":"year_comparison","is_enabled":true,"display_order":2,"duration_seconds":30},{"slide_key":"snuggle","is_enabled":true,"display_order":3,"duration_seconds":30},{"slide_key":"team_members","is_enabled":true,"display_order":4,"duration_seconds":30}]'::jsonb
  );
end;
$$;

revoke all on function public.reset_sales_dashboard_tv_settings(uuid) from public, anon;
grant execute on function public.reset_sales_dashboard_tv_settings(uuid) to authenticated;

