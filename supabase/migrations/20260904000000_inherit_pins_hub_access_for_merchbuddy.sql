-- Pins Hub access is inherited by Pins Merch for the same active organisation
-- membership. Explicit MerchBuddy access remains independent and can be higher.
create or replace function public.has_merchbuddy_access(required_access_level text default null)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organisation_members membership
    join public.app_access access on access.organisation_member_id = membership.id
    where membership.user_id = auth.uid() and membership.is_active
      and access.app_key in ('merchbuddy', 'pins_hub')
      and ((required_access_level is null and access.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'read' and access.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'write' and access.access_level in ('write', 'admin', 'developer'))
        or (required_access_level = 'admin' and access.access_level in ('admin', 'developer'))
        or (required_access_level = 'developer' and access.access_level = 'developer'))
  );
$$;

create or replace function public.has_merchbuddy_access_for_organisation(target_organisation_id uuid, required_access_level text default null)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organisation_members membership
    join public.app_access access on access.organisation_member_id = membership.id
    where membership.user_id = auth.uid() and membership.organisation_id = target_organisation_id
      and membership.is_active and access.app_key in ('merchbuddy', 'pins_hub')
      and ((required_access_level is null and access.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'read' and access.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'write' and access.access_level in ('write', 'admin', 'developer'))
        or (required_access_level = 'admin' and access.access_level in ('admin', 'developer'))
        or (required_access_level = 'developer' and access.access_level = 'developer'))
  );
$$;

create or replace function public.has_merchbuddy_admin_access()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organisation_members membership
    where membership.user_id = auth.uid() and membership.is_active
      and (
        (membership.role = 'owner' and exists (
          select 1 from public.app_access explicit_merch_access
          where explicit_merch_access.organisation_member_id = membership.id
            and explicit_merch_access.app_key = 'merchbuddy'
            and explicit_merch_access.access_level in ('read', 'write', 'admin', 'developer')
        ))
        or exists (
          select 1 from public.app_access access
          where access.organisation_member_id = membership.id
            and access.app_key in ('merchbuddy', 'pins_hub')
            and access.access_level in ('admin', 'developer')
        )
      )
  );
$$;

create or replace function public.has_merchbuddy_admin_access_for_organisation(target_organisation_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organisation_members membership
    where membership.user_id = auth.uid() and membership.organisation_id = target_organisation_id
      and membership.is_active
      and (
        (membership.role = 'owner' and exists (
          select 1 from public.app_access explicit_merch_access
          where explicit_merch_access.organisation_member_id = membership.id
            and explicit_merch_access.app_key = 'merchbuddy'
            and explicit_merch_access.access_level in ('read', 'write', 'admin', 'developer')
        ))
        or exists (
          select 1 from public.app_access access
          where access.organisation_member_id = membership.id
            and access.app_key in ('merchbuddy', 'pins_hub')
            and access.access_level in ('admin', 'developer')
        )
      )
  );
$$;

revoke all on function public.has_merchbuddy_access(text) from public, anon;
revoke all on function public.has_merchbuddy_access_for_organisation(uuid, text) from public, anon;
revoke all on function public.has_merchbuddy_admin_access() from public, anon;
revoke all on function public.has_merchbuddy_admin_access_for_organisation(uuid) from public, anon;
grant execute on function public.has_merchbuddy_access(text) to authenticated;
grant execute on function public.has_merchbuddy_access_for_organisation(uuid, text) to authenticated;
grant execute on function public.has_merchbuddy_admin_access() to authenticated;
grant execute on function public.has_merchbuddy_admin_access_for_organisation(uuid) to authenticated;
