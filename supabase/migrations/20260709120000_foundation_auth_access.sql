create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.organisation_members (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'staff', 'viewer')),
  created_at timestamptz default now(),
  unique (organisation_id, user_id)
);

create table public.app_access (
  id uuid primary key default gen_random_uuid(),
  organisation_member_id uuid references public.organisation_members(id) on delete cascade,
  app_key text not null check (app_key in ('pins_hub', 'merchbuddy')),
  access_level text not null check (access_level in ('admin', 'write', 'read')),
  created_at timestamptz default now(),
  unique (organisation_member_id, app_key)
);

create index profiles_email_idx on public.profiles (email);
create index organisation_members_organisation_id_idx on public.organisation_members (organisation_id);
create index organisation_members_user_id_idx on public.organisation_members (user_id);
create index app_access_organisation_member_id_idx on public.app_access (organisation_member_id);
create index app_access_app_key_idx on public.app_access (app_key);

alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_members enable row level security;
alter table public.app_access enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_organisations_updated_at
before update on public.organisations
for each row execute function public.set_updated_at();

create or replace function public.is_organisation_member(target_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_members
    where organisation_id = target_organisation_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_own_organisation_membership(target_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_members
    where id = target_member_id
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_organisation_member(uuid) to authenticated;
grant execute on function public.is_own_organisation_membership(uuid) to authenticated;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can read organisations they belong to"
on public.organisations
for select
to authenticated
using (public.is_organisation_member(id));

create policy "Users can read memberships for their organisations"
on public.organisation_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_organisation_member(organisation_id)
);

create policy "Users can read app access for their memberships"
on public.app_access
for select
to authenticated
using (public.is_own_organisation_membership(organisation_member_id));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
