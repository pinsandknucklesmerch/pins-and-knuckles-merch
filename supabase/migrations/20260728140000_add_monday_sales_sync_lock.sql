create table public.sales_kpi_monday_sync_locks (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  year integer not null check (year >= 2020),
  month integer not null check (month between 1 and 12),
  lock_token uuid not null,
  locked_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (organisation_id, year, month)
);

alter table public.sales_kpi_monday_sync_locks enable row level security;

create or replace function public.try_acquire_monday_sales_sync_lock(
  p_organisation_id uuid,
  p_year integer,
  p_month integer,
  p_lock_token uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_organisation_id <> '5df4d50f-959e-4438-a026-df75d54fbbc2'::uuid then
    raise exception 'Monday sync is restricted to the Pins & Knuckles organisation';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_organisation_id::text), p_year * 100 + p_month);
  insert into public.sales_kpi_monday_sync_locks (organisation_id, year, month, lock_token, expires_at)
  values (p_organisation_id, p_year, p_month, p_lock_token, now() + interval '15 minutes')
  on conflict (organisation_id, year, month) do update
    set lock_token = excluded.lock_token, locked_at = now(), expires_at = excluded.expires_at
    where public.sales_kpi_monday_sync_locks.expires_at <= now();
  return found;
end;
$$;

create or replace function public.release_monday_sales_sync_lock(
  p_organisation_id uuid,
  p_year integer,
  p_month integer,
  p_lock_token uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.sales_kpi_monday_sync_locks
  where organisation_id = p_organisation_id and year = p_year and month = p_month and lock_token = p_lock_token;
end;
$$;

revoke all on table public.sales_kpi_monday_sync_locks from public, anon, authenticated;
revoke all on function public.try_acquire_monday_sales_sync_lock(uuid, integer, integer, uuid) from public;
revoke all on function public.release_monday_sales_sync_lock(uuid, integer, integer, uuid) from public;
grant execute on function public.try_acquire_monday_sales_sync_lock(uuid, integer, integer, uuid) to service_role;
grant execute on function public.release_monday_sales_sync_lock(uuid, integer, integer, uuid) to service_role;
