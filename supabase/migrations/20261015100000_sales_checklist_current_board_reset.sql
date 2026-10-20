-- Hub-only current board and atomic reset. Retain existing data/configuration and shared access semantics.
alter table public.sales_checklist_weeks add column reset_revision uuid not null default gen_random_uuid();

-- Provision Johan's verified Auth UUID per organisation through a trusted deployment connection.
-- No client writes or identity inference from names/emails/Monday IDs.
create table public.sales_checklist_reset_users (
  organisation_id uuid primary key references public.organisations(id),
  user_id uuid not null references auth.users(id)
);
alter table public.sales_checklist_reset_users enable row level security;
revoke all on public.sales_checklist_reset_users from public, anon, authenticated;

create function public.can_clear_sales_checklist(p_organisation_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.has_pins_hub_access_for_organisation(p_organisation_id)
    and (public.can_admin_sales_checklist(p_organisation_id) or exists (
      select 1 from public.sales_checklist_reset_users r
      where r.organisation_id = p_organisation_id and r.user_id = auth.uid()
    ));
$$;
revoke all on function public.can_clear_sales_checklist(uuid) from public, anon;
grant execute on function public.can_clear_sales_checklist(uuid) to authenticated;

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
  -- Only materialize the current board; missed historical weeks are no longer maintained.
  period_start := current_start;
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

  return period_id;
end $$;

-- Keep the optional legacy argument only to reject historical RPC requests explicitly.
create or replace function public.read_sales_checklist(p_organisation_id uuid, p_week_id uuid default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare selected_id uuid;
begin
  if not public.has_pins_hub_access_for_organisation(p_organisation_id) then
    raise exception 'Checklist access denied.' using errcode = '42501';
  end if;
  selected_id := public.ensure_sales_checklist_week(p_organisation_id);
  if p_week_id is not null and p_week_id <> selected_id then
    raise exception 'Only the current checklist is available.' using errcode = '22023';
  end if;
  return jsonb_build_object(
    'weekId', selected_id,
    'startsAt', (select starts_at from public.sales_checklist_weeks where id = selected_id),
    'resetRevision', (select reset_revision from public.sales_checklist_weeks where id = selected_id),
    'canClear', public.can_clear_sales_checklist(p_organisation_id),
    'duties', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name) order by display_order), '[]') from public.sales_checklist_week_duties where week_id = selected_id),
    'staff', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', display_name, 'canEdit', public.can_edit_sales_checklist_entry(organisation_id, week_id, id)) order by display_order), '[]') from public.sales_checklist_week_staff where week_id = selected_id),
    'entries', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'dutyId', week_duty_id, 'staffId', week_staff_id, 'status', status)), '[]') from public.sales_checklist_entries where week_id = selected_id)
  );
end $$;

-- Retain organisation RLS and limit period/snapshot/status reads to the current board.
do $$
declare t text;
begin
  drop policy organisation_read on public.sales_checklist_weeks;
  create policy organisation_read on public.sales_checklist_weeks for select to authenticated
    using (public.has_pins_hub_access_for_organisation(organisation_id) and starts_at = public.sales_checklist_week_start());
  foreach t in array array['sales_checklist_week_duties', 'sales_checklist_week_staff', 'sales_checklist_entries'] loop
    execute format('drop policy organisation_read on public.%I', t);
    execute format('create policy organisation_read on public.%I for select to authenticated using (public.has_pins_hub_access_for_organisation(organisation_id) and exists (select 1 from public.sales_checklist_weeks w where w.id = %I.week_id and w.organisation_id = %I.organisation_id and w.starts_at = public.sales_checklist_week_start()))', t, t, t);
  end loop;
end $$;

-- All authenticated status writes must use the locked, revision-checked RPC.
-- Revoke the old path rather than leaving direct UPDATE able to race a reset.
revoke update(status) on public.sales_checklist_entries from authenticated;
drop function public.update_sales_checklist_status(uuid, uuid, text);
create function public.update_sales_checklist_status(p_organisation_id uuid, p_entry_id uuid, p_status text, p_reset_revision uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare current_id uuid; revision uuid; staff_id uuid;
begin
  if not public.has_pins_hub_access_for_organisation(p_organisation_id) then
    raise exception 'Checklist access denied.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sales-checklist:' || p_organisation_id::text, 0));
  current_id := public.ensure_sales_checklist_week(p_organisation_id);
  select reset_revision into revision from public.sales_checklist_weeks where id = current_id;
  if revision is distinct from p_reset_revision then raise exception 'Checklist was reset. Refresh before saving.' using errcode = '40001'; end if;
  if p_status is null or p_status not in ('complete', 'to_do', 'na') then raise exception 'Invalid checklist status.' using errcode = '22023'; end if;
  select week_staff_id into staff_id from public.sales_checklist_entries
    where id = p_entry_id and organisation_id = p_organisation_id and week_id = current_id;
  if staff_id is null or not public.can_edit_sales_checklist_entry(p_organisation_id, current_id, staff_id) then
    raise exception 'Checklist edit denied.' using errcode = '42501';
  end if;
  update public.sales_checklist_entries set status = p_status where id = p_entry_id and organisation_id = p_organisation_id and week_id = current_id;
  return found;
end $$;

create function public.clear_sales_checklist(p_organisation_id uuid, p_week_id uuid, p_reset_revision uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare current_id uuid; revision uuid;
begin
  if not public.can_clear_sales_checklist(p_organisation_id) then raise exception 'Checklist reset denied.' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('sales-checklist:' || p_organisation_id::text, 0));
  current_id := public.ensure_sales_checklist_week(p_organisation_id);
  select reset_revision into revision from public.sales_checklist_weeks where id = current_id;
  if current_id is distinct from p_week_id or revision is distinct from p_reset_revision then
    raise exception 'Checklist changed. Refresh before resetting.' using errcode = '40001';
  end if;
  update public.sales_checklist_entries set status = 'to_do' where organisation_id = p_organisation_id and week_id = current_id;
  update public.sales_checklist_weeks set reset_revision = gen_random_uuid() where organisation_id = p_organisation_id and id = current_id;
  return true;
end $$;
revoke all on function public.update_sales_checklist_status(uuid, uuid, text, uuid), public.clear_sales_checklist(uuid, uuid, uuid) from public, anon;
grant execute on function public.update_sales_checklist_status(uuid, uuid, text, uuid), public.clear_sales_checklist(uuid, uuid, uuid) to authenticated;
