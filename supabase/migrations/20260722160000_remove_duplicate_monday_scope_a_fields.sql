-- Scope A is canonicalised as Quotes Done and Orders Processed. Preserve each
-- existing Scope A value before removing the duplicate snapshot columns.
begin;

update public.sales_kpi_months
set
  quotes_done = case
    when monday_scope_a_leads is not null then monday_scope_a_leads
    else quotes_done
  end,
  orders_processed = case
    when monday_scope_a_converted is not null then monday_scope_a_converted
    else orders_processed
  end
where monday_scope_a_leads is not null
   or monday_scope_a_converted is not null;

alter table public.sales_kpi_months
  drop constraint if exists sales_kpi_months_monday_scope_a_leads_chk,
  drop constraint if exists sales_kpi_months_monday_scope_a_converted_chk,
  drop constraint if exists sales_kpi_months_monday_scope_a_rate_chk,
  drop column monday_scope_a_leads,
  drop column monday_scope_a_converted,
  drop column monday_scope_a_conversion_rate;

commit;
