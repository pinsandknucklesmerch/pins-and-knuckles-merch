create table public.sales_kpi_months (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  year integer not null,
  month integer not null,
  monthly_profit numeric(14,2),
  quotes_done integer,
  orders_processed integer,
  sales_inbox_enquiries integer,
  converted integer,
  data_source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid null references public.profiles(id) on delete set null,
  constraint sales_kpi_months_year_chk check (year >= 2020),
  constraint sales_kpi_months_month_chk check (month between 1 and 12),
  constraint sales_kpi_months_profit_chk check (monthly_profit is null or monthly_profit >= 0),
  constraint sales_kpi_months_quotes_chk check (quotes_done is null or quotes_done >= 0),
  constraint sales_kpi_months_orders_chk check (orders_processed is null or orders_processed >= 0),
  constraint sales_kpi_months_enquiries_chk check (sales_inbox_enquiries is null or sales_inbox_enquiries >= 0),
  constraint sales_kpi_months_converted_chk check (converted is null or converted >= 0),
  constraint sales_kpi_months_source_chk check (data_source in ('manual', 'historical_fixture', 'monday', 'epcc_email')),
  constraint sales_kpi_months_period_key unique nulls not distinct (organisation_id, year, month)
);

create table public.sales_kpi_member_months (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  year integer not null,
  month integer not null,
  team_member_key text not null,
  team_member_name text not null,
  quotes_done integer,
  orders_processed integer,
  sales_inbox_enquiries integer,
  converted integer,
  profit numeric(14,2),
  data_source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid null references public.profiles(id) on delete set null,
  constraint sales_kpi_member_months_year_chk check (year >= 2020),
  constraint sales_kpi_member_months_month_chk check (month between 1 and 12),
  constraint sales_kpi_member_months_key_chk check (length(trim(team_member_key)) > 0),
  constraint sales_kpi_member_months_name_chk check (length(trim(team_member_name)) > 0),
  constraint sales_kpi_member_months_quotes_chk check (quotes_done is null or quotes_done >= 0),
  constraint sales_kpi_member_months_orders_chk check (orders_processed is null or orders_processed >= 0),
  constraint sales_kpi_member_months_enquiries_chk check (sales_inbox_enquiries is null or sales_inbox_enquiries >= 0),
  constraint sales_kpi_member_months_converted_chk check (converted is null or converted >= 0),
  constraint sales_kpi_member_months_profit_chk check (profit is null or profit >= 0),
  constraint sales_kpi_member_months_source_chk check (data_source in ('manual', 'historical_fixture', 'monday', 'epcc_email')),
  constraint sales_kpi_member_months_period_key unique nulls not distinct (organisation_id, year, month, team_member_key)
);

create table public.sales_kpi_targets (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid null references public.organisations(id) on delete cascade,
  metric_code text not null,
  target_value numeric(14,2) not null,
  effective_from date not null,
  effective_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_kpi_targets_metric_chk check (metric_code in ('MONTHLY_PROFIT', 'QUOTES_DONE', 'ORDERS_PROCESSED', 'CONVERSION_RATE')),
  constraint sales_kpi_targets_value_chk check (target_value >= 0),
  constraint sales_kpi_targets_dates_chk check (effective_to is null or effective_to >= effective_from),
  constraint sales_kpi_targets_period_key unique nulls not distinct (organisation_id, metric_code, effective_from)
);

create trigger sales_kpi_months_set_updated_at before update on public.sales_kpi_months
  for each row execute function public.set_updated_at();
create trigger sales_kpi_member_months_set_updated_at before update on public.sales_kpi_member_months
  for each row execute function public.set_updated_at();
create trigger sales_kpi_targets_set_updated_at before update on public.sales_kpi_targets
  for each row execute function public.set_updated_at();

alter table public.sales_kpi_months enable row level security;
alter table public.sales_kpi_member_months enable row level security;
alter table public.sales_kpi_targets enable row level security;

create policy "sales_kpi_months_read" on public.sales_kpi_months for select to authenticated
  using (public.has_pins_hub_access());
create policy "sales_kpi_months_insert_admin" on public.sales_kpi_months for insert to authenticated
  with check (public.has_pins_hub_access('admin'));
create policy "sales_kpi_months_update_admin" on public.sales_kpi_months for update to authenticated
  using (public.has_pins_hub_access('admin')) with check (public.has_pins_hub_access('admin'));
create policy "sales_kpi_months_delete_admin" on public.sales_kpi_months for delete to authenticated
  using (public.has_pins_hub_access('admin'));

create policy "sales_kpi_member_months_read" on public.sales_kpi_member_months for select to authenticated
  using (public.has_pins_hub_access());
create policy "sales_kpi_member_months_insert_admin" on public.sales_kpi_member_months for insert to authenticated
  with check (public.has_pins_hub_access('admin'));
create policy "sales_kpi_member_months_update_admin" on public.sales_kpi_member_months for update to authenticated
  using (public.has_pins_hub_access('admin')) with check (public.has_pins_hub_access('admin'));
create policy "sales_kpi_member_months_delete_admin" on public.sales_kpi_member_months for delete to authenticated
  using (public.has_pins_hub_access('admin'));

create policy "sales_kpi_targets_read" on public.sales_kpi_targets for select to authenticated
  using (public.has_pins_hub_access());
create policy "sales_kpi_targets_insert_admin" on public.sales_kpi_targets for insert to authenticated
  with check (public.has_pins_hub_access('admin'));
create policy "sales_kpi_targets_update_admin" on public.sales_kpi_targets for update to authenticated
  using (public.has_pins_hub_access('admin')) with check (public.has_pins_hub_access('admin'));
create policy "sales_kpi_targets_delete_admin" on public.sales_kpi_targets for delete to authenticated
  using (public.has_pins_hub_access('admin'));

insert into public.sales_kpi_targets (organisation_id, metric_code, target_value, effective_from)
values
  (null, 'MONTHLY_PROFIT', 155000, '2020-01-01'),
  (null, 'QUOTES_DONE', 300, '2020-01-01'),
  (null, 'ORDERS_PROCESSED', 200, '2020-01-01'),
  (null, 'CONVERSION_RATE', 65, '2020-01-01');

grant select, insert, update, delete
on public.sales_kpi_months
to authenticated;

grant select, insert, update, delete
on public.sales_kpi_member_months
to authenticated;

grant select, insert, update, delete
on public.sales_kpi_targets
to authenticated;