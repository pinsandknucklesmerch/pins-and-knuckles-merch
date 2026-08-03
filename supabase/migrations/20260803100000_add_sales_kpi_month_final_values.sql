create table public.sales_kpi_month_final_values (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  year integer not null,
  month integer not null,
  metric_code text not null,
  final_value numeric(14,2) not null,
  updated_at timestamptz not null default now(),
  updated_by uuid null references public.profiles(id) on delete set null,
  constraint sales_kpi_month_final_values_year_chk check (year >= 2020),
  constraint sales_kpi_month_final_values_month_chk check (month between 1 and 12),
  constraint sales_kpi_month_final_values_metric_chk check (metric_code in ('MONTHLY_PROFIT', 'PK_TAX', 'QUOTES_DONE', 'ORDERS_PROCESSED')),
  constraint sales_kpi_month_final_values_non_negative_chk check (final_value >= 0),
  constraint sales_kpi_month_final_values_integer_metric_chk check (
    metric_code not in ('QUOTES_DONE', 'ORDERS_PROCESSED') or final_value = trunc(final_value)
  ),
  constraint sales_kpi_month_final_values_period_key unique nulls not distinct (organisation_id, year, month, metric_code)
);

create trigger sales_kpi_month_final_values_set_updated_at before update on public.sales_kpi_month_final_values
  for each row execute function public.set_updated_at();

alter table public.sales_kpi_month_final_values enable row level security;

create policy "sales_kpi_month_final_values_read" on public.sales_kpi_month_final_values for select to authenticated
  using (public.has_pins_hub_access());
create policy "sales_kpi_month_final_values_insert_admin" on public.sales_kpi_month_final_values for insert to authenticated
  with check (public.has_pins_hub_access('admin'));
create policy "sales_kpi_month_final_values_update_admin" on public.sales_kpi_month_final_values for update to authenticated
  using (public.has_pins_hub_access('admin')) with check (public.has_pins_hub_access('admin'));
create policy "sales_kpi_month_final_values_delete_admin" on public.sales_kpi_month_final_values for delete to authenticated
  using (public.has_pins_hub_access('admin'));

grant select, insert, update, delete on public.sales_kpi_month_final_values to authenticated;
