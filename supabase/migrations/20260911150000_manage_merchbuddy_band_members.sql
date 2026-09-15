-- Batch 2C-2A: direct Band membership and ownership administration.
-- Organisation relationships and assignments remain outside this migration.

begin;

set local search_path = pg_catalog, public, pg_temp;

create table public.merchbuddy_band_invitations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.merchbuddy_customers(id) on delete restrict,
  invited_profile_id uuid not null references public.profiles(id) on delete restrict,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  role text not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'band_invitation',
  metadata jsonb not null default '{}'::jsonb,
  constraint merchbuddy_band_invitations_role_chk
    check (role in ('viewer', 'staff', 'manager', 'owner')),
  constraint merchbuddy_band_invitations_status_chk
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  constraint merchbuddy_band_invitations_state_chk
    check (
      (status = 'pending' and accepted_at is null and accepted_by is null and revoked_at is null and revoked_by is null)
      or (status = 'accepted' and accepted_at is not null and accepted_by is not null and revoked_at is null and revoked_by is null)
      or (status in ('revoked', 'expired') and revoked_at is not null and accepted_at is null and accepted_by is null)
    ),
  constraint merchbuddy_band_invitations_source_chk
    check (length(trim(source)) > 0),
  constraint merchbuddy_band_invitations_metadata_chk
    check (jsonb_typeof(metadata) = 'object')
);

create unique index merchbuddy_band_invitations_pending_target_key
  on public.merchbuddy_band_invitations (customer_id, invited_profile_id)
  where status = 'pending';

create index merchbuddy_band_invitations_target_status_idx
  on public.merchbuddy_band_invitations (invited_profile_id, status, expires_at);

create trigger set_merchbuddy_band_invitations_updated_at
  before update on public.merchbuddy_band_invitations
  for each row execute function public.set_updated_at();

create or replace function public.merchbuddy_enforce_active_direct_band_owner()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_customer_id uuid;
begin
  if tg_op = 'DELETE' then
    v_customer_id := old.customer_id;
  else
    v_customer_id := new.customer_id;
  end if;

  if not exists (
    select 1
    from public.merchbuddy_band_members member
    where member.customer_id = v_customer_id
      and member.status = 'active'
      and member.role = 'owner'
  ) then
    raise exception 'A Band must retain at least one active direct owner.' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create constraint trigger merchbuddy_band_members_owner_invariant
  after insert or update or delete on public.merchbuddy_band_members
  deferrable initially deferred
  for each row execute function public.merchbuddy_enforce_active_direct_band_owner();

revoke all on function public.merchbuddy_enforce_active_direct_band_owner()
  from public, anon, authenticated, service_role;

comment on table public.merchbuddy_band_invitations
  is 'Private direct Band invitations. Pending invitations never authorize Band data and are accepted only by the invited profile.';
comment on function public.merchbuddy_enforce_active_direct_band_owner()
  is 'Deferred database invariant: every committed Band has at least one active direct owner.';

alter table public.merchbuddy_band_invitations enable row level security;
revoke all on table public.merchbuddy_band_invitations from public, anon, authenticated, service_role;
grant select, insert, update on table public.merchbuddy_band_invitations to service_role;

create or replace function public.invite_merchbuddy_band_member(
  p_customer_id uuid,
  p_profile_id uuid,
  p_role text
)
returns public.merchbuddy_band_invitations
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_invitation public.merchbuddy_band_invitations%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to invite a Band member.' using errcode = '42501';
  end if;

  if p_profile_id is null or p_profile_id = v_caller_id then
    raise exception 'A different existing profile must be invited.' using errcode = '22023';
  end if;

  if p_role is null or p_role not in ('viewer', 'staff', 'manager', 'owner') then
    raise exception 'Band member role must be viewer, staff, manager, or owner.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles profile where profile.id = p_profile_id) then
    raise exception 'The invited profile does not exist.' using errcode = '22023';
  end if;

  perform 1
  from public.merchbuddy_customers band
  where band.id = p_customer_id
  for update;

  if not found then
    raise exception 'Band not found.' using errcode = '22023';
  end if;

  if not public.can_administer_merchbuddy_band(p_customer_id) then
    raise exception 'Only a direct Band owner can invite members.' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.merchbuddy_band_members member
    where member.customer_id = p_customer_id
      and member.profile_id = p_profile_id
      and member.status = 'active'
  ) then
    raise exception 'The profile is already an active direct Band member.' using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.merchbuddy_band_invitations invitation
    where invitation.customer_id = p_customer_id
      and invitation.invited_profile_id = p_profile_id
      and invitation.status = 'pending'
  ) then
    raise exception 'A pending invitation already exists for this profile.' using errcode = '23505';
  end if;

  insert into public.merchbuddy_band_invitations (
    customer_id, invited_profile_id, invited_by, role, expires_at, source, metadata
  )
  values (
    p_customer_id, p_profile_id, v_caller_id, p_role, now() + interval '7 days',
    'band_invitation',
    jsonb_build_object(
      'event', 'invitation',
      'invited_by', v_caller_id,
      'role', p_role
    )
  )
  returning * into v_invitation;

  return v_invitation;
end;
$$;

create or replace function public.accept_merchbuddy_band_invitation(
  p_invitation_id uuid
)
returns public.merchbuddy_band_members
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_invitation public.merchbuddy_band_invitations%rowtype;
  v_band public.merchbuddy_customers%rowtype;
  v_member public.merchbuddy_band_members%rowtype;
  v_existing_role text;
  v_effective_role text;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to accept a Band invitation.' using errcode = '42501';
  end if;

  select * into v_invitation
  from public.merchbuddy_band_invitations invitation
  where invitation.id = p_invitation_id
  for update;

  if not found then
    raise exception 'Band invitation not found.' using errcode = '22023';
  end if;

  if v_invitation.invited_profile_id <> v_caller_id then
    raise exception 'This invitation belongs to another profile.' using errcode = '42501';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Band invitation is no longer active.' using errcode = '22023';
  end if;

  if v_invitation.expires_at <= now() then
    update public.merchbuddy_band_invitations
    set status = 'expired', revoked_at = now(), metadata = metadata || jsonb_build_object('event', 'expired')
    where id = v_invitation.id;
    raise exception 'Band invitation has expired.' using errcode = '22023';
  end if;

  select * into v_band
  from public.merchbuddy_customers band
  where band.id = v_invitation.customer_id
  for update;

  if not found then
    raise exception 'Band no longer exists.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.merchbuddy_band_members member
    where member.customer_id = v_band.id
      and member.profile_id = v_invitation.invited_by
      and member.role = 'owner'
      and member.status = 'active'
  ) then
    raise exception 'The inviting owner no longer has authority for this Band.' using errcode = '42501';
  end if;

  select member.role into v_existing_role
  from public.merchbuddy_band_members member
  where member.customer_id = v_band.id
    and member.profile_id = v_caller_id
  for update;

  if v_existing_role is not null then
    if exists (
      select 1 from public.merchbuddy_band_members member
      where member.customer_id = v_band.id and member.profile_id = v_caller_id and member.status = 'active'
    ) then
      raise exception 'The profile is already an active direct Band member; use the role-change operation explicitly.' using errcode = '23505';
    end if;

    v_effective_role := case
      when v_existing_role = 'owner' or (v_existing_role = 'manager' and v_invitation.role in ('viewer', 'staff')) or (v_existing_role = 'staff' and v_invitation.role = 'viewer') then v_existing_role
      else v_invitation.role
    end;

    update public.merchbuddy_band_members
    set role = v_effective_role,
        status = 'active',
        revoked_at = null,
        revoked_by = null,
        source = 'band_invitation_acceptance',
        metadata = metadata || jsonb_build_object(
          'event', 'acceptance',
          'invitation_id', v_invitation.id,
          'invited_role', v_invitation.role,
          'accepted_by', v_caller_id
        )
    where customer_id = v_band.id and profile_id = v_caller_id
    returning * into v_member;
  else
    insert into public.merchbuddy_band_members (
      customer_id, profile_id, role, status, created_by, source, metadata
    )
    values (
      v_band.id, v_caller_id, v_invitation.role, 'active', v_invitation.invited_by,
      'band_invitation_acceptance',
      jsonb_build_object(
        'event', 'acceptance',
        'invitation_id', v_invitation.id,
        'invited_by', v_invitation.invited_by,
        'accepted_by', v_caller_id
      )
    )
    returning * into v_member;
  end if;

  update public.merchbuddy_band_invitations
  set status = 'accepted', accepted_at = now(), accepted_by = v_caller_id,
      source = 'band_invitation_acceptance',
      metadata = metadata || jsonb_build_object('event', 'acceptance', 'accepted_by', v_caller_id)
  where id = v_invitation.id;

  return v_member;
end;
$$;

create or replace function public.change_merchbuddy_band_member_role(
  p_customer_id uuid,
  p_profile_id uuid,
  p_role text
)
returns public.merchbuddy_band_members
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_member public.merchbuddy_band_members%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to change Band membership.' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('viewer', 'staff', 'manager', 'owner') then
    raise exception 'Band member role must be viewer, staff, manager, or owner.' using errcode = '22023';
  end if;

  perform 1 from public.merchbuddy_customers band where band.id = p_customer_id for update;
  if not found then raise exception 'Band not found.' using errcode = '22023'; end if;
  if not public.can_administer_merchbuddy_band(p_customer_id) then
    raise exception 'Only a direct Band owner can change member roles.' using errcode = '42501';
  end if;

  select * into v_member from public.merchbuddy_band_members member
  where member.customer_id = p_customer_id and member.profile_id = p_profile_id and member.status = 'active'
  for update;
  if not found then raise exception 'Active direct Band membership not found.' using errcode = '22023'; end if;

  update public.merchbuddy_band_members
  set role = p_role,
      source = 'band_role_change',
      metadata = metadata || jsonb_build_object('event', 'role_change', 'changed_by', v_caller_id, 'new_role', p_role)
  where customer_id = p_customer_id and profile_id = p_profile_id
  returning * into v_member;

  if not exists (
    select 1 from public.merchbuddy_band_members member
    where member.customer_id = p_customer_id and member.status = 'active' and member.role = 'owner'
  ) then
    raise exception 'A Band must retain at least one active direct owner.' using errcode = '23514';
  end if;
  return v_member;
end;
$$;

create or replace function public.revoke_merchbuddy_band_member(
  p_customer_id uuid,
  p_profile_id uuid
)
returns public.merchbuddy_band_members
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_member public.merchbuddy_band_members%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to leave or revoke Band membership.' using errcode = '42501';
  end if;

  perform 1 from public.merchbuddy_customers band where band.id = p_customer_id for update;
  if not found then raise exception 'Band not found.' using errcode = '22023'; end if;

  if p_profile_id <> v_caller_id and not public.can_administer_merchbuddy_band(p_customer_id) then
    raise exception 'Only a direct Band owner can revoke another member.' using errcode = '42501';
  end if;

  select * into v_member from public.merchbuddy_band_members member
  where member.customer_id = p_customer_id and member.profile_id = p_profile_id and member.status = 'active'
  for update;
  if not found then raise exception 'Active direct Band membership not found.' using errcode = '22023'; end if;

  update public.merchbuddy_band_members
  set status = 'revoked', revoked_at = now(), revoked_by = v_caller_id,
      source = 'band_membership_revocation',
      metadata = metadata || jsonb_build_object('event', 'revocation', 'revoked_by', v_caller_id)
  where customer_id = p_customer_id and profile_id = p_profile_id
  returning * into v_member;

  if not exists (
    select 1 from public.merchbuddy_band_members member
    where member.customer_id = p_customer_id and member.status = 'active' and member.role = 'owner'
  ) then
    raise exception 'A Band must retain at least one active direct owner.' using errcode = '23514';
  end if;
  return v_member;
end;
$$;

create or replace function public.transfer_merchbuddy_band_ownership(
  p_customer_id uuid,
  p_target_profile_id uuid,
  p_demote_caller boolean default true
)
returns public.merchbuddy_band_members
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_target public.merchbuddy_band_members%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to transfer Band ownership.' using errcode = '42501';
  end if;
  if p_target_profile_id is null or p_target_profile_id = v_caller_id then
    raise exception 'Ownership must be transferred to a different direct member.' using errcode = '22023';
  end if;

  perform 1 from public.merchbuddy_customers band where band.id = p_customer_id for update;
  if not found then raise exception 'Band not found.' using errcode = '22023'; end if;
  if not public.can_administer_merchbuddy_band(p_customer_id) then
    raise exception 'Only an active direct Band owner can transfer ownership.' using errcode = '42501';
  end if;

  select * into v_target from public.merchbuddy_band_members member
  where member.customer_id = p_customer_id and member.profile_id = p_target_profile_id and member.status = 'active'
  for update;
  if not found then
    raise exception 'Ownership target must be an existing active direct Band member.' using errcode = '22023';
  end if;

  update public.merchbuddy_band_members
  set role = 'owner',
      source = 'band_ownership_transfer',
      metadata = metadata || jsonb_build_object('event', 'ownership_transfer', 'transferred_by', v_caller_id, 'new_owner', p_target_profile_id)
  where customer_id = p_customer_id and profile_id = p_target_profile_id
  returning * into v_target;

  if p_demote_caller then
    update public.merchbuddy_band_members
    set role = 'manager',
        source = 'band_ownership_transfer',
        metadata = metadata || jsonb_build_object('event', 'ownership_transfer', 'transferred_by', v_caller_id, 'demoted_to', 'manager')
    where customer_id = p_customer_id and profile_id = v_caller_id and status = 'active';
  end if;

  if not exists (
    select 1 from public.merchbuddy_band_members member
    where member.customer_id = p_customer_id and member.status = 'active' and member.role = 'owner'
  ) then
    raise exception 'A Band must retain at least one active direct owner.' using errcode = '23514';
  end if;
  return v_target;
end;
$$;

comment on function public.invite_merchbuddy_band_member(uuid, uuid, text)
  is 'Direct owner-only invitation to an existing profile; Organisation-derived access cannot invite direct members.';
comment on function public.accept_merchbuddy_band_invitation(uuid)
  is 'Invited-profile-only acceptance with expiry, current inviter-owner revalidation, and deterministic revoked-membership restoration.';
comment on function public.change_merchbuddy_band_member_role(uuid, uuid, text)
  is 'Direct owner-only role change with transactional last-owner protection.';
comment on function public.revoke_merchbuddy_band_member(uuid, uuid)
  is 'Owner revocation or self-leave using soft revocation and transactional last-owner protection.';
comment on function public.transfer_merchbuddy_band_ownership(uuid, uuid, boolean)
  is 'Explicit direct-owner transfer; target is promoted before optional caller demotion.';

revoke all on function public.invite_merchbuddy_band_member(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.accept_merchbuddy_band_invitation(uuid) from public, anon, authenticated, service_role;
revoke all on function public.change_merchbuddy_band_member_role(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.revoke_merchbuddy_band_member(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.transfer_merchbuddy_band_ownership(uuid, uuid, boolean) from public, anon, authenticated, service_role;

grant execute on function public.invite_merchbuddy_band_member(uuid, uuid, text) to authenticated;
grant execute on function public.accept_merchbuddy_band_invitation(uuid) to authenticated;
grant execute on function public.change_merchbuddy_band_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.revoke_merchbuddy_band_member(uuid, uuid) to authenticated;
grant execute on function public.transfer_merchbuddy_band_ownership(uuid, uuid, boolean) to authenticated;

commit;
