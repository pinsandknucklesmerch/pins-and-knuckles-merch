-- The server-only Monday Sales Dashboard sync reads existing monthly snapshots
-- and upserts confirmed Scope A/Scope B values. RLS remains enabled; these
-- table privileges are only for the service_role used by the CLI.
grant select, insert, update
on table public.sales_kpi_months
to service_role;
