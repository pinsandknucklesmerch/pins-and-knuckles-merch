-- Batch 2A: canonical Band permission helpers and accessible-workspace resolver.
-- Requires 20260911100000_add_merchbuddy_band_first_foundation.sql first.
-- Existing operational policies and can_*_merchbuddy_tour helpers are unchanged.

begin;

-- Internal, owner-executable implementation shared by scalar helpers and the
-- workspace resolver. NULL target means all authorized Bands only internally.
-- No direct authenticated/anonymous execution or permission-table reads.
create function public.merchbuddy_band_access_summary(target_customer_id uuid default null)
returns table (
  customer_id uuid,
  effective_band_role text,
  has_direct_access boolean,
  has_organisation_access boolean
)
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  with access_paths as (
    select
      member.customer_id,
      case member.role
        when 'viewer' then 1
        when 'staff' then 2
        when 'manager' then 3
        when 'owner' then 4
      end as role_rank,
      true as direct_path,
      false as organisation_path
    from public.merchbuddy_band_members member
    where auth.uid() is not null
      and member.profile_id = auth.uid()
      and member.status = 'active'
      and (target_customer_id is null or member.customer_id = target_customer_id)

    union all

    select
      relationship.customer_id,
      least(
        case assignment.role
          when 'viewer' then 1
          when 'staff' then 2
          when 'manager' then 3
        end,
        case when public.has_merchbuddy_access_for_organisation(membership.organisation_id, 'write')
          then 3 else 1 end
      ) as role_rank,
      false as direct_path,
      true as organisation_path
    from public.merchbuddy_band_organisation_assignments assignment
    join public.merchbuddy_band_organisations relationship
      on relationship.id = assignment.band_organisation_id
      and relationship.organisation_id = assignment.organisation_id
    join public.organisation_members membership
      on membership.id = assignment.organisation_member_id
      and membership.organisation_id = assignment.organisation_id
    where auth.uid() is not null
      and membership.user_id = auth.uid()
      and membership.is_active
      and relationship.status = 'active'
      and assignment.status = 'active'
      and (target_customer_id is null or relationship.customer_id = target_customer_id)
      -- Reuse the current one-way Hub/Merch inheritance, not the owner/admin
      -- exception in has_merchbuddy_admin_access_for_organisation(). The existing
      -- UNIQUE (organisation_id, user_id) membership constraint, together with
      -- the caller-bound join above, means this Organisation entitlement check
      -- can only use the SAME membership represented by this assignment.
      and public.has_merchbuddy_access_for_organisation(membership.organisation_id, 'read')
  )
  select
    path.customer_id,
    case max(path.role_rank)
      when 1 then 'viewer'
      when 2 then 'staff'
      when 3 then 'manager'
      when 4 then 'owner'
    end as effective_band_role,
    bool_or(path.direct_path) as has_direct_access,
    bool_or(path.organisation_path) as has_organisation_access
  from access_paths path
  group by path.customer_id;
$$;

-- Role resolution does not treat inactive Bands as revoked memberships: owners
-- still need administration, and all authorized roles retain historical reads.
-- NULL input must never select the internal all-Bands interpretation.
create function public.get_merchbuddy_band_role(target_customer_id uuid)
returns text
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select access.effective_band_role
  from public.merchbuddy_band_access_summary(target_customer_id) access
  where target_customer_id is not null
    and access.customer_id = target_customer_id;
$$;

create function public.can_access_merchbuddy_band(target_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select public.get_merchbuddy_band_role(target_customer_id) is not null;
$$;

create function public.can_operate_merchbuddy_band(target_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1 from public.merchbuddy_customers band
    where band.id = target_customer_id
      and band.status = 'active'
      and public.get_merchbuddy_band_role(band.id) in ('staff', 'manager', 'owner')
  );
$$;

create function public.can_manage_merchbuddy_band(target_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1 from public.merchbuddy_customers band
    where band.id = target_customer_id
      and band.status = 'active'
      and public.get_merchbuddy_band_role(band.id) in ('manager', 'owner')
  );
$$;

create function public.can_administer_merchbuddy_band(target_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select coalesce(public.get_merchbuddy_band_role(target_customer_id) = 'owner', false);
$$;

-- Tour grants are a separate caller-bound path. They never contribute a role
-- to merchbuddy_band_access_summary or any Band-wide capability check.
create function public.merchbuddy_legacy_tour_access(target_customer_id uuid default null)
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
    and (target_customer_id is null or tour.customer_id = target_customer_id);
$$;

-- Internal preparation for Batch 2B. Return the canonical parent/status and
-- keep Band and Tour roles separate so each future action can apply its own
-- legacy exception and inactive-write rule. No existing helper calls this yet.
-- An unauthorized or NULL Tour ID returns no row, not its parent identity.
create function public.merchbuddy_tour_access_context(target_tour_id uuid)
returns table (
  tour_id uuid,
  customer_id uuid,
  band_status text,
  effective_band_role text,
  legacy_tour_role text
)
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select tour.id, band.id, band.status, access.effective_band_role, legacy.legacy_tour_role
  from public.merchbuddy_tours tour
  join public.merchbuddy_customers band on band.id = tour.customer_id
  left join lateral public.merchbuddy_band_access_summary(tour.customer_id) access
    on access.customer_id = tour.customer_id
  left join lateral public.merchbuddy_legacy_tour_access(tour.customer_id) legacy
    on legacy.tour_id = tour.id
  where auth.uid() is not null
    and tour.id = target_tour_id
    and (access.effective_band_role is not null or legacy.legacy_tour_role is not null);
$$;

create function public.get_accessible_merchbuddy_bands()
returns table (
  customer_id uuid,
  name text,
  status text,
  effective_band_role text,
  has_direct_access boolean,
  has_organisation_access boolean,
  has_legacy_tour_access boolean,
  is_tour_limited boolean,
  legacy_tour_ids uuid[]
)
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  with band_access as (
    select * from public.merchbuddy_band_access_summary()
  ), legacy_access as (
    select legacy.customer_id, array_agg(legacy.tour_id order by legacy.tour_id) as tour_ids
    from public.merchbuddy_legacy_tour_access() legacy
    group by legacy.customer_id
  ), accessible_ids as (
    select access.customer_id from band_access access
    union
    select legacy.customer_id from legacy_access legacy
  )
  select
    band.id,
    band.name,
    band.status,
    access.effective_band_role,
    coalesce(access.has_direct_access, false),
    coalesce(access.has_organisation_access, false),
    legacy.customer_id is not null,
    access.effective_band_role is null,
    coalesce(legacy.tour_ids, '{}'::uuid[])
  from accessible_ids accessible
  join public.merchbuddy_customers band on band.id = accessible.customer_id
  left join band_access access on access.customer_id = band.id
  left join legacy_access legacy on legacy.customer_id = band.id
  where auth.uid() is not null
  order by (band.status = 'active') desc, lower(band.name), band.id;
$$;

comment on function public.get_merchbuddy_band_role(uuid) is
  'Caller-only highest valid direct/assigned Band role; NULL for no Band-wide access. Legacy Tour grants never raise this role. Inactive Bands retain their role.';
comment on function public.can_access_merchbuddy_band(uuid) is
  'Caller has viewer-or-higher Band-wide access, including historical access to inactive Bands. No Organisation-wide or legacy Tour fallback.';
comment on function public.can_operate_merchbuddy_band(uuid) is
  'Caller has staff-or-higher Band-wide access AND the Band is active; intended for inventory operations.';
comment on function public.can_manage_merchbuddy_band(uuid) is
  'Caller has manager/owner Band-wide access AND the Band is active; intended for Tour/Product/Show management.';
comment on function public.can_administer_merchbuddy_band(uuid) is
  'Caller has direct owner authority, including access administration on inactive Bands. Does not itself permit operational writes or implement mutations.';
comment on function public.get_accessible_merchbuddy_bands() is
  'Caller-only deduplicated Band workspaces, including inactive and Tour-limited entries. A NULL effective_band_role means Tour-only access; legacy_tour_ids lists only caller-assigned Tours, not every Tour in the Band.';
comment on function public.merchbuddy_band_access_summary(uuid) is
  'Internal Band role/provenance aggregation. Entitlement reuse relies on UNIQUE organisation_members(organisation_id, user_id) and the exact active caller membership join. No client EXECUTE grant.';
comment on function public.merchbuddy_legacy_tour_access(uuid) is
  'Internal caller-only legacy Tour grants for workspace discovery and later scoped Tour authorization. No client EXECUTE grant.';
comment on function public.merchbuddy_tour_access_context(uuid) is
  'Internal Batch 2B preparation: canonical Band/status and separate Band/Tour roles for an authorized Tour. Not used by existing operational helpers or policies yet.';

-- Functions receive PUBLIC EXECUTE by default. Remove it and any role-specific
-- default grants, then expose only caller-safe scalar helpers and the resolver.
-- Nested internal calls execute as the function owner; auth.uid() still resolves
-- the request user, not that database owner. Access tables remain private.
revoke all on function
  public.merchbuddy_band_access_summary(uuid),
  public.get_merchbuddy_band_role(uuid),
  public.can_access_merchbuddy_band(uuid),
  public.can_operate_merchbuddy_band(uuid),
  public.can_manage_merchbuddy_band(uuid),
  public.can_administer_merchbuddy_band(uuid),
  public.merchbuddy_legacy_tour_access(uuid),
  public.merchbuddy_tour_access_context(uuid),
  public.get_accessible_merchbuddy_bands()
  from public, anon, authenticated, service_role;

grant execute on function
  public.get_merchbuddy_band_role(uuid),
  public.can_access_merchbuddy_band(uuid),
  public.can_operate_merchbuddy_band(uuid),
  public.can_manage_merchbuddy_band(uuid),
  public.can_administer_merchbuddy_band(uuid),
  public.get_accessible_merchbuddy_bands()
  to authenticated;

commit;
