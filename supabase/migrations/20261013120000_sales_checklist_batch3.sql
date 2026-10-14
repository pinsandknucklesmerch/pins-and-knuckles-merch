-- Wrap the existing atomic configuration writer with an effective-week guard.
-- The legacy four-argument writer is private so clients cannot bypass the guard.
alter function public.save_sales_checklist_management(uuid, uuid, jsonb, jsonb)
  rename to save_sales_checklist_management_configuration;
revoke all on function public.save_sales_checklist_management_configuration(uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated, service_role;

create function public.save_sales_checklist_management(
  p_organisation_id uuid,
  p_expected_revision uuid,
  p_expected_effective_from timestamptz,
  p_duties jsonb,
  p_staff jsonb
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare effective_start timestamptz;
begin
  if not public.can_admin_sales_checklist(p_organisation_id) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  -- Same lock as rollover and the configuration writer: no initialization/save race.
  perform pg_advisory_xact_lock(hashtextextended('sales-checklist:' || p_organisation_id::text, 0));
  effective_start := public.sales_checklist_week_start();
  if exists (select 1 from public.sales_checklist_weeks w where w.organisation_id = p_organisation_id) then
    effective_start := effective_start + interval '7 days';
  end if;
  if p_expected_effective_from is distinct from effective_start then
    raise exception 'The effective week changed. Refresh configuration before saving.'
      using errcode = 'P0001', hint = 'effective_week_changed';
  end if;
  -- Retains all existing revision, identity, validation and historical-snapshot protections.
  perform public.save_sales_checklist_management_configuration(p_organisation_id, p_expected_revision, p_duties, p_staff);
end $$;
revoke all on function public.save_sales_checklist_management(uuid, uuid, timestamptz, jsonb, jsonb) from public, anon;
grant execute on function public.save_sales_checklist_management(uuid, uuid, timestamptz, jsonb, jsonb) to authenticated;

-- Reuse the established Hub admin/developer/active-owner helper without changing shared access helpers.
-- Both the invoker RPC and underlying RLS must recognise the owner override.
alter policy sales_dashboard_tv_settings_insert_admin on public.sales_dashboard_tv_settings
  with check (public.can_admin_sales_checklist(organisation_id));
alter policy sales_dashboard_tv_settings_update_admin on public.sales_dashboard_tv_settings
  using (public.can_admin_sales_checklist(organisation_id))
  with check (public.can_admin_sales_checklist(organisation_id));
alter policy sales_dashboard_tv_settings_delete_admin on public.sales_dashboard_tv_settings
  using (public.can_admin_sales_checklist(organisation_id));

create or replace function public.save_sales_dashboard_tv_settings(p_organisation_id uuid, p_settings jsonb) returns void
language plpgsql set search_path = public, pg_temp as $$
declare expected_keys constant text[] := array['overview', 'ytd', 'year_comparison', 'snuggle', 'team_members', 'live-zoo-cam', 'sales_checklist'];
begin
  if not public.can_admin_sales_checklist(p_organisation_id) then raise exception 'Only Pins Hub administrators can change TV settings'; end if;
  if p_settings is null or jsonb_typeof(p_settings) <> 'array' or jsonb_array_length(p_settings) <> cardinality(expected_keys) then raise exception 'All TV slides are required'; end if;
  if exists(select 1 from jsonb_to_recordset(p_settings) as r(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer) where r.slide_key is null or r.is_enabled is null or r.display_order is null or r.duration_seconds is null or r.slide_key <> all(expected_keys) or r.duration_seconds not between 10 and 300 or r.display_order < 0)
    or (select count(distinct r.slide_key) from jsonb_to_recordset(p_settings) as r(slide_key text)) <> cardinality(expected_keys)
    or (select count(distinct r.display_order) from jsonb_to_recordset(p_settings) as r(display_order integer)) <> cardinality(expected_keys)
    or not exists(select 1 from jsonb_to_recordset(p_settings) as r(is_enabled boolean) where r.is_enabled) then raise exception 'Invalid TV settings'; end if;
  set constraints sales_dashboard_tv_settings_order_key deferred;
  delete from public.sales_dashboard_tv_settings where organisation_id = p_organisation_id;
  insert into public.sales_dashboard_tv_settings(organisation_id, slide_key, is_enabled, display_order, duration_seconds, updated_by)
  select p_organisation_id, r.slide_key, r.is_enabled, r.display_order, r.duration_seconds, auth.uid() from jsonb_to_recordset(p_settings) as r(slide_key text, is_enabled boolean, display_order integer, duration_seconds integer);
end $$;
