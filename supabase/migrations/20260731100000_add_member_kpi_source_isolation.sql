alter table public.sales_kpi_member_months
  add column if not exists pk_tax numeric(14,2),
  add column if not exists snuggle_profit numeric(14,2),
  add column if not exists monday_source_metadata jsonb,
  add column if not exists epcc_source_metadata jsonb,
  add column if not exists member_classification text;

alter table public.sales_kpi_member_months
  drop constraint if exists sales_kpi_member_months_profit_chk;

update public.sales_kpi_member_months
set member_classification = case
  when lower(team_member_key) in ('hardus', 'justin', 'justin-du-preez', 'bux') then 'dashboard_account_manager'
  when lower(team_member_key) in ('shannon', 'shannon-wellby', 'johan') then 'admin_hidden'
  else 'other_non_dashboard'
end
where member_classification is null;

alter table public.sales_kpi_member_months
  alter column member_classification set default 'other_non_dashboard',
  alter column member_classification set not null;

alter table public.sales_kpi_member_months
  add constraint sales_kpi_member_months_classification_chk
    check (member_classification in ('dashboard_account_manager', 'admin_hidden', 'other_non_dashboard'));

create or replace function public.ingest_epcc_monthly_profit_and_members(
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
  p_source_hash text,
  p_member_rows jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  ingestion_id uuid;
  latest_received_at timestamptz;
  member_row jsonb;
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

  for member_row in select value from jsonb_array_elements(coalesce(p_member_rows, '[]'::jsonb)) loop
    insert into public.sales_kpi_member_months (
      organisation_id, year, month, team_member_key, team_member_name, member_classification,
      profit, pk_tax, epcc_source_metadata, data_source
    ) values (
      p_organisation_id, p_year, p_month,
      member_row->>'team_member_key', member_row->>'team_member_name', member_row->>'member_classification',
      (member_row->>'profit')::numeric, (member_row->>'pk_tax')::numeric, member_row->'epcc_source_metadata', 'epcc_email'
    ) on conflict (organisation_id, year, month, team_member_key) do update
      set profit = excluded.profit,
          pk_tax = excluded.pk_tax,
          epcc_source_metadata = excluded.epcc_source_metadata,
          updated_at = now();
  end loop;

  update public.sales_kpi_profit_email_ingestions set outcome = 'applied' where id = ingestion_id;
  return 'applied';
end;
$$;

revoke all on function public.ingest_epcc_monthly_profit_and_members(uuid, text, text, text, timestamptz, date, date, integer, integer, numeric, numeric, numeric, text, jsonb) from public;
grant execute on function public.ingest_epcc_monthly_profit_and_members(uuid, text, text, text, timestamptz, date, date, integer, integer, numeric, numeric, numeric, text, jsonb) to service_role;
