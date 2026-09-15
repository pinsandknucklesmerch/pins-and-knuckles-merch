-- Batch 2C-2B: Organisation-to-Band relationships and explicit assignments.
-- Direct Band membership and ownership remain independent and unchanged.

begin;

set local search_path = pg_catalog, public, pg_temp;

create or replace function public.merchbuddy_organisation_assignment_ceiling(
  p_organisation_member_id uuid,
  p_organisation_id uuid
)
returns integer
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select coalesce(max(
    case access.access_level
      when 'read' then 1
      when 'write' then 3
      when 'admin' then 3
      when 'developer' then 3
      else 0
    end
  ), 0)
  from public.organisation_members membership
  join public.app_access access
    on access.organisation_member_id = membership.id
  where membership.id = p_organisation_member_id
    and membership.organisation_id = p_organisation_id
    and membership.is_active
    and access.app_key in ('pins_hub', 'merchbuddy');
$$;

revoke all on function public.merchbuddy_organisation_assignment_ceiling(uuid, uuid)
  from public, anon, authenticated, service_role;

create or replace function public.request_merchbuddy_band_organisation_attachment(
  p_customer_id uuid,
  p_organisation_id uuid
)
returns public.merchbuddy_band_organisations
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_relationship public.merchbuddy_band_organisations%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to request an Organisation attachment.' using errcode = '42501';
  end if;
  if p_organisation_id is null then
    raise exception 'An Organisation is required.' using errcode = '22023';
  end if;

  perform 1
  from public.merchbuddy_customers band
  where band.id = p_customer_id
  for update;
  if not found then
    raise exception 'Band not found.' using errcode = '22023';
  end if;
  if not public.can_administer_merchbuddy_band(p_customer_id) then
    raise exception 'Only an active direct Band owner can request an Organisation attachment.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.organisations organisation where organisation.id = p_organisation_id) then
    raise exception 'Organisation not found.' using errcode = '22023';
  end if;

  select * into v_relationship
  from public.merchbuddy_band_organisations relationship
  where relationship.customer_id = p_customer_id
    and relationship.organisation_id = p_organisation_id
  for update;

  if found and v_relationship.status = 'active' then
    raise exception 'This Organisation is already actively attached to the Band.' using errcode = '23505';
  end if;
  if found and v_relationship.status = 'pending' then
    raise exception 'An Organisation attachment request is already pending.' using errcode = '23505';
  end if;

  if found then
    update public.merchbuddy_band_organisations
    set status = 'pending',
        requested_at = now(),
        requested_by = v_caller_id,
        accepted_at = null,
        accepted_by = null,
        revoked_at = null,
        revoked_by = null,
        source = 'band_organisation_relationship_request',
        metadata = metadata || jsonb_build_object(
          'event', 'relationship_requested',
          'requested_by', v_caller_id,
          're_request', true
        )
    where id = v_relationship.id
    returning * into v_relationship;
  else
    insert into public.merchbuddy_band_organisations (
      customer_id, organisation_id, status, requested_by, source, metadata
    )
    values (
      p_customer_id, p_organisation_id, 'pending', v_caller_id,
      'band_organisation_relationship_request',
      jsonb_build_object(
        'event', 'relationship_requested',
        'requested_by', v_caller_id
      )
    )
    returning * into v_relationship;
  end if;

  return v_relationship;
end;
$$;

create or replace function public.accept_merchbuddy_band_organisation_attachment(
  p_band_organisation_id uuid
)
returns public.merchbuddy_band_organisations
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_customer_id uuid;
  v_relationship public.merchbuddy_band_organisations%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to accept an Organisation attachment.' using errcode = '42501';
  end if;

  select relationship.customer_id into v_customer_id
  from public.merchbuddy_band_organisations relationship
  where relationship.id = p_band_organisation_id;
  if v_customer_id is null then
    raise exception 'Organisation attachment request not found.' using errcode = '22023';
  end if;

  perform 1 from public.merchbuddy_customers band where band.id = v_customer_id for update;
  if not found then
    raise exception 'Band not found.' using errcode = '22023';
  end if;
  select * into v_relationship
  from public.merchbuddy_band_organisations relationship
  where relationship.id = p_band_organisation_id
  for update;

  if v_relationship.status <> 'pending' then
    raise exception 'Organisation attachment is no longer pending.' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.merchbuddy_band_members member
    where member.customer_id = v_relationship.customer_id
      and member.profile_id = v_relationship.requested_by
      and member.role = 'owner'
      and member.status = 'active'
  ) then
    raise exception 'The requesting Band owner no longer has authority.' using errcode = '42501';
  end if;
  if not public.has_merchbuddy_access_for_organisation(v_relationship.organisation_id, 'admin') then
    raise exception 'Pins Hub or Pins Merch admin/developer access is required to accept this attachment.' using errcode = '42501';
  end if;

  update public.merchbuddy_band_organisations
  set status = 'active',
      accepted_at = now(),
      accepted_by = v_caller_id,
      source = 'band_organisation_relationship_acceptance',
      metadata = metadata || jsonb_build_object(
        'event', 'relationship_accepted',
        'accepted_by', v_caller_id
      )
  where id = v_relationship.id
  returning * into v_relationship;

  return v_relationship;
end;
$$;

create or replace function public.remove_merchbuddy_band_organisation(
  p_band_organisation_id uuid
)
returns public.merchbuddy_band_organisations
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_customer_id uuid;
  v_relationship public.merchbuddy_band_organisations%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to remove an Organisation attachment.' using errcode = '42501';
  end if;
  select relationship.customer_id into v_customer_id
  from public.merchbuddy_band_organisations relationship
  where relationship.id = p_band_organisation_id;
  if v_customer_id is null then
    raise exception 'Organisation relationship not found.' using errcode = '22023';
  end if;

  perform 1 from public.merchbuddy_customers band where band.id = v_customer_id for update;
  if not found then raise exception 'Band not found.' using errcode = '22023'; end if;
  if not public.can_administer_merchbuddy_band(v_customer_id) then
    raise exception 'Only an active direct Band owner can remove an Organisation relationship.' using errcode = '42501';
  end if;
  select * into v_relationship
  from public.merchbuddy_band_organisations relationship
  where relationship.id = p_band_organisation_id
  for update;
  if v_relationship.status = 'revoked' then
    raise exception 'Organisation relationship is already revoked.' using errcode = '22023';
  end if;

  update public.merchbuddy_band_organisation_assignments assignment
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = v_caller_id,
      source = 'band_organisation_relationship_removal',
      metadata = metadata || jsonb_build_object(
        'event', 'relationship_removed',
        'removed_by', v_caller_id
      )
  where assignment.band_organisation_id = v_relationship.id
    and assignment.status = 'active';

  update public.merchbuddy_band_organisations
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = v_caller_id,
      source = 'band_organisation_relationship_removal',
      metadata = metadata || jsonb_build_object(
        'event', 'relationship_removed',
        'removed_by', v_caller_id
      )
  where id = v_relationship.id
  returning * into v_relationship;

  return v_relationship;
end;
$$;

create or replace function public.relinquish_merchbuddy_band_organisation(
  p_band_organisation_id uuid
)
returns public.merchbuddy_band_organisations
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_customer_id uuid;
  v_relationship public.merchbuddy_band_organisations%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to relinquish an Organisation relationship.' using errcode = '42501';
  end if;
  select relationship.customer_id into v_customer_id
  from public.merchbuddy_band_organisations relationship
  where relationship.id = p_band_organisation_id;
  if v_customer_id is null then
    raise exception 'Organisation relationship not found.' using errcode = '22023';
  end if;

  perform 1 from public.merchbuddy_customers band where band.id = v_customer_id for update;
  if not found then raise exception 'Band not found.' using errcode = '22023'; end if;
  select * into v_relationship
  from public.merchbuddy_band_organisations relationship
  where relationship.id = p_band_organisation_id
  for update;
  if v_relationship.status <> 'active' then
    raise exception 'Only an active Organisation relationship can be relinquished.' using errcode = '22023';
  end if;
  if not public.has_merchbuddy_access_for_organisation(v_relationship.organisation_id, 'admin') then
    raise exception 'Pins Hub or Pins Merch admin/developer access is required to relinquish this relationship.' using errcode = '42501';
  end if;

  update public.merchbuddy_band_organisation_assignments assignment
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = v_caller_id,
      source = 'band_organisation_relationship_relinquishment',
      metadata = metadata || jsonb_build_object(
        'event', 'relationship_relinquished',
        'relinquished_by', v_caller_id
      )
  where assignment.band_organisation_id = v_relationship.id
    and assignment.status = 'active';

  update public.merchbuddy_band_organisations
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = v_caller_id,
      source = 'band_organisation_relationship_relinquishment',
      metadata = metadata || jsonb_build_object(
        'event', 'relationship_relinquished',
        'relinquished_by', v_caller_id
      )
  where id = v_relationship.id
  returning * into v_relationship;

  return v_relationship;
end;
$$;

create or replace function public.assign_merchbuddy_band_organisation_member(
  p_band_organisation_id uuid,
  p_organisation_member_id uuid,
  p_role text
)
returns public.merchbuddy_band_organisation_assignments
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_customer_id uuid;
  v_relationship public.merchbuddy_band_organisations%rowtype;
  v_assignment public.merchbuddy_band_organisation_assignments%rowtype;
  v_ceiling integer;
  v_role_rank integer;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to assign an Organisation member.' using errcode = '42501';
  end if;
  v_role_rank := case p_role when 'viewer' then 1 when 'staff' then 2 when 'manager' then 3 else 0 end;
  if v_role_rank = 0 then
    raise exception 'Organisation assignment role must be viewer, staff, or manager.' using errcode = '22023';
  end if;

  select relationship.customer_id into v_customer_id
  from public.merchbuddy_band_organisations relationship where relationship.id = p_band_organisation_id;
  if v_customer_id is null then raise exception 'Organisation relationship not found.' using errcode = '22023'; end if;
  perform 1 from public.merchbuddy_customers band where band.id = v_customer_id for update;
  if not found then raise exception 'Band not found.' using errcode = '22023'; end if;
  if not public.can_administer_merchbuddy_band(v_customer_id) then
    raise exception 'Only an active direct Band owner can assign Organisation members.' using errcode = '42501';
  end if;
  select * into v_relationship from public.merchbuddy_band_organisations relationship
  where relationship.id = p_band_organisation_id for update;
  if v_relationship.status <> 'active' then
    raise exception 'Organisation relationship must be active before assigning members.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.organisation_members membership
    where membership.id = p_organisation_member_id
      and membership.organisation_id = v_relationship.organisation_id
      and membership.is_active
  ) then
    raise exception 'Organisation member must be active and belong to the attached Organisation.' using errcode = '22023';
  end if;
  v_ceiling := public.merchbuddy_organisation_assignment_ceiling(
    p_organisation_member_id, v_relationship.organisation_id
  );
  if v_ceiling = 0 or v_role_rank > v_ceiling then
    raise exception 'Assignment role exceeds the Organisation member entitlement ceiling.' using errcode = '42501';
  end if;

  select * into v_assignment from public.merchbuddy_band_organisation_assignments assignment
  where assignment.band_organisation_id = v_relationship.id
    and assignment.organisation_member_id = p_organisation_member_id
  for update;
  if found and v_assignment.status = 'active' then
    raise exception 'Organisation member is already assigned to this Band.' using errcode = '23505';
  end if;

  if found then
    update public.merchbuddy_band_organisation_assignments
    set role = p_role,
        status = 'active',
        revoked_at = null,
        revoked_by = null,
        source = 'band_organisation_member_assignment',
        metadata = metadata || jsonb_build_object(
          'event', 'member_assigned',
          'assigned_by', v_caller_id,
          'reassigned', true,
          'role', p_role
        )
    where id = v_assignment.id
    returning * into v_assignment;
  else
    insert into public.merchbuddy_band_organisation_assignments (
      band_organisation_id, organisation_member_id, organisation_id, role,
      status, created_by, source, metadata
    )
    values (
      v_relationship.id, p_organisation_member_id, v_relationship.organisation_id, p_role,
      'active', v_caller_id, 'band_organisation_member_assignment',
      jsonb_build_object('event', 'member_assigned', 'assigned_by', v_caller_id, 'role', p_role)
    )
    returning * into v_assignment;
  end if;
  return v_assignment;
end;
$$;

create or replace function public.change_merchbuddy_band_organisation_assignment_role(
  p_band_organisation_id uuid,
  p_organisation_member_id uuid,
  p_role text
)
returns public.merchbuddy_band_organisation_assignments
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_customer_id uuid;
  v_relationship public.merchbuddy_band_organisations%rowtype;
  v_assignment public.merchbuddy_band_organisation_assignments%rowtype;
  v_ceiling integer;
  v_role_rank integer;
begin
  if v_caller_id is null then raise exception 'Authentication required to change an Organisation assignment.' using errcode = '42501'; end if;
  v_role_rank := case p_role when 'viewer' then 1 when 'staff' then 2 when 'manager' then 3 else 0 end;
  if v_role_rank = 0 then raise exception 'Organisation assignment role must be viewer, staff, or manager.' using errcode = '22023'; end if;

  select relationship.customer_id into v_customer_id from public.merchbuddy_band_organisations relationship where relationship.id = p_band_organisation_id;
  if v_customer_id is null then raise exception 'Organisation relationship not found.' using errcode = '22023'; end if;
  perform 1 from public.merchbuddy_customers band where band.id = v_customer_id for update;
  if not found then raise exception 'Band not found.' using errcode = '22023'; end if;
  if not public.can_administer_merchbuddy_band(v_customer_id) then raise exception 'Only an active direct Band owner can change Organisation assignment roles.' using errcode = '42501'; end if;
  select * into v_relationship from public.merchbuddy_band_organisations relationship where relationship.id = p_band_organisation_id for update;
  if v_relationship.status <> 'active' then raise exception 'Organisation relationship must be active before changing assignments.' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.organisation_members membership
    where membership.id = p_organisation_member_id and membership.organisation_id = v_relationship.organisation_id and membership.is_active
  ) then raise exception 'Organisation member must be active and belong to the attached Organisation.' using errcode = '22023'; end if;
  v_ceiling := public.merchbuddy_organisation_assignment_ceiling(p_organisation_member_id, v_relationship.organisation_id);
  if v_ceiling = 0 or v_role_rank > v_ceiling then raise exception 'Assignment role exceeds the Organisation member entitlement ceiling.' using errcode = '42501'; end if;

  select * into v_assignment from public.merchbuddy_band_organisation_assignments assignment
  where assignment.band_organisation_id = v_relationship.id
    and assignment.organisation_member_id = p_organisation_member_id
    and assignment.status = 'active'
  for update;
  if not found then raise exception 'Active Organisation assignment not found; revoked assignments require explicit reassignment.' using errcode = '22023'; end if;

  update public.merchbuddy_band_organisation_assignments
  set role = p_role,
      source = 'band_organisation_assignment_role_change',
      metadata = metadata || jsonb_build_object(
        'event', 'assignment_role_changed',
        'changed_by', v_caller_id,
        'role', p_role
      )
  where id = v_assignment.id
  returning * into v_assignment;
  return v_assignment;
end;
$$;

create or replace function public.revoke_merchbuddy_band_organisation_assignment(
  p_band_organisation_id uuid,
  p_organisation_member_id uuid
)
returns public.merchbuddy_band_organisation_assignments
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_customer_id uuid;
  v_relationship public.merchbuddy_band_organisations%rowtype;
  v_assignment public.merchbuddy_band_organisation_assignments%rowtype;
begin
  if v_caller_id is null then raise exception 'Authentication required to revoke an Organisation assignment.' using errcode = '42501'; end if;
  select relationship.customer_id into v_customer_id from public.merchbuddy_band_organisations relationship where relationship.id = p_band_organisation_id;
  if v_customer_id is null then raise exception 'Organisation relationship not found.' using errcode = '22023'; end if;
  perform 1 from public.merchbuddy_customers band where band.id = v_customer_id for update;
  if not found then raise exception 'Band not found.' using errcode = '22023'; end if;
  if not public.can_administer_merchbuddy_band(v_customer_id) then raise exception 'Only an active direct Band owner can revoke Organisation assignments.' using errcode = '42501'; end if;
  select * into v_relationship from public.merchbuddy_band_organisations relationship where relationship.id = p_band_organisation_id for update;
  if v_relationship.status <> 'active' then raise exception 'Organisation relationship must be active before revoking assignments.' using errcode = '22023'; end if;
  select * into v_assignment from public.merchbuddy_band_organisation_assignments assignment
  where assignment.band_organisation_id = v_relationship.id
    and assignment.organisation_member_id = p_organisation_member_id
    and assignment.status = 'active'
  for update;
  if not found then raise exception 'Active Organisation assignment not found.' using errcode = '22023'; end if;

  update public.merchbuddy_band_organisation_assignments
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = v_caller_id,
      source = 'band_organisation_assignment_revocation',
      metadata = metadata || jsonb_build_object(
        'event', 'assignment_revoked',
        'revoked_by', v_caller_id
      )
  where id = v_assignment.id
  returning * into v_assignment;
  return v_assignment;
end;
$$;

create or replace function public.get_assignable_merchbuddy_band_organisation_members(
  p_band_organisation_id uuid
)
returns table (
  organisation_member_id uuid,
  profile_id uuid,
  full_name text,
  email text,
  entitlement_ceiling text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_relationship public.merchbuddy_band_organisations%rowtype;
begin
  if v_caller_id is null then raise exception 'Authentication required to view assignable Organisation members.' using errcode = '42501'; end if;
  select * into v_relationship
  from public.merchbuddy_band_organisations relationship
  where relationship.id = p_band_organisation_id;
  if not found or v_relationship.status <> 'active' then
    raise exception 'Active Organisation relationship not found.' using errcode = '22023';
  end if;
  if not public.can_administer_merchbuddy_band(v_relationship.customer_id) then
    raise exception 'Only an active direct Band owner can view assignable Organisation members.' using errcode = '42501';
  end if;

  return query
  select
    membership.id,
    profile.id,
    profile.full_name,
    profile.email,
    case
      when ceiling.rank >= 3 then 'manager'
      when ceiling.rank = 1 then 'viewer'
      else null
    end
  from public.organisation_members membership
  join public.profiles profile on profile.id = membership.user_id
  join lateral (
    select public.merchbuddy_organisation_assignment_ceiling(membership.id, membership.organisation_id) as rank
  ) ceiling on true
  where membership.organisation_id = v_relationship.organisation_id
    and membership.is_active
    and ceiling.rank > 0
  order by lower(coalesce(profile.full_name, profile.email)), profile.id;
end;
$$;

comment on function public.merchbuddy_organisation_assignment_ceiling(uuid, uuid)
  is 'Internal target-membership entitlement ceiling: read is viewer; write/admin/developer are manager.';
comment on function public.request_merchbuddy_band_organisation_attachment(uuid, uuid)
  is 'Direct owner initiates a pending Organisation attachment; a revoked relationship is re-requested, never directly reactivated.';
comment on function public.accept_merchbuddy_band_organisation_attachment(uuid)
  is 'Target-Organisation admin/developer accepts a pending direct-owner request. No assignments are created.';
comment on function public.remove_merchbuddy_band_organisation(uuid)
  is 'Direct owner revokes a relationship and its active Organisation assignments without affecting direct Band members.';
comment on function public.relinquish_merchbuddy_band_organisation(uuid)
  is 'Target-Organisation admin/developer relinquishes its active relationship and active assignments.';
comment on function public.assign_merchbuddy_band_organisation_member(uuid, uuid, text)
  is 'Direct owner explicitly assigns one eligible Organisation member to one active Band relationship.';
comment on function public.change_merchbuddy_band_organisation_assignment_role(uuid, uuid, text)
  is 'Direct owner changes an active Organisation assignment within the target member entitlement ceiling.';
comment on function public.revoke_merchbuddy_band_organisation_assignment(uuid, uuid)
  is 'Direct owner soft-revokes one active Organisation assignment only.';
comment on function public.get_assignable_merchbuddy_band_organisation_members(uuid)
  is 'Direct-owner-only minimal lookup of active, entitled members for one active attached Organisation.';

revoke all on function public.request_merchbuddy_band_organisation_attachment(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.accept_merchbuddy_band_organisation_attachment(uuid) from public, anon, authenticated, service_role;
revoke all on function public.remove_merchbuddy_band_organisation(uuid) from public, anon, authenticated, service_role;
revoke all on function public.relinquish_merchbuddy_band_organisation(uuid) from public, anon, authenticated, service_role;
revoke all on function public.assign_merchbuddy_band_organisation_member(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.change_merchbuddy_band_organisation_assignment_role(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.revoke_merchbuddy_band_organisation_assignment(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.get_assignable_merchbuddy_band_organisation_members(uuid) from public, anon, authenticated, service_role;

grant execute on function public.request_merchbuddy_band_organisation_attachment(uuid, uuid) to authenticated;
grant execute on function public.accept_merchbuddy_band_organisation_attachment(uuid) to authenticated;
grant execute on function public.remove_merchbuddy_band_organisation(uuid) to authenticated;
grant execute on function public.relinquish_merchbuddy_band_organisation(uuid) to authenticated;
grant execute on function public.assign_merchbuddy_band_organisation_member(uuid, uuid, text) to authenticated;
grant execute on function public.change_merchbuddy_band_organisation_assignment_role(uuid, uuid, text) to authenticated;
grant execute on function public.revoke_merchbuddy_band_organisation_assignment(uuid, uuid) to authenticated;
grant execute on function public.get_assignable_merchbuddy_band_organisation_members(uuid) to authenticated;

commit;
