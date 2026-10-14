-- Additive Hub-only schema. Existing shared access helpers and Merch policies are unchanged.
create table public.sales_checklist_duties (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id),
  name text not null check (length(trim(name)) > 0),
  display_order integer not null,
  is_active boolean not null default true,
  unique (organisation_id, id)
);
create table public.sales_checklist_assignments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id),
  staff_key text not null,
  display_name text not null,
  monday_member_id text,
  organisation_member_id uuid references public.organisation_members(id) on delete set null,
  display_order integer not null,
  is_active boolean not null default true,
  unique (organisation_id, staff_key),
  unique (organisation_id, organisation_member_id),
  unique (organisation_id, id)
);
create table public.sales_checklist_weeks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  check (ends_at = starts_at + interval '7 days'),
  unique (organisation_id, starts_at),
  unique (organisation_id, id)
);
create table public.sales_checklist_week_duties (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  week_id uuid not null,
  duty_id uuid not null,
  name text not null,
  display_order integer not null,
  foreign key (organisation_id, week_id) references public.sales_checklist_weeks(organisation_id, id),
  foreign key (organisation_id, duty_id) references public.sales_checklist_duties(organisation_id, id),
  unique (week_id, duty_id),
  unique (organisation_id, week_id, id)
);
create table public.sales_checklist_week_staff (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  week_id uuid not null,
  assignment_id uuid not null,
  organisation_member_id uuid not null,
  user_id uuid not null, -- historical identity snapshot; retained if membership/account is removed
  display_name text not null,
  display_order integer not null,
  foreign key (organisation_id, week_id) references public.sales_checklist_weeks(organisation_id, id),
  foreign key (organisation_id, assignment_id) references public.sales_checklist_assignments(organisation_id, id),
  unique (week_id, assignment_id),
  unique (week_id, user_id),
  unique (organisation_id, week_id, id)
);
create table public.sales_checklist_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  week_id uuid not null,
  week_duty_id uuid not null,
  week_staff_id uuid not null,
  status text not null default 'to_do' check (status in ('complete', 'to_do', 'na')),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  foreign key (organisation_id, week_id, week_duty_id) references public.sales_checklist_week_duties(organisation_id, week_id, id),
  foreign key (organisation_id, week_id, week_staff_id) references public.sales_checklist_week_staff(organisation_id, week_id, id),
  unique (week_duty_id, week_staff_id)
);

-- Monday 09:00 Johannesburg is Monday 07:00 UTC; before 09:00 still belongs to last week.
create function public.sales_checklist_week_start() returns timestamptz
language sql stable set search_path = public, pg_temp as $$
  select (date_trunc('week', (now() at time zone 'Africa/Johannesburg') - interval '9 hours') + interval '9 hours') at time zone 'Africa/Johannesburg';
$$;

create function public.can_admin_sales_checklist(p_organisation_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.has_pins_hub_access_for_organisation(p_organisation_id, 'admin') or exists (
    select 1 from public.organisation_members m
    where m.organisation_id = p_organisation_id and m.user_id = auth.uid()
      and m.is_active and m.role = 'owner'
      and public.has_pins_hub_access_for_organisation(p_organisation_id)
  );
$$;

create function public.can_edit_sales_checklist_entry(p_organisation_id uuid, p_week_id uuid, p_staff_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.has_pins_hub_access_for_organisation(p_organisation_id) and exists (
    select 1 from public.sales_checklist_weeks w
    join public.sales_checklist_week_staff s on s.week_id = w.id and s.organisation_id = w.organisation_id
    where w.id = p_week_id and w.organisation_id = p_organisation_id and s.id = p_staff_id
      and w.starts_at = public.sales_checklist_week_start() and now() < w.ends_at
      and (public.can_admin_sales_checklist(p_organisation_id) or (
        s.user_id = auth.uid() and exists (
          select 1 from public.organisation_members m
          where m.id = s.organisation_member_id and m.organisation_id = p_organisation_id
            and m.user_id = auth.uid() and m.is_active
        )
      ))
  );
$$;

-- Only status is client-writable. Identity, snapshots, periods and audit fields are protected.
do $$ declare t text; begin
  foreach t in array array['sales_checklist_duties', 'sales_checklist_assignments', 'sales_checklist_weeks', 'sales_checklist_week_duties', 'sales_checklist_week_staff', 'sales_checklist_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy organisation_read on public.%I for select to authenticated using (public.has_pins_hub_access_for_organisation(organisation_id))', t);
  end loop;
end $$;
grant update(status) on public.sales_checklist_entries to authenticated;
create policy current_week_status_update on public.sales_checklist_entries for update to authenticated
  using (public.can_edit_sales_checklist_entry(organisation_id, week_id, week_staff_id))
  with check (public.can_edit_sales_checklist_entry(organisation_id, week_id, week_staff_id));

create function public.audit_sales_checklist_status() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
create trigger sales_checklist_status_audit before update on public.sales_checklist_entries
  for each row execute function public.audit_sales_checklist_status();

-- Initial configuration uses established Monday identity links, never guessed auth UUIDs.
insert into public.sales_checklist_duties(organisation_id, name, display_order)
select o.id, d.name, d.position from public.organisations o cross join (values
  ('Quote Follow Up', 10), ('Aftersales', 20), ('Referrals Contacted', 30),
  ('Social Media', 40), ('Client Outreach', 50), ('Above & Beyond', 60)
) d(name, position) where o.slug = 'pins-knuckles';
insert into public.sales_checklist_assignments(organisation_id, staff_key, display_name, monday_member_id, organisation_member_id, display_order)
select o.id, s.key, s.name, s.monday_id, m.id, s.position
from public.organisations o cross join (values
  ('johan', 'Johan', '14589471', 10), ('hardus', 'Hardus', '29869326', 20),
  ('bux', 'Bux', '26816626', 30), ('justin', 'Justin', '69507598', 40)
) s(key, name, monday_id, position)
left join public.organisation_members m on m.organisation_id = o.id and m.monday_member_id = s.monday_id
where o.slug = 'pins-knuckles';

create function public.ensure_sales_checklist_week(p_organisation_id uuid) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare current_start timestamptz := public.sales_checklist_week_start();
  period_start timestamptz; period_id uuid; missing_names text;
begin
  if auth.role() is distinct from 'service_role' and not public.has_pins_hub_access_for_organisation(p_organisation_id) then
    raise exception 'Checklist access denied.' using errcode = '42501';
  end if;
  -- Serialize initialization/rollover per organisation, including concurrent page loads.
  perform pg_advisory_xact_lock(hashtextextended('sales-checklist:' || p_organisation_id::text, 0));
  update public.sales_checklist_assignments a set organisation_member_id = m.id
  from public.organisation_members m where a.organisation_id = p_organisation_id
    and a.organisation_member_id is null and m.organisation_id = a.organisation_id
    and m.monday_member_id = a.monday_member_id;
  select string_agg(a.display_name, ', ' order by a.display_order) into missing_names
  from public.sales_checklist_assignments a
  where a.organisation_id = p_organisation_id and a.is_active and not exists (
    select 1 from public.organisation_members m join public.app_access aa on aa.organisation_member_id = m.id
    join auth.users u on u.id = m.user_id
    where m.id = a.organisation_member_id and m.organisation_id = a.organisation_id
      and m.is_active and aa.app_key = 'pins_hub' and aa.access_level in ('read', 'write', 'admin', 'developer')
  );
  -- Existing current weeks remain readable even when someone subsequently loses access.
  select id into period_id from public.sales_checklist_weeks where organisation_id = p_organisation_id and starts_at = current_start;
  if period_id is not null then return period_id; end if;
  if missing_names is not null then
    raise exception 'Link active Hub users to checklist staff: %', missing_names using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.sales_checklist_assignments where organisation_id = p_organisation_id and is_active) then
    raise exception 'Checklist team is not configured.' using errcode = 'P0001';
  end if;
  select coalesce(max(starts_at) + interval '7 days', current_start) into period_start
  from public.sales_checklist_weeks where organisation_id = p_organisation_id;
  -- Catch up missed scheduled runs without erasing or resetting any saved week.
  while period_start <= current_start loop
    insert into public.sales_checklist_weeks(organisation_id, starts_at, ends_at)
    values (p_organisation_id, period_start, period_start + interval '7 days') returning id into period_id;
    insert into public.sales_checklist_week_duties(organisation_id, week_id, duty_id, name, display_order)
    select p_organisation_id, period_id, id, name, display_order from public.sales_checklist_duties
    where organisation_id = p_organisation_id and is_active;
    insert into public.sales_checklist_week_staff(organisation_id, week_id, assignment_id, organisation_member_id, user_id, display_name, display_order)
    select p_organisation_id, period_id, a.id, m.id, m.user_id, a.display_name, a.display_order
    from public.sales_checklist_assignments a join public.organisation_members m on m.id = a.organisation_member_id
    where a.organisation_id = p_organisation_id and a.is_active;
    insert into public.sales_checklist_entries(organisation_id, week_id, week_duty_id, week_staff_id)
    select p_organisation_id, period_id, d.id, s.id from public.sales_checklist_week_duties d
    cross join public.sales_checklist_week_staff s where d.week_id = period_id and s.week_id = period_id;
    period_start := period_start + interval '7 days';
  end loop;
  return period_id;
end $$;

create function public.read_sales_checklist(p_organisation_id uuid, p_week_id uuid default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare selected_id uuid; current_id uuid;
begin
  if not public.has_pins_hub_access_for_organisation(p_organisation_id) then
    raise exception 'Checklist access denied.' using errcode = '42501';
  end if;
  -- Historical reads do not depend on today's team configuration.
  if p_week_id is null then current_id := public.ensure_sales_checklist_week(p_organisation_id); end if;
  selected_id := coalesce(p_week_id, current_id);
  if not exists (select 1 from public.sales_checklist_weeks where id = selected_id and organisation_id = p_organisation_id) then
    raise exception 'Checklist week not found.' using errcode = '22023';
  end if;
  return jsonb_build_object(
    'weekId', selected_id,
    'isCurrent', exists (select 1 from public.sales_checklist_weeks where id = selected_id and starts_at = public.sales_checklist_week_start()),
    'weeks', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'startsAt', starts_at) order by starts_at desc), '[]') from public.sales_checklist_weeks where organisation_id = p_organisation_id),
    'duties', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name) order by display_order), '[]') from public.sales_checklist_week_duties where week_id = selected_id),
    'staff', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', display_name, 'canEdit', public.can_edit_sales_checklist_entry(organisation_id, week_id, id)) order by display_order), '[]') from public.sales_checklist_week_staff where week_id = selected_id),
    'entries', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'dutyId', week_duty_id, 'staffId', week_staff_id, 'status', status)), '[]') from public.sales_checklist_entries where week_id = selected_id)
  );
end $$;

create function public.update_sales_checklist_status(p_organisation_id uuid, p_entry_id uuid, p_status text) returns boolean
language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if p_status not in ('complete', 'to_do', 'na') or p_status is null then
    raise exception 'Invalid checklist status.' using errcode = '22023';
  end if;
  update public.sales_checklist_entries set status = p_status where id = p_entry_id and organisation_id = p_organisation_id;
  return found;
end $$;

revoke all on function public.sales_checklist_week_start(), public.can_admin_sales_checklist(uuid), public.can_edit_sales_checklist_entry(uuid, uuid, uuid), public.audit_sales_checklist_status(), public.ensure_sales_checklist_week(uuid), public.read_sales_checklist(uuid, uuid), public.update_sales_checklist_status(uuid, uuid, text) from public, anon;
grant execute on function public.sales_checklist_week_start(), public.can_admin_sales_checklist(uuid), public.can_edit_sales_checklist_entry(uuid, uuid, uuid), public.ensure_sales_checklist_week(uuid), public.read_sales_checklist(uuid, uuid), public.update_sales_checklist_status(uuid, uuid, text) to authenticated;
grant execute on function public.ensure_sales_checklist_week(uuid) to service_role;
grant select on public.sales_checklist_assignments to service_role;

-- Cron has no caller-supplied organisation or identity. Each configured team rolls once.
create function public.rollover_sales_checklists() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare organisation_id uuid; processed integer := 0; failed integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required.' using errcode = '42501';
  end if;
  for organisation_id in select distinct a.organisation_id from public.sales_checklist_assignments a where a.is_active loop
    begin
      perform public.ensure_sales_checklist_week(organisation_id);
      processed := processed + 1;
    exception when others then
      failed := failed + 1;
    end;
  end loop;
  -- Keep successful organisations committed; the handler reports failures for retry.
  return case when failed > 0 then -failed else processed end;
end $$;
revoke all on function public.rollover_sales_checklists() from public, anon, authenticated;
grant execute on function public.rollover_sales_checklists() to service_role;
