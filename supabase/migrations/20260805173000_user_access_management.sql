-- User Access Management: preserve membership history while allowing access to be suspended.
alter table public.organisation_members
  add column if not exists is_active boolean not null default true,
  add column if not exists monday_member_id text;

create unique index if not exists organisation_members_monday_member_id_unique
  on public.organisation_members (monday_member_id)
  where monday_member_id is not null;

-- Resolve the organisation by slug in deployments that seed the Pins organisation.
-- No data is backfilled: existing memberships remain active and unlinked.
comment on column public.organisation_members.monday_member_id is 'Canonical Monday person ID; optional and unique across Pins Hub memberships.';
