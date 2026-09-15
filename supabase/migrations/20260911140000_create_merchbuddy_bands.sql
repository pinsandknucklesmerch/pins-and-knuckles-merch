-- Batch 2C-1: transactional Band creation and creator owner bootstrap.
-- Raw authenticated INSERT on merchbuddy_customers remains unavailable.

begin;

set local search_path = pg_catalog, public, pg_temp;

create or replace function public.create_merchbuddy_standalone_band(p_name text)
returns public.merchbuddy_customers
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_name text := btrim(p_name);
  v_band public.merchbuddy_customers%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to create a Band.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles profile where profile.id = v_caller_id) then
    raise exception 'A valid profile is required to create a Band.' using errcode = '42501';
  end if;

  if v_name is null or v_name = '' then
    raise exception 'Band name is required.' using errcode = '22023';
  end if;

  insert into public.merchbuddy_customers (organisation_id, name, status, created_by)
  values (null, v_name, 'active', v_caller_id)
  returning * into v_band;

  insert into public.merchbuddy_band_members (
    customer_id, profile_id, role, status, created_by, source, metadata
  )
  values (
    v_band.id, v_caller_id, 'owner', 'active', v_caller_id, 'band_creation_rpc',
    jsonb_build_object(
      'rpc', 'create_merchbuddy_standalone_band',
      'creation_mode', 'standalone'
    )
  );

  return v_band;
end;
$$;

create or replace function public.create_merchbuddy_organisation_band(
  p_organisation_id uuid,
  p_name text
)
returns public.merchbuddy_customers
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_name text := btrim(p_name);
  v_membership_id uuid;
  v_band_organisation_id uuid;
  v_band public.merchbuddy_customers%rowtype;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to create a Band.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles profile where profile.id = v_caller_id) then
    raise exception 'A valid profile is required to create a Band.' using errcode = '42501';
  end if;

  if p_organisation_id is null then
    raise exception 'An Organisation is required for managed Band creation.' using errcode = '22023';
  end if;

  if v_name is null or v_name = '' then
    raise exception 'Band name is required.' using errcode = '22023';
  end if;

  select membership.id into v_membership_id
  from public.organisation_members membership
  where membership.organisation_id = p_organisation_id
    and membership.user_id = v_caller_id
    and membership.is_active;

  if v_membership_id is null then
    raise exception 'An active Organisation membership is required to create a managed Band.'
      using errcode = '42501';
  end if;

  if not public.has_merchbuddy_access_for_organisation(p_organisation_id, 'admin') then
    raise exception 'Pins Hub or Pins Merch admin/developer access is required to create a managed Band.'
      using errcode = '42501';
  end if;

  insert into public.merchbuddy_customers (organisation_id, name, status, created_by)
  values (p_organisation_id, v_name, 'active', v_caller_id)
  returning * into v_band;

  insert into public.merchbuddy_band_organisations (
    customer_id, organisation_id, status, requested_by, accepted_at,
    accepted_by, source, metadata
  )
  values (
    v_band.id, p_organisation_id, 'active', v_caller_id, now(), v_caller_id,
    'band_creation_rpc',
    jsonb_build_object(
      'rpc', 'create_merchbuddy_organisation_band',
      'creation_mode', 'organisation_managed',
      'organisation_id', p_organisation_id
    )
  )
  returning id into v_band_organisation_id;

  insert into public.merchbuddy_band_organisation_assignments (
    band_organisation_id, organisation_member_id, organisation_id,
    role, status, created_by, source, metadata
  )
  values (
    v_band_organisation_id, v_membership_id, p_organisation_id,
    'manager', 'active', v_caller_id, 'band_creation_rpc',
    jsonb_build_object(
      'rpc', 'create_merchbuddy_organisation_band',
      'assignment', 'creator_manager'
    )
  );

  insert into public.merchbuddy_band_members (
    customer_id, profile_id, role, status, created_by, source, metadata
  )
  values (
    v_band.id, v_caller_id, 'owner', 'active', v_caller_id, 'band_creation_rpc',
    jsonb_build_object(
      'rpc', 'create_merchbuddy_organisation_band',
      'creation_mode', 'organisation_managed',
      'direct_owner', true
    )
  );

  return v_band;
end;
$$;

comment on function public.create_merchbuddy_standalone_band(text)
  is 'Atomically creates a standalone active Band and direct owner membership for auth.uid().';

comment on function public.create_merchbuddy_organisation_band(uuid, text)
  is 'Atomically creates an Organisation-managed active Band, creator manager assignment, and direct owner membership for auth.uid().';

revoke all on function public.create_merchbuddy_standalone_band(text)
  from public, anon, authenticated, service_role;
revoke all on function public.create_merchbuddy_organisation_band(uuid, text)
  from public, anon, authenticated, service_role;

grant execute on function public.create_merchbuddy_standalone_band(text) to authenticated;
grant execute on function public.create_merchbuddy_organisation_band(uuid, text) to authenticated;

commit;
