-- Retire only the historical EPCC RPC overload that wrote to
-- sales_kpi_profit_email_sources. Keep the legacy table and all current
-- ingestion functions until historical retention and type regeneration are
-- explicitly approved.
drop function if exists public.ingest_epcc_monthly_profit(
  uuid,
  integer,
  integer,
  numeric,
  text,
  text,
  text,
  text,
  timestamptz,
  integer,
  text
);
