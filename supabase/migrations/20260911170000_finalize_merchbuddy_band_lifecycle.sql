-- Batch 2C-2C: legacy Tour-grant revocation and constrained Band lifecycle.
-- Legacy grants remain compatibility-only and are never promoted to Band access.

begin;

set local search_path = pg_catalog, public, pg_temp;

alter table public.merchbuddy_tour_users
  add column status text not null default 'active',
  add column revoked_at timestamptz,
  add column revoked_by uuid references public.profiles(id) on delete set null,
  add column source text not null default 'legacy_tour_grant',
  add column metadata jsonb not null default '{}'::jsonb,
  add constraint merchbuddy_tour_users_status_chk check (status in ('active', 'revoked')),
  add constraint merchbuddy_tour_users_revocation_chk check (
    (status = 'active' and revoked_at is null and revoked_by is null)
    or (status = 'revoked' and revoked_at is not null)
  ),
  add constraint merchbuddy_tour_users_source_chk check (length(trim(source)) > 0),
  add constraint merchbuddy_tour_users_metadata_chk check (jsonb_typeof(metadata) = 'object');

comment on table public.merchbuddy_tour_users
  is 'Legacy Tour-scoped compatibility grants. New client grants remain frozen; revoked rows do not authorize Tour or Band access.';

create or replace function public.merchbuddy_legacy_tour_access(
  target_customer_id uuid default null
)
returns table (
  customer_id uuid,
  tour_id uuid,
  legacy_tour_role text
)
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select tour.customer_id, tour.id, tour_user.role
  from public.merchbuddy_tour_users tour_user
  join public.merchbuddy_tours tour on tour.id = tour_user.tour_id
  where auth.uid() is not null
    and tour_user.profile_id = auth.uid()
    and tour_user.status = 'active'
    and (target_customer_id is null or tour.customer_id = target_customer_id);
$$;

revoke all on function public.merchbuddy_legacy_tour_access(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.revoke_merchbuddy_legacy_tour_user(
  p_tour_id uuid,
  p_profile_id uuid
)
returns public.merchbuddy_tour_users
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_customer_id uuid;
  v_tour_user public.merchbuddy_tour_users%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to revoke a legacy Tour grant.' using errcode = '42501';
  end if;

  select tour.customer_id into v_customer_id
  from public.merchbuddy_tours tour
  where tour.id = p_tour_id;
  if v_customer_id is null then
    raise exception 'Tour not found.' using errcode = '22023';
  end if;

  perform 1
  from public.merchbuddy_customers band
  where band.id = v_customer_id
  for update;
  if not found then
    raise exception 'Band not found.' using errcode = '22023';
  end if;
  if not public.can_administer_merchbuddy_band(v_customer_id) then
    raise exception 'Only a direct Band owner can revoke a legacy Tour grant.' using errcode = '42501';
  end if;

  perform 1
  from public.merchbuddy_tours tour
  where tour.id = p_tour_id
  for update;
  if not found then
    raise exception 'Tour not found.' using errcode = '22023';
  end if;

  select * into v_tour_user
  from public.merchbuddy_tour_users tour_user
  where tour_user.tour_id = p_tour_id
    and tour_user.profile_id = p_profile_id
    and tour_user.status = 'active'
  for update;
  if not found then
    raise exception 'Active legacy Tour grant not found.' using errcode = '22023';
  end if;

  update public.merchbuddy_tour_users
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = v_caller_id,
      source = 'legacy_tour_grant_revocation',
      metadata = metadata || jsonb_build_object(
        'event', 'legacy_tour_grant_revoked',
        'revoked_by', v_caller_id,
        'revoked_role', v_tour_user.role
      )
  where tour_id = p_tour_id
    and profile_id = p_profile_id
  returning * into v_tour_user;

  return v_tour_user;
end;
$$;

create or replace function public.deactivate_merchbuddy_band(
  p_customer_id uuid
)
returns public.merchbuddy_customers
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_band public.merchbuddy_customers%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to deactivate a Band.' using errcode = '42501';
  end if;

  select * into v_band
  from public.merchbuddy_customers band
  where band.id = p_customer_id
  for update;
  if not found then
    raise exception 'Band not found.' using errcode = '22023';
  end if;
  if not public.can_administer_merchbuddy_band(p_customer_id) then
    raise exception 'Only a direct Band owner can deactivate a Band.' using errcode = '42501';
  end if;

  update public.merchbuddy_customers
  set status = 'inactive'
  where id = p_customer_id
  returning * into v_band;
  return v_band;
end;
$$;

create or replace function public.reactivate_merchbuddy_band(
  p_customer_id uuid
)
returns public.merchbuddy_customers
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_band public.merchbuddy_customers%rowtype;
  v_role text;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to reactivate a Band.' using errcode = '42501';
  end if;

  select * into v_band
  from public.merchbuddy_customers band
  where band.id = p_customer_id
  for update;
  if not found then
    raise exception 'Band not found.' using errcode = '22023';
  end if;

  v_role := public.get_merchbuddy_band_role(p_customer_id);
  if v_role not in ('manager', 'owner') then
    raise exception 'Only an active Band manager or direct owner can reactivate a Band.' using errcode = '42501';
  end if;

  update public.merchbuddy_customers
  set status = 'active'
  where id = p_customer_id
  returning * into v_band;
  return v_band;
end;
$$;

comment on function public.merchbuddy_legacy_tour_access(uuid)
  is 'Internal caller-only active legacy Tour grants. Revoked rows confer neither Tour nor Band access.';
comment on function public.revoke_merchbuddy_legacy_tour_user(uuid, uuid)
  is 'Direct owner-only soft revocation of one legacy Tour-scoped grant; no new legacy grants are created.';
comment on function public.deactivate_merchbuddy_band(uuid)
  is 'Direct owner-only status transition to inactive. Does not delete data or change access records.';
comment on function public.reactivate_merchbuddy_band(uuid)
  is 'Restricted status-only reactivation for an active effective Band manager or direct owner.';

revoke all on function public.revoke_merchbuddy_legacy_tour_user(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.deactivate_merchbuddy_band(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.reactivate_merchbuddy_band(uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.revoke_merchbuddy_legacy_tour_user(uuid, uuid)
  to authenticated;
grant execute on function public.deactivate_merchbuddy_band(uuid)
  to authenticated;
grant execute on function public.reactivate_merchbuddy_band(uuid)
  to authenticated;

commit;
