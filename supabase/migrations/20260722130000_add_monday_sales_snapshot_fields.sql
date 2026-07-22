-- Local-only until reviewed and applied. Scope A and Monday provenance do not
-- map safely onto the existing dashboard columns.
alter table public.sales_kpi_months
  add column monday_scope_a_leads integer,
  add column monday_scope_a_converted integer,
  add column monday_scope_a_conversion_rate numeric(5,2),
  add column monday_sync_metadata jsonb;

alter table public.sales_kpi_months
  add constraint sales_kpi_months_monday_scope_a_leads_chk
    check (monday_scope_a_leads is null or monday_scope_a_leads >= 0),
  add constraint sales_kpi_months_monday_scope_a_converted_chk
    check (monday_scope_a_converted is null or monday_scope_a_converted >= 0),
  add constraint sales_kpi_months_monday_scope_a_rate_chk
    check (monday_scope_a_conversion_rate is null or (monday_scope_a_conversion_rate >= 0 and monday_scope_a_conversion_rate <= 100));
