-- Member KPI writes are source-isolated.  The service role needs direct table
-- privileges because the Monday sync is not a security-definer RPC.
grant select, insert, update
on table public.sales_kpi_member_months
to service_role;

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
  duplicate_source_hash text;
  duplicate_outcome text;
  member_row jsonb;
  needs_member_backfill boolean;
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

  if ingestion_id is null then
    select source_hash, outcome into duplicate_source_hash, duplicate_outcome
    from public.sales_kpi_profit_email_ingestions
    where organisation_id = p_organisation_id
      and (gmail_message_id = p_message_id or source_hash = p_source_hash)
    order by processed_at desc
    limit 1;

    -- A duplicate can backfill only the exact report that was previously
    -- accepted.  This preserves both source-hash and stale-report protection.
    if duplicate_outcome <> 'applied'
      or duplicate_source_hash <> p_source_hash
      or jsonb_typeof(coalesce(p_member_rows, 'null'::jsonb)) <> 'array'
      or jsonb_array_length(case when jsonb_typeof(p_member_rows) = 'array' then p_member_rows else '[]'::jsonb end) = 0 then
      return 'duplicate_member_backfill_rejected';
    end if;

    select exists (
      select 1
      from jsonb_array_elements(p_member_rows) as expected(member_row)
      left join public.sales_kpi_member_months as current
        on current.organisation_id = p_organisation_id
       and current.year = p_year
       and current.month = p_month
       and current.team_member_key = expected.member_row->>'team_member_key'
      where current.id is null
         or coalesce(current.epcc_source_metadata->>'sourceHash', '') <> p_source_hash
    ) into needs_member_backfill;

    if not needs_member_backfill then
      return 'duplicate_member_backfill_not_needed';
    end if;

    for member_row in select value from jsonb_array_elements(p_member_rows) loop
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
            updated_at = now()
        where coalesce(public.sales_kpi_member_months.epcc_source_metadata->>'sourceHash', '') <> p_source_hash;
    end loop;

    return 'duplicate_member_backfill_applied';
  end if;

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
