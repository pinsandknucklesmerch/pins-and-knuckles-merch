create table public.sales_kpi_profit_email_ingestions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  gmail_message_id text not null,
  subject text not null,
  sender text not null,
  received_at timestamptz not null,
  report_start date not null,
  report_end date not null,
  report_year integer not null,
  report_month integer not null,
  total_sales numeric(14,2) not null,
  total_profit numeric(14,2) not null,
  total_pk_tax numeric(14,2) not null,
  source_hash text not null,
  outcome text not null default 'pending' check (outcome in ('pending', 'applied', 'older')),
  processed_at timestamptz not null default now(),
  constraint sales_kpi_profit_email_ingestions_period_chk check (
    report_month between 1 and 12
    and (report_year > 2026 or (report_year = 2026 and report_month >= 7))
    and report_end >= report_start
  ),
  constraint sales_kpi_profit_email_ingestions_message_key unique (organisation_id, gmail_message_id),
  constraint sales_kpi_profit_email_ingestions_hash_key unique (organisation_id, source_hash)
);

alter table public.sales_kpi_profit_email_ingestions enable row level security;

create function public.ingest_epcc_monthly_profit(
  p_organisation_id uuid,
  p_message_id text,
  p_subject text,
  p_sender text,
  p_received_at timestamptz,
  p_report_start date,
  p_report_end date,
  p_year integer,
  p_month integer,
  p_total_sales numeric,
  p_total_profit numeric,
  p_total_pk_tax numeric,
  p_source_hash text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  ingestion_id uuid;
  latest_received_at timestamptz;
begin
  if p_organisation_id <> '5df4d50f-959e-4438-a026-df75d54fbbc2'::uuid then
    raise exception 'EPCC ingestion is restricted to the Pins & Knuckles organisation';
  end if;
  if p_year < 2026 or (p_year = 2026 and p_month < 7) then
    raise exception 'EPCC profit is authoritative from July 2026 onward';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_organisation_id::text), p_year * 100 + p_month);

  insert into public.sales_kpi_profit_email_ingestions (
    organisation_id, gmail_message_id, subject, sender, received_at, report_start, report_end,
    report_year, report_month, total_sales, total_profit, total_pk_tax, source_hash
  ) values (
    p_organisation_id, p_message_id, p_subject, p_sender, p_received_at, p_report_start, p_report_end,
    p_year, p_month, p_total_sales, p_total_profit, p_total_pk_tax, p_source_hash
  ) on conflict do nothing
  returning id into ingestion_id;

  if ingestion_id is null then return 'duplicate'; end if;

  select max(received_at) into latest_received_at
  from public.sales_kpi_profit_email_ingestions
  where organisation_id = p_organisation_id
    and report_year = p_year
    and report_month = p_month
    and outcome = 'applied';

  if latest_received_at is not null and latest_received_at >= p_received_at then
    update public.sales_kpi_profit_email_ingestions set outcome = 'older' where id = ingestion_id;
    return 'older';
  end if;

  insert into public.sales_kpi_months (organisation_id, year, month, monthly_profit, monthly_profit_source)
  values (p_organisation_id, p_year, p_month, p_total_profit, 'epcc_email')
  on conflict (organisation_id, year, month) do update
    set monthly_profit = excluded.monthly_profit,
        monthly_profit_source = excluded.monthly_profit_source;

  update public.sales_kpi_profit_email_ingestions set outcome = 'applied' where id = ingestion_id;
  return 'applied';
end;
$$;

revoke all on table public.sales_kpi_profit_email_ingestions from public, anon, authenticated;
revoke all on function public.ingest_epcc_monthly_profit(uuid, text, text, text, timestamptz, date, date, integer, integer, numeric, numeric, numeric, text) from public;
grant execute on function public.ingest_epcc_monthly_profit(uuid, text, text, text, timestamptz, date, date, integer, integer, numeric, numeric, numeric, text) to service_role;
