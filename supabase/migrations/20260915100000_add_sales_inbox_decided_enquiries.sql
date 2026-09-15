alter table public.sales_kpi_months
  add column sales_inbox_decided_enquiries integer;

alter table public.sales_kpi_months
  add constraint sales_kpi_months_sales_inbox_decided_enquiries_chk
  check (sales_inbox_decided_enquiries is null or sales_inbox_decided_enquiries >= 0);
