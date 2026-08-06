-- Keep developer as a distinct stored level while letting it satisfy every existing
-- Pins Hub access policy at or below administrator level.
create or replace function public.has_pins_hub_access(required_access_level text default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organisation_members om
    join public.app_access aa on aa.organisation_member_id = om.id
    where om.user_id = auth.uid()
      and om.is_active
      and aa.app_key = 'pins_hub'
      and (
        (required_access_level is null and aa.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'read' and aa.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'write' and aa.access_level in ('write', 'admin', 'developer'))
        or (required_access_level = 'admin' and aa.access_level in ('admin', 'developer'))
        or (required_access_level = 'developer' and aa.access_level = 'developer')
      )
  );
$$;

create or replace function public.has_pins_hub_access_for_organisation(
  target_organisation_id uuid,
  required_access_level text default null
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organisation_members om
    join public.app_access aa on aa.organisation_member_id = om.id
    where om.user_id = auth.uid()
      and om.organisation_id = target_organisation_id
      and om.is_active
      and aa.app_key = 'pins_hub'
      and (
        (required_access_level is null and aa.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'read' and aa.access_level in ('read', 'write', 'admin', 'developer'))
        or (required_access_level = 'write' and aa.access_level in ('write', 'admin', 'developer'))
        or (required_access_level = 'admin' and aa.access_level in ('admin', 'developer'))
        or (required_access_level = 'developer' and aa.access_level = 'developer')
      )
  );
$$;

revoke all on function public.has_pins_hub_access(text) from public;
revoke all on function public.has_pins_hub_access(text) from anon;
grant execute on function public.has_pins_hub_access(text) to authenticated;
revoke all on function public.has_pins_hub_access_for_organisation(uuid, text) from public;
revoke all on function public.has_pins_hub_access_for_organisation(uuid, text) from anon;
grant execute on function public.has_pins_hub_access_for_organisation(uuid, text) to authenticated;
