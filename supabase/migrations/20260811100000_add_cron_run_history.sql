create table public.cron_run_history (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  job_name text not null check (job_name in ('epcc-profit', 'monday-sales-sync')),
  reporting_year integer not null check (reporting_year >= 2000),
  reporting_month integer not null check (reporting_month between 1 and 12),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'failed')),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  summary text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index cron_run_history_latest_idx
  on public.cron_run_history (organisation_id, job_name, started_at desc);
create index cron_run_history_success_idx
  on public.cron_run_history (organisation_id, job_name, status, completed_at desc);

alter table public.cron_run_history enable row level security;

create policy "Developers can read cron run history"
  on public.cron_run_history for select to authenticated
  using (public.has_pins_hub_developer_access_for_organisation(organisation_id));

revoke all on public.cron_run_history from public, anon, authenticated;
grant select on public.cron_run_history to authenticated;
grant insert, update on public.cron_run_history to service_role;
