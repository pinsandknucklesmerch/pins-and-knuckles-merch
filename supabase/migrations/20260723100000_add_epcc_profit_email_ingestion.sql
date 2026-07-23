alter table public.sales_kpi_months drop constraint sales_kpi_months_profit_chk;

create table public.sales_kpi_profit_email_sources (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  message_id text not null,
  subject text not null,
  sender text not null,
  received_at timestamptz not null,
  report_year integer not null check (report_year >= 2020),
  report_month integer not null check (report_month between 1 and 12),
  parsed_row_count integer not null check (parsed_row_count > 0),
  source_hash text not null unique,
  aggregation_rule text not null,
  created_at timestamptz not null default now()
);

alter table public.sales_kpi_profit_email_sources enable row level security;

create function public.ingest_epcc_monthly_profit(
  p_organisation_id uuid,
  p_year integer,
  p_month integer,
  p_monthly_profit numeric,
  p_source_hash text,
  p_message_id text,
  p_subject text,
  p_sender text,
  p_received_at timestamptz,
  p_parsed_row_count integer,
  p_aggregation_rule text
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  source_id uuid;
begin
  insert into public.sales_kpi_profit_email_sources (
    organisation_id, message_id, subject, sender, received_at, report_year, report_month, parsed_row_count, source_hash, aggregation_rule
  ) values (
    p_organisation_id, p_message_id, p_subject, p_sender, p_received_at, p_year, p_month, p_parsed_row_count, p_source_hash, p_aggregation_rule
  ) on conflict (source_hash) do nothing returning id into source_id;

  if source_id is null then return false; end if;

  insert into public.sales_kpi_months (organisation_id, year, month, monthly_profit, monthly_profit_source)
  values (p_organisation_id, p_year, p_month, p_monthly_profit, 'epcc_email')
  on conflict (organisation_id, year, month) do update
    set monthly_profit = excluded.monthly_profit,
        monthly_profit_source = excluded.monthly_profit_source;

  return true;
end;
$$;

revoke all on function public.ingest_epcc_monthly_profit(uuid, integer, integer, numeric, text, text, text, text, timestamptz, integer, text) from public;
grant execute on function public.ingest_epcc_monthly_profit(uuid, integer, integer, numeric, text, text, text, text, timestamptz, integer, text) to service_role;
