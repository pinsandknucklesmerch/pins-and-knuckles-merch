-- Configuration is effective-dated independently of immutable weekly snapshots.
create table public.sales_checklist_configurations (
  organisation_id uuid not null references public.organisations(id),
  effective_from timestamptz not null,
  revision uuid not null default gen_random_uuid(),
  duties jsonb not null check (jsonb_typeof(duties) = 'array'),
  staff jsonb not null check (jsonb_typeof(staff) = 'array'),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (organisation_id, effective_from)
);
alter table public.sales_checklist_configurations enable row level security;
revoke all on public.sales_checklist_configurations from public, anon, authenticated;
grant select on public.sales_checklist_configurations to authenticated;
create policy checklist_configuration_admin_read on public.sales_checklist_configurations
  for select to authenticated using (public.can_admin_sales_checklist(organisation_id));
-- No direct configuration/source writes are granted. The checked RPC is the sole mutation boundary.

-- Baseline predates any as-yet-unmaterialized weeks. Existing saved weeks are never touched.
insert into public.sales_checklist_configurations(organisation_id, effective_from, duties, staff)
select o.id, coalesce((select min(w.starts_at) from public.sales_checklist_weeks w where w.organisation_id = o.id), public.sales_checklist_week_start()),
  (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'displayOrder', d.display_order, 'isActive', d.is_active) order by d.display_order, d.id), '[]') from public.sales_checklist_duties d where d.organisation_id = o.id),
  (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'name', a.display_name, 'memberId', m.id, 'userId', m.user_id, 'mondayId', a.monday_member_id, 'displayOrder', a.display_order, 'isActive', a.is_active) order by a.display_order, a.id), '[]')
   from public.sales_checklist_assignments a left join public.organisation_members m on m.organisation_id = a.organisation_id and (m.id = a.organisation_member_id or (a.organisation_member_id is null and m.monday_member_id = a.monday_member_id)) where a.organisation_id = o.id)
from public.organisations o where exists (select 1 from public.sales_checklist_assignments a where a.organisation_id = o.id);

create or replace function public.ensure_sales_checklist_week(p_organisation_id uuid) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare current_start timestamptz := public.sales_checklist_week_start();
  period_start timestamptz; period_id uuid; configuration public.sales_checklist_configurations%rowtype;
  person record; member_id uuid; user_id uuid;
begin
  if auth.role() is distinct from 'service_role' and not public.has_pins_hub_access_for_organisation(p_organisation_id) then
    raise exception 'Checklist access denied.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sales-checklist:' || p_organisation_id::text, 0));
  select w.id into period_id from public.sales_checklist_weeks w where w.organisation_id = p_organisation_id and w.starts_at = current_start;
  if period_id is not null then return period_id; end if;
  select coalesce(max(w.starts_at) + interval '7 days', current_start) into period_start
  from public.sales_checklist_weeks w where w.organisation_id = p_organisation_id;
  while period_start <= current_start loop
    select c.* into configuration from public.sales_checklist_configurations c
    where c.organisation_id = p_organisation_id and c.effective_from <= period_start order by c.effective_from desc limit 1;
    if not found then raise exception 'Checklist configuration is missing.' using errcode = 'P0001'; end if;
    if not exists (select 1 from jsonb_to_recordset(configuration.staff) as s("isActive" boolean) where s."isActive") then
      raise exception 'Checklist team is not configured.' using errcode = 'P0001';
    end if;
    insert into public.sales_checklist_weeks(organisation_id, starts_at, ends_at)
    values (p_organisation_id, period_start, period_start + interval '7 days') returning id into period_id;
    insert into public.sales_checklist_week_duties(organisation_id, week_id, duty_id, name, display_order)
    select p_organisation_id, period_id, d.id, d.name, d."displayOrder"
    from jsonb_to_recordset(configuration.duties) as d(id uuid, name text, "displayOrder" integer, "isActive" boolean) where d."isActive";
    for person in select * from jsonb_to_recordset(configuration.staff) as s(id uuid, name text, "memberId" uuid, "userId" uuid, "mondayId" text, "displayOrder" integer, "isActive" boolean) where s."isActive" loop
      member_id := person."memberId";
      user_id := person."userId";
      -- Resolve only unresolved Batch 1 bootstrap links, scoped to the actual organisation.
      if user_id is null then
        select m.id, m.user_id into member_id, user_id from public.organisation_members m
        join public.app_access aa on aa.organisation_member_id = m.id
        join auth.users u on u.id = m.user_id
        where m.organisation_id = p_organisation_id and m.is_active
          and (m.id = person."memberId" or (person."memberId" is null and m.monday_member_id = person."mondayId"))
          and aa.app_key = 'pins_hub' and aa.access_level in ('read', 'write', 'admin', 'developer');
      end if;
      if member_id is null or user_id is null then raise exception 'Checklist staff must be linked to real Hub users.' using errcode = 'P0001'; end if;
      insert into public.sales_checklist_week_staff(organisation_id, week_id, assignment_id, organisation_member_id, user_id, display_name, display_order)
      values (p_organisation_id, period_id, person.id, member_id, user_id, person.name, person."displayOrder");
    end loop;
    insert into public.sales_checklist_entries(organisation_id, week_id, week_duty_id, week_staff_id)
    select p_organisation_id, period_id, d.id, s.id from public.sales_checklist_week_duties d cross join public.sales_checklist_week_staff s where d.week_id = period_id and s.week_id = period_id;
    period_start := period_start + interval '7 days';
  end loop;
  return period_id;
end $$;

create function public.read_sales_checklist_management(p_organisation_id uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare configuration public.sales_checklist_configurations%rowtype; has_weeks boolean;
begin
  if not public.can_admin_sales_checklist(p_organisation_id) then raise exception 'Administrator access required.' using errcode = '42501'; end if;
  select c.* into configuration from public.sales_checklist_configurations c where c.organisation_id = p_organisation_id order by c.effective_from desc limit 1;
  select exists(select 1 from public.sales_checklist_weeks w where w.organisation_id = p_organisation_id) into has_weeks;
  return jsonb_build_object('revision', configuration.revision, 'effectiveFrom', case when has_weeks then public.sales_checklist_week_start() + interval '7 days' else public.sales_checklist_week_start() end,
    'duties', coalesce(configuration.duties, '[]'), 'staff', coalesce(configuration.staff, '[]'),
    'users', (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'name', coalesce(nullif(trim(p.full_name), ''), p.email, u.email, 'Unnamed user'), 'email', coalesce(p.email, u.email)) order by p.full_name, p.email), '[]')
      from public.organisation_members m join public.profiles p on p.id = m.user_id join auth.users u on u.id = m.user_id
      join public.app_access aa on aa.organisation_member_id = m.id
      where m.organisation_id = p_organisation_id and m.is_active and aa.app_key = 'pins_hub' and aa.access_level in ('read', 'write', 'admin', 'developer')));
end $$;

create function public.save_sales_checklist_management(p_organisation_id uuid, p_expected_revision uuid, p_duties jsonb, p_staff jsonb) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare current_revision uuid; effective_start timestamptz; duty record; person record; actual_name text; actual_user uuid; normalized_staff jsonb := '[]'; normalized_duties jsonb;
begin
  if not public.can_admin_sales_checklist(p_organisation_id) then raise exception 'Administrator access required.' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('sales-checklist:' || p_organisation_id::text, 0));
  select c.revision into current_revision from public.sales_checklist_configurations c where c.organisation_id = p_organisation_id order by c.effective_from desc limit 1;
  if current_revision is distinct from p_expected_revision then raise exception 'Configuration changed. Reload before saving.' using errcode = '40001'; end if;
  if p_duties is null or p_staff is null or jsonb_typeof(p_duties) <> 'array' or jsonb_typeof(p_staff) <> 'array'
    or jsonb_array_length(p_duties) > 100 or jsonb_array_length(p_staff) > 100 then raise exception 'Invalid checklist configuration.' using errcode = '22023'; end if;
  if exists (select 1 from jsonb_to_recordset(p_duties) as d(id uuid, name text, "displayOrder" integer, "isActive" boolean)
    where d.id is null or d.name is null or length(trim(d.name)) not between 1 and 120 or d."displayOrder" is null or d."displayOrder" < 0 or d."isActive" is null)
    or (select count(distinct d.id) from jsonb_to_recordset(p_duties) as d(id uuid)) <> jsonb_array_length(p_duties)
    or (select count(distinct d."displayOrder") from jsonb_to_recordset(p_duties) as d("displayOrder" integer)) <> jsonb_array_length(p_duties)
    or (select count(distinct lower(trim(d.name))) from jsonb_to_recordset(p_duties) as d(name text)) <> jsonb_array_length(p_duties)
    then raise exception 'Invalid or duplicate duties.' using errcode = '22023'; end if;
  if exists (select 1 from jsonb_to_recordset(p_staff) as s(id uuid, "memberId" uuid, "displayOrder" integer, "isActive" boolean)
    where s.id is null or s."displayOrder" is null or s."displayOrder" < 0 or s."isActive" is null or (s."isActive" and s."memberId" is null))
    or (select count(distinct s.id) from jsonb_to_recordset(p_staff) as s(id uuid)) <> jsonb_array_length(p_staff)
    or (select count(distinct s."displayOrder") from jsonb_to_recordset(p_staff) as s("displayOrder" integer)) <> jsonb_array_length(p_staff)
    or exists (select s."memberId" from jsonb_to_recordset(p_staff) as s("memberId" uuid) where s."memberId" is not null group by s."memberId" having count(*) > 1)
    or not exists (select 1 from jsonb_to_recordset(p_staff) as s("isActive" boolean) where s."isActive")
    then raise exception 'Select unique organisation users and an active team.' using errcode = '22023'; end if;
  -- Existing source records must remain in the editor payload; deactivate rather than delete.
  if exists (select 1 from public.sales_checklist_duties d where d.organisation_id = p_organisation_id and not exists (select 1 from jsonb_to_recordset(p_duties) as r(id uuid) where r.id = d.id))
    or exists (select 1 from public.sales_checklist_assignments a where a.organisation_id = p_organisation_id and not exists (select 1 from jsonb_to_recordset(p_staff) as r(id uuid) where r.id = a.id)) then
    raise exception 'Deactivate existing records instead of deleting them.' using errcode = '22023';
  end if;
  for duty in select * from jsonb_to_recordset(p_duties) as d(id uuid, name text, "displayOrder" integer, "isActive" boolean) loop
    if exists(select 1 from public.sales_checklist_duties d where d.id = duty.id and d.organisation_id <> p_organisation_id) then raise exception 'Invalid duty scope.' using errcode = '42501'; end if;
    insert into public.sales_checklist_duties(id, organisation_id, name, display_order, is_active) values(duty.id, p_organisation_id, trim(duty.name), duty."displayOrder", duty."isActive")
    on conflict(id) do update set name = excluded.name, display_order = excluded.display_order, is_active = excluded.is_active;
  end loop;
  -- Clear source links first to permit two rows to swap users atomically.
  update public.sales_checklist_assignments set organisation_member_id = null, monday_member_id = null where organisation_id = p_organisation_id;
  for person in select * from jsonb_to_recordset(p_staff) as s(id uuid, "memberId" uuid, "displayOrder" integer, "isActive" boolean) loop
    if exists(select 1 from public.sales_checklist_assignments a where a.id = person.id and a.organisation_id <> p_organisation_id) then raise exception 'Invalid assignment scope.' using errcode = '42501'; end if;
    actual_user := null; actual_name := null;
    if person."memberId" is not null then
      select m.user_id, coalesce(nullif(trim(p.full_name), ''), p.email, u.email, 'Unnamed user') into actual_user, actual_name
      from public.organisation_members m join public.profiles p on p.id = m.user_id join auth.users u on u.id = m.user_id join public.app_access aa on aa.organisation_member_id = m.id
      where m.id = person."memberId" and m.organisation_id = p_organisation_id
        and (not person."isActive" or m.is_active) and aa.app_key = 'pins_hub' and aa.access_level in ('read', 'write', 'admin', 'developer');
      if actual_user is null then raise exception 'Select an eligible organisation user.' using errcode = '22023'; end if;
    end if;
    -- An inactive unlinked bootstrap row can be retained without inventing an identity.
    if actual_name is null then select a.display_name into actual_name from public.sales_checklist_assignments a where a.id = person.id and a.organisation_id = p_organisation_id; end if;
    if actual_name is null then raise exception 'Select an organisation user.' using errcode = '22023'; end if;
    insert into public.sales_checklist_assignments(id, organisation_id, staff_key, display_name, organisation_member_id, display_order, is_active)
    values(person.id, p_organisation_id, person.id::text, actual_name, person."memberId", person."displayOrder", person."isActive")
    on conflict(id) do update set display_name = excluded.display_name, organisation_member_id = excluded.organisation_member_id, display_order = excluded.display_order, is_active = excluded.is_active;
    normalized_staff := normalized_staff || jsonb_build_array(jsonb_build_object('id', person.id, 'name', actual_name, 'memberId', person."memberId", 'userId', actual_user, 'mondayId', null, 'displayOrder', person."displayOrder", 'isActive', person."isActive"));
  end loop;
  -- Initial setup can establish this week; once any week exists edits are strictly future-week.
  effective_start := public.sales_checklist_week_start();
  if exists(select 1 from public.sales_checklist_weeks w where w.organisation_id = p_organisation_id) then effective_start := effective_start + interval '7 days'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'displayOrder', d.display_order, 'isActive', d.is_active) order by d.display_order), '[]') into normalized_duties
  from public.sales_checklist_duties d where d.organisation_id = p_organisation_id;
  insert into public.sales_checklist_configurations(organisation_id, effective_from, duties, staff, updated_by)
  values(p_organisation_id, effective_start, normalized_duties, normalized_staff, auth.uid())
  on conflict(organisation_id, effective_from) do update set duties = excluded.duties, staff = excluded.staff, revision = gen_random_uuid(), updated_at = now(), updated_by = auth.uid();
end $$;
revoke all on function public.read_sales_checklist_management(uuid), public.save_sales_checklist_management(uuid, uuid, jsonb, jsonb) from public, anon;
grant execute on function public.read_sales_checklist_management(uuid), public.save_sales_checklist_management(uuid, uuid, jsonb, jsonb) to authenticated;

-- Append without resetting any existing enabled states, order or durations.
alter table public.sales_dashboard_tv_settings drop constraint sales_dashboard_tv_settings_slide_key_chk;
alter table public.sales_dashboard_tv_settings add constraint sales_dashboard_tv_settings_slide_key_chk check (slide_key in ('overview', 'ytd', 'year_comparison', 'snuggle', 'team_members', 'live-zoo-cam', 'sales_checklist'));
insert into public.sales_dashboard_tv_settings(organisation_id, slide_key, is_enabled, display_order, duration_seconds)
select s.organisation_id, 'sales_checklist', true, max(s.display_order) + 1, 30 from public.sales_dashboard_tv_settings s
group by s.organisation_id;

create or replace function public.save_sales_dashboard_tv_settings(p_organisation_id uuid, p_settings jsonb) returns void
language plpgsql set search_path = public, pg_temp as $$
declare expected_keys constant text[] := array['overview', 'ytd', 'year_comparison', 'snuggle', 'team_members', 'live-zoo-cam', 'sales_checklist'];
begin
  if not public.has_pins_hub_access_for_organisation(p_organisation_id, 'admin') then raise exception 'Only Pins Hub administrators can change TV settings'; end if;
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
create or replace function public.reset_sales_dashboard_tv_settings(p_organisation_id uuid) returns void
language plpgsql set search_path = public, pg_temp as $$
begin
  perform public.save_sales_dashboard_tv_settings(p_organisation_id,
    (select jsonb_agg(jsonb_build_object('slide_key', k, 'is_enabled', true, 'display_order', ord - 1, 'duration_seconds', 30))
     from unnest(array['overview', 'ytd', 'year_comparison', 'snuggle', 'live-zoo-cam', 'team_members', 'sales_checklist']) with ordinality as keys(k, ord)));
end $$;
