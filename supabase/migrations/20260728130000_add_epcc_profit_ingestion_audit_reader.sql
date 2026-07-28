create function public.read_epcc_profit_ingestion_audit(
  p_year integer,
  p_month integer,
  p_source_hash text default null
) returns table (
  report_year integer,
  report_month integer,
  report_start date,
  report_end date,
  received_at timestamptz,
  outcome text,
  source_hash_present boolean,
  source_hash_matches boolean,
  processed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    ingestion.report_year,
    ingestion.report_month,
    ingestion.report_start,
    ingestion.report_end,
    ingestion.received_at,
    ingestion.outcome,
    ingestion.source_hash is not null,
    case when p_source_hash is null then false else ingestion.source_hash = p_source_hash end,
    ingestion.processed_at
  from public.sales_kpi_profit_email_ingestions as ingestion
  where ingestion.organisation_id = '5df4d50f-959e-4438-a026-df75d54fbbc2'::uuid
    and ingestion.report_year = p_year
    and ingestion.report_month = p_month
  order by ingestion.received_at desc, ingestion.processed_at desc;
$$;

revoke all on function public.read_epcc_profit_ingestion_audit(integer, integer, text) from public, anon, authenticated;
grant execute on function public.read_epcc_profit_ingestion_audit(integer, integer, text) to service_role;
