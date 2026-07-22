-- Dedicated server-side team provisioning needs table privileges in addition to
-- service_role's RLS bypass. Normal application roles remain unchanged.
grant select, insert, update
on table public.profiles
to service_role;

grant select
on table public.organisations
to service_role;

grant select, insert, update
on table public.organisation_members
to service_role;

grant select, insert, update
on table public.app_access
to service_role;
