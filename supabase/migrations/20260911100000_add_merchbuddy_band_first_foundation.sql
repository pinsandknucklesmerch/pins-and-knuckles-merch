-- Band-first schema foundation only. Existing MerchBuddy authorization helpers
-- and operational RLS policies are deliberately retained until the next batch.
-- No Organisation-member assignments are backfilled.

begin;

-- This backfill is explicitly for the single disposable Band, not production
-- ownership inference. Prevent Band writes from racing the count/creator check.
lock table public.merchbuddy_customers in share row exclusive mode;

do $$
declare
  band_count bigint;
  test_band public.merchbuddy_customers%rowtype;
begin
  select count(*) into band_count from public.merchbuddy_customers;

  if band_count > 1 then
    raise exception 'Band-first foundation expected zero or one disposable Band; found %', band_count
      using errcode = '23514',
        hint = 'Review the existing Bands and approve an explicit migration plan before retrying. No ownership has been inferred.';
  end if;

  if band_count = 1 then
    select * into strict test_band from public.merchbuddy_customers;

    if test_band.created_by is null or not exists (
      select 1 from public.profiles profile where profile.id = test_band.created_by
    ) then
      raise exception 'Manual owner resolution required for test Band % (created_by: %)', test_band.id, test_band.created_by
        using errcode = '23514',
          hint = 'Determine and repair the test Band creator explicitly before retrying. This migration does not guess an owner.';
    end if;
  end if;
end;
$$;

-- Establish an unconditional Band FK before allowing nullable Organisation
-- metadata. The old composite FK alone does not check rows containing NULL.
alter table public.merchbuddy_tours
  add constraint merchbuddy_tours_customer_fkey
  foreign key (customer_id) references public.merchbuddy_customers(id)
  on delete restrict;

alter table public.merchbuddy_tours
  drop constraint merchbuddy_tours_customer_organisation_fkey;

alter table public.merchbuddy_customers
  alter column organisation_id drop not null;

alter table public.merchbuddy_tours
  alter column organisation_id drop not null;

comment on column public.merchbuddy_customers.organisation_id is
  'Legacy Organisation compatibility metadata; nullable for standalone Bands. Existing Organisation-based authorization remains until the separate Band-first RLS cutover.';
comment on column public.merchbuddy_tours.organisation_id is
  'Legacy Organisation compatibility metadata; nullable for Band-first Tours. customer_id is the required canonical Band relationship.';

create table public.merchbuddy_band_members (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.merchbuddy_customers(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role text not null,
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  constraint merchbuddy_band_members_customer_profile_key unique (customer_id, profile_id),
  constraint merchbuddy_band_members_role_chk check (role in ('viewer', 'staff', 'manager', 'owner')),
  constraint merchbuddy_band_members_status_chk check (status in ('active', 'revoked')),
  constraint merchbuddy_band_members_revocation_chk check (
    (status = 'active' and revoked_at is null and revoked_by is null)
    or (status = 'revoked' and revoked_at is not null)
  ),
  constraint merchbuddy_band_members_source_chk check (length(trim(source)) > 0),
  constraint merchbuddy_band_members_metadata_chk check (jsonb_typeof(metadata) = 'object')
);

create table public.merchbuddy_band_organisations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.merchbuddy_customers(id) on delete restrict,
  organisation_id uuid not null references public.organisations(id) on delete restrict,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  requested_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  constraint merchbuddy_band_organisations_customer_org_key unique (customer_id, organisation_id),
  constraint merchbuddy_band_organisations_id_org_key unique (id, organisation_id),
  constraint merchbuddy_band_organisations_status_chk check (status in ('pending', 'active', 'revoked')),
  constraint merchbuddy_band_organisations_state_chk check (
    (status = 'pending' and accepted_at is null and accepted_by is null and revoked_at is null and revoked_by is null)
    or (status = 'active' and accepted_at is not null and revoked_at is null and revoked_by is null)
    or (status = 'revoked' and revoked_at is not null)
  ),
  constraint merchbuddy_band_organisations_acceptance_chk check (accepted_by is null or accepted_at is not null),
  constraint merchbuddy_band_organisations_source_chk check (length(trim(source)) > 0),
  constraint merchbuddy_band_organisations_metadata_chk check (jsonb_typeof(metadata) = 'object')
);

-- The assignment's required Organisation discriminator must match BOTH parents.
-- Composite FKs also prevent later parent Organisation changes from silently
-- retargeting an existing assignment to another Organisation.
alter table public.organisation_members
  add constraint organisation_members_id_organisation_key unique (id, organisation_id);

create table public.merchbuddy_band_organisation_assignments (
  id uuid primary key default gen_random_uuid(),
  band_organisation_id uuid not null,
  organisation_member_id uuid not null,
  organisation_id uuid not null,
  role text not null,
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  constraint merchbuddy_band_org_assignments_relationship_member_key
    unique (band_organisation_id, organisation_member_id),
  constraint merchbuddy_band_org_assignments_relationship_org_fkey
    foreign key (band_organisation_id, organisation_id)
    references public.merchbuddy_band_organisations(id, organisation_id)
    on update restrict on delete restrict,
  constraint merchbuddy_band_org_assignments_member_org_fkey
    foreign key (organisation_member_id, organisation_id)
    references public.organisation_members(id, organisation_id)
    on update restrict on delete restrict,
  constraint merchbuddy_band_org_assignments_role_chk check (role in ('viewer', 'staff', 'manager')),
  constraint merchbuddy_band_org_assignments_status_chk check (status in ('active', 'revoked')),
  constraint merchbuddy_band_org_assignments_revocation_chk check (
    (status = 'active' and revoked_at is null and revoked_by is null)
    or (status = 'revoked' and revoked_at is not null)
  ),
  constraint merchbuddy_band_org_assignments_source_chk check (length(trim(source)) > 0),
  constraint merchbuddy_band_org_assignments_metadata_chk check (jsonb_typeof(metadata) = 'object')
);

create index merchbuddy_band_members_profile_status_customer_idx
  on public.merchbuddy_band_members (profile_id, status, customer_id);
create index merchbuddy_band_members_customer_status_idx
  on public.merchbuddy_band_members (customer_id, status);
create index merchbuddy_band_organisations_org_status_customer_idx
  on public.merchbuddy_band_organisations (organisation_id, status, customer_id);
create index merchbuddy_band_organisations_customer_status_idx
  on public.merchbuddy_band_organisations (customer_id, status);
create index merchbuddy_band_org_assignments_relationship_org_status_idx
  on public.merchbuddy_band_organisation_assignments (band_organisation_id, organisation_id, status);
create index merchbuddy_band_org_assignments_member_org_status_idx
  on public.merchbuddy_band_organisation_assignments (organisation_member_id, organisation_id, status);

create trigger set_merchbuddy_band_members_updated_at
  before update on public.merchbuddy_band_members
  for each row execute function public.set_updated_at();
create trigger set_merchbuddy_band_organisations_updated_at
  before update on public.merchbuddy_band_organisations
  for each row execute function public.set_updated_at();
create trigger set_merchbuddy_band_org_assignments_updated_at
  before update on public.merchbuddy_band_organisation_assignments
  for each row execute function public.set_updated_at();

comment on table public.merchbuddy_band_members is
  'Band-first foundation: direct Band membership, including direct-only owner role. No client access until authorized Band helpers/RPCs and RLS are introduced.';
comment on table public.merchbuddy_band_organisations is
  'Explicit Organisation-to-Band management relationship. A relationship alone does not grant any Organisation member Band access in the target model.';
comment on table public.merchbuddy_band_organisation_assignments is
  'Explicit member assignment, constrained to the same Organisation as its Band management relationship. Future authorization must also require active membership, entitlement, relationship, and assignment.';
comment on column public.merchbuddy_band_organisation_assignments.organisation_id is
  'Required integrity discriminator shared by both composite parent foreign keys; cannot identify a different Organisation from either parent.';

-- Deny by default, including SELECT. There are deliberately no client policies
-- in this foundation batch. Explicit revokes also remove any default grants.
alter table public.merchbuddy_band_members enable row level security;
alter table public.merchbuddy_band_organisations enable row level security;
alter table public.merchbuddy_band_organisation_assignments enable row level security;

revoke all on table public.merchbuddy_band_members,
  public.merchbuddy_band_organisations,
  public.merchbuddy_band_organisation_assignments
  from public, anon, authenticated, service_role;

grant usage on schema public to service_role;
grant select, insert, update on table public.merchbuddy_band_members,
  public.merchbuddy_band_organisations,
  public.merchbuddy_band_organisation_assignments
  to service_role;

-- The guard above guarantees zero or one Band and a valid creator. NULL actor
-- fields identify a migration, not a human invitation or acceptance. Preserve
-- the legacy creator/Organisation and migration identity in provenance instead.
insert into public.merchbuddy_band_members (customer_id, profile_id, role, source, metadata)
select customer.id, customer.created_by, 'owner', 'test_band_backfill',
  jsonb_build_object(
    'migration', '20260911100000_add_merchbuddy_band_first_foundation',
    'legacy_created_by', customer.created_by
  )
from public.merchbuddy_customers customer;

insert into public.merchbuddy_band_organisations (
  customer_id, organisation_id, status, accepted_at, source, metadata
)
select customer.id, customer.organisation_id, 'active', now(), 'test_band_backfill',
  jsonb_build_object(
    'migration', '20260911100000_add_merchbuddy_band_first_foundation',
    'legacy_organisation_id', customer.organisation_id
  )
from public.merchbuddy_customers customer
where customer.organisation_id is not null;

commit;
