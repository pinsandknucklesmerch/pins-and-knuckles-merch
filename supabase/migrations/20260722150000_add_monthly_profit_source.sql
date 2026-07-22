-- Local-only until reviewed and applied. The KPI row continues to represent
-- Monday lead/conversion data while monthly profit has an independent source.
alter table public.sales_kpi_months
  add column monthly_profit_source text;

alter table public.sales_kpi_months
  add constraint sales_kpi_months_monthly_profit_source_chk
    check (monthly_profit_source is null or monthly_profit_source in ('manual', 'monday', 'epcc_email'));
