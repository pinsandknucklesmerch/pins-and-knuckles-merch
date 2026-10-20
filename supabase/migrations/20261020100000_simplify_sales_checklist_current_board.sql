-- Replace weekly snapshots and effective-dated configuration with one persistent
-- organisation-scoped board. Existing shared access helpers and Merch schema are unchanged.

create table public.sales_checklist_statuses (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id),
  duty_id uuid not null,
  assignment_id uuid not null,
  status text not null default 'to_do' check (status in ('complete', 'to_do', 'na')),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  foreign key (organisation_id, duty_id)
    references public.sales_checklist_duties(organisation_id, id),
  foreign key (organisation_id, assignment_id)
    references public.sales_checklist_assignments(organisation_id, id),
  unique (organisation_id, duty_id, assignment_id)
);

-- Resolve any remaining bootstrap assignment links without guessing Auth identities.
update public.sales_checklist_assignments a
set organisation_member_id = m.id
from public.organisation_members m
where a.organisation_member_id is null
  and a.monday_member_id is not null
  and m.organisation_id = a.organisation_id
  and m.monday_member_id = a.monday_member_id;

-- Start with the active source matrix, then retain the newest available status for
-- matching duty/assignment pairs. Historical periods are discarded below.
insert into public.sales_checklist_statuses(organisation_id, duty_id, assignment_id)
select d.organisation_id, d.id, a.id
from public.sales_checklist_duties d
join public.sales_checklist_assignments a
  on a.organisation_id = d.organisation_id
where d.is_active and a.is_active;

with latest_status as (
  select distinct on (e.organisation_id, wd.duty_id, ws.assignment_id)
    e.organisation_id,
    wd.duty_id,
    ws.assignment_id,
    e.status,
    e.updated_at,
    e.updated_by
  from public.sales_checklist_entries e
  join public.sales_checklist_weeks w
    on w.id = e.week_id and w.organisation_id = e.organisation_id
  join public.sales_checklist_week_duties wd
    on wd.id = e.week_duty_id and wd.week_id = e.week_id and wd.organisation_id = e.organisation_id
  join public.sales_checklist_week_staff ws
    on ws.id = e.week_staff_id and ws.week_id = e.week_id and ws.organisation_id = e.organisation_id
  order by e.organisation_id, wd.duty_id, ws.assignment_id, w.starts_at desc
)
update public.sales_checklist_statuses s
set status = latest.status,
    updated_at = latest.updated_at,
    updated_by = latest.updated_by
from latest_status latest
where s.organisation_id = latest.organisation_id
  and s.duty_id = latest.duty_id
  and s.assignment_id = latest.assignment_id;

alter table public.sales_checklist_statuses enable row level security;
revoke all on public.sales_checklist_statuses from public, anon, authenticated;
grant select, update(status) on public.sales_checklist_statuses to authenticated;

create function public.can_edit_sales_checklist_status(
  p_organisation_id uuid,
  p_assignment_id uuid
) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.has_pins_hub_access_for_organisation(p_organisation_id)
    and exists (
      select 1
      from public.sales_checklist_assignments a
      join public.organisation_members m
        on m.id = a.organisation_member_id and m.organisation_id = a.organisation_id
      join public.app_access aa on aa.organisation_member_id = m.id
      where a.organisation_id = p_organisation_id
        and a.id = p_assignment_id
        and a.is_active
        and m.is_active
        and aa.app_key = 'pins_hub'
        and aa.access_level in ('read', 'write', 'admin', 'developer')
        and (public.can_admin_sales_checklist(p_organisation_id) or m.user_id = auth.uid())
    );
$$;

revoke all on function public.can_edit_sales_checklist_status(uuid, uuid) from public, anon;
grant execute on function public.can_edit_sales_checklist_status(uuid, uuid) to authenticated;

create policy organisation_read on public.sales_checklist_statuses
  for select to authenticated
  using (public.has_pins_hub_access_for_organisation(organisation_id));

create policy own_or_admin_status_update on public.sales_checklist_statuses
  for update to authenticated
  using (
    public.can_edit_sales_checklist_status(organisation_id, assignment_id)
    and exists (
      select 1 from public.sales_checklist_duties d
      where d.organisation_id = sales_checklist_statuses.organisation_id
        and d.id = sales_checklist_statuses.duty_id
        and d.is_active
    )
  )
  with check (
    public.can_edit_sales_checklist_status(organisation_id, assignment_id)
    and exists (
      select 1 from public.sales_checklist_duties d
      where d.organisation_id = sales_checklist_statuses.organisation_id
        and d.id = sales_checklist_statuses.duty_id
        and d.is_active
    )
  );

create trigger sales_checklist_status_audit
  before update on public.sales_checklist_statuses
  for each row execute function public.audit_sales_checklist_status();

-- Remove obsolete RPCs before dropping the snapshot/effective-date tables they reference.
drop function if exists public.read_sales_checklist(uuid, uuid);
drop function if exists public.update_sales_checklist_status(uuid, uuid, text, uuid);
drop function if exists public.clear_sales_checklist(uuid, uuid, uuid);
drop function if exists public.rollover_sales_checklists();
drop function if exists public.ensure_sales_checklist_week(uuid);
drop function if exists public.read_sales_checklist_management(uuid);
drop function if exists public.save_sales_checklist_management(uuid, uuid, timestamptz, jsonb, jsonb);
drop function if exists public.save_sales_checklist_management_configuration(uuid, uuid, jsonb, jsonb);
drop policy if exists current_week_status_update on public.sales_checklist_entries;
drop function if exists public.can_edit_sales_checklist_entry(uuid, uuid, uuid);

drop table public.sales_checklist_entries;
drop table public.sales_checklist_week_staff;
drop table public.sales_checklist_week_duties;
drop table public.sales_checklist_weeks;
drop table public.sales_checklist_configurations;
drop function if exists public.sales_checklist_week_start();

create function public.read_sales_checklist(p_organisation_id uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.has_pins_hub_access_for_organisation(p_organisation_id) then
    raise exception 'Checklist access denied.' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.sales_checklist_assignments a
    left join public.organisation_members m
      on m.id = a.organisation_member_id and m.organisation_id = a.organisation_id
    left join public.app_access aa
      on aa.organisation_member_id = m.id
      and aa.app_key = 'pins_hub'
      and aa.access_level in ('read', 'write', 'admin', 'developer')
    where a.organisation_id = p_organisation_id
      and a.is_active
      and (m.id is null or not m.is_active or aa.id is null)
  ) then
    raise exception 'Checklist staff must be linked to active Hub users.' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'canClear', public.can_clear_sales_checklist(p_organisation_id),
    'duties', (
      select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name) order by d.display_order, d.id), '[]')
      from public.sales_checklist_duties d
      where d.organisation_id = p_organisation_id and d.is_active
    ),
    'staff', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id,
        'name', coalesce(nullif(trim(p.full_name), ''), p.email, u.email, a.display_name),
        'canEdit', public.can_edit_sales_checklist_status(a.organisation_id, a.id)
      ) order by a.display_order, a.id), '[]')
      from public.sales_checklist_assignments a
      join public.organisation_members m
        on m.id = a.organisation_member_id and m.organisation_id = a.organisation_id and m.is_active
      join public.app_access aa
        on aa.organisation_member_id = m.id
        and aa.app_key = 'pins_hub'
        and aa.access_level in ('read', 'write', 'admin', 'developer')
      left join public.profiles p on p.id = m.user_id
      left join auth.users u on u.id = m.user_id
      where a.organisation_id = p_organisation_id and a.is_active
    ),
    'entries', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id,
        'dutyId', s.duty_id,
        'staffId', s.assignment_id,
        'status', s.status
      )), '[]')
      from public.sales_checklist_statuses s
      join public.sales_checklist_duties d
        on d.id = s.duty_id and d.organisation_id = s.organisation_id and d.is_active
      join public.sales_checklist_assignments a
        on a.id = s.assignment_id and a.organisation_id = s.organisation_id and a.is_active
      where s.organisation_id = p_organisation_id
    )
  );
end $$;

create function public.read_sales_checklist_management(p_organisation_id uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.can_admin_sales_checklist(p_organisation_id) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'duties', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id,
        'name', d.name,
        'displayOrder', d.display_order,
        'isActive', d.is_active
      ) order by d.display_order, d.id), '[]')
      from public.sales_checklist_duties d
      where d.organisation_id = p_organisation_id
    ),
    'staff', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id,
        'name', a.display_name,
        'memberId', a.organisation_member_id,
        'displayOrder', a.display_order,
        'isActive', a.is_active
      ) order by a.display_order, a.id), '[]')
      from public.sales_checklist_assignments a
      where a.organisation_id = p_organisation_id
    ),
    'users', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id,
        'name', coalesce(nullif(trim(p.full_name), ''), p.email, u.email, 'Unnamed user'),
        'email', coalesce(p.email, u.email)
      ) order by p.full_name, p.email, m.id), '[]')
      from public.organisation_members m
      join public.app_access aa on aa.organisation_member_id = m.id
      left join public.profiles p on p.id = m.user_id
      left join auth.users u on u.id = m.user_id
      where m.organisation_id = p_organisation_id
        and m.is_active
        and aa.app_key = 'pins_hub'
        and aa.access_level in ('read', 'write', 'admin', 'developer')
    )
  );
end $$;

create function public.save_sales_checklist_management(
  p_organisation_id uuid,
  p_duties jsonb,
  p_staff jsonb
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare duty record; person record; actual_name text;
begin
  if not public.can_admin_sales_checklist(p_organisation_id) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sales-checklist:' || p_organisation_id::text, 0));

  if p_duties is null or p_staff is null
    or jsonb_typeof(p_duties) <> 'array' or jsonb_typeof(p_staff) <> 'array'
    or jsonb_array_length(p_duties) > 100 or jsonb_array_length(p_staff) > 100 then
    raise exception 'Invalid checklist configuration.' using errcode = '22023';
  end if;

  if exists (
      select 1 from jsonb_to_recordset(p_duties) as d(id uuid, name text, "displayOrder" integer, "isActive" boolean)
      where d.id is null or d.name is null or length(trim(d.name)) not between 1 and 120
        or d."displayOrder" is null or d."displayOrder" < 0 or d."isActive" is null
    )
    or (select count(distinct d.id) from jsonb_to_recordset(p_duties) as d(id uuid)) <> jsonb_array_length(p_duties)
    or (select count(distinct d."displayOrder") from jsonb_to_recordset(p_duties) as d("displayOrder" integer)) <> jsonb_array_length(p_duties)
    or (select count(distinct lower(trim(d.name))) from jsonb_to_recordset(p_duties) as d(name text)) <> jsonb_array_length(p_duties) then
    raise exception 'Invalid or duplicate duties.' using errcode = '22023';
  end if;

  if exists (
      select 1 from jsonb_to_recordset(p_staff) as s(id uuid, "memberId" uuid, "displayOrder" integer, "isActive" boolean)
      where s.id is null or s."displayOrder" is null or s."displayOrder" < 0 or s."isActive" is null
        or (s."isActive" and s."memberId" is null)
    )
    or (select count(distinct s.id) from jsonb_to_recordset(p_staff) as s(id uuid)) <> jsonb_array_length(p_staff)
    or (select count(distinct s."displayOrder") from jsonb_to_recordset(p_staff) as s("displayOrder" integer)) <> jsonb_array_length(p_staff)
    or exists (
      select s."memberId" from jsonb_to_recordset(p_staff) as s("memberId" uuid)
      where s."memberId" is not null group by s."memberId" having count(*) > 1
    )
    or not exists (select 1 from jsonb_to_recordset(p_staff) as s("isActive" boolean) where s."isActive") then
    raise exception 'Select unique organisation users and an active team.' using errcode = '22023';
  end if;

  if exists (
      select 1 from public.sales_checklist_duties d
      where d.organisation_id = p_organisation_id
        and not exists (select 1 from jsonb_to_recordset(p_duties) as r(id uuid) where r.id = d.id)
    ) or exists (
      select 1 from public.sales_checklist_assignments a
      where a.organisation_id = p_organisation_id
        and not exists (select 1 from jsonb_to_recordset(p_staff) as r(id uuid) where r.id = a.id)
    ) then
    raise exception 'Deactivate existing records instead of deleting them.' using errcode = '22023';
  end if;

  for duty in select * from jsonb_to_recordset(p_duties) as d(id uuid, name text, "displayOrder" integer, "isActive" boolean) loop
    if exists (select 1 from public.sales_checklist_duties d where d.id = duty.id and d.organisation_id <> p_organisation_id) then
      raise exception 'Invalid duty scope.' using errcode = '42501';
    end if;
    insert into public.sales_checklist_duties(id, organisation_id, name, display_order, is_active)
    values (duty.id, p_organisation_id, trim(duty.name), duty."displayOrder", duty."isActive")
    on conflict (id) do update set
      name = excluded.name,
      display_order = excluded.display_order,
      is_active = excluded.is_active;
  end loop;

  -- Clear links first so swapping two assignments cannot violate the organisation/member uniqueness constraint.
  update public.sales_checklist_assignments
  set organisation_member_id = null, monday_member_id = null
  where organisation_id = p_organisation_id;

  for person in select * from jsonb_to_recordset(p_staff) as s(id uuid, "memberId" uuid, "displayOrder" integer, "isActive" boolean) loop
    if exists (select 1 from public.sales_checklist_assignments a where a.id = person.id and a.organisation_id <> p_organisation_id) then
      raise exception 'Invalid assignment scope.' using errcode = '42501';
    end if;

    actual_name := null;
    if person."memberId" is not null then
      select coalesce(nullif(trim(p.full_name), ''), p.email, u.email, 'Unnamed user')
      into actual_name
      from public.organisation_members m
      left join public.profiles p on p.id = m.user_id
      left join auth.users u on u.id = m.user_id
      join public.app_access aa on aa.organisation_member_id = m.id
      where m.id = person."memberId"
        and m.organisation_id = p_organisation_id
        and (not person."isActive" or m.is_active)
        and aa.app_key = 'pins_hub'
        and aa.access_level in ('read', 'write', 'admin', 'developer');
      if actual_name is null then
        raise exception 'Select an eligible organisation user.' using errcode = '22023';
      end if;
    end if;

    if actual_name is null then
      select a.display_name into actual_name
      from public.sales_checklist_assignments a
      where a.id = person.id and a.organisation_id = p_organisation_id;
    end if;
    if actual_name is null then
      raise exception 'Select an organisation user.' using errcode = '22023';
    end if;

    insert into public.sales_checklist_assignments(
      id, organisation_id, staff_key, display_name, organisation_member_id, display_order, is_active
    ) values (
      person.id, p_organisation_id, person.id::text, actual_name, person."memberId", person."displayOrder", person."isActive"
    )
    on conflict (id) do update set
      display_name = excluded.display_name,
      organisation_member_id = excluded.organisation_member_id,
      display_order = excluded.display_order,
      is_active = excluded.is_active;
  end loop;

  delete from public.sales_checklist_statuses s
  where s.organisation_id = p_organisation_id
    and (
      not exists (
        select 1 from public.sales_checklist_duties d
        where d.organisation_id = s.organisation_id and d.id = s.duty_id and d.is_active
      )
      or not exists (
        select 1 from public.sales_checklist_assignments a
        where a.organisation_id = s.organisation_id and a.id = s.assignment_id and a.is_active
      )
    );

  insert into public.sales_checklist_statuses(organisation_id, duty_id, assignment_id)
  select d.organisation_id, d.id, a.id
  from public.sales_checklist_duties d
  join public.sales_checklist_assignments a on a.organisation_id = d.organisation_id
  where d.organisation_id = p_organisation_id and d.is_active and a.is_active
  on conflict (organisation_id, duty_id, assignment_id) do nothing;
end $$;

create function public.reset_sales_checklist(p_organisation_id uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare changed integer;
begin
  if auth.role() is distinct from 'service_role'
    and not public.can_clear_sales_checklist(p_organisation_id) then
    raise exception 'Checklist reset denied.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('sales-checklist:' || p_organisation_id::text, 0));
  update public.sales_checklist_statuses
  set status = 'to_do'
  where organisation_id = p_organisation_id and status <> 'to_do';
  get diagnostics changed = row_count;
  return changed;
end $$;

create function public.reset_all_sales_checklists() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare organisation_id uuid; processed integer := 0; failed integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required.' using errcode = '42501';
  end if;

  for organisation_id in
    select distinct a.organisation_id from public.sales_checklist_assignments a where a.is_active
  loop
    begin
      perform public.reset_sales_checklist(organisation_id);
      processed := processed + 1;
    exception when others then
      failed := failed + 1;
    end;
  end loop;
  return case when failed > 0 then -failed else processed end;
end $$;

revoke all on function public.read_sales_checklist(uuid),
  public.read_sales_checklist_management(uuid),
  public.save_sales_checklist_management(uuid, jsonb, jsonb),
  public.reset_sales_checklist(uuid),
  public.reset_all_sales_checklists()
from public, anon;

grant execute on function public.read_sales_checklist(uuid),
  public.read_sales_checklist_management(uuid),
  public.save_sales_checklist_management(uuid, jsonb, jsonb),
  public.reset_sales_checklist(uuid)
to authenticated;

grant execute on function public.reset_sales_checklist(uuid),
  public.reset_all_sales_checklists()
to service_role;
