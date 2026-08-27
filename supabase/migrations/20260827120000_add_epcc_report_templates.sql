create table public.epcc_report_templates (
  organisation_id uuid primary key references public.organisations(id) on delete cascade,
  template jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create trigger epcc_report_templates_set_updated_at
before update on public.epcc_report_templates
for each row execute function public.set_updated_at();

alter table public.epcc_report_templates enable row level security;

create policy "Members can read their organisation EPCC report template"
on public.epcc_report_templates for select to authenticated
using (public.is_organisation_member(organisation_id));

create policy "Pins Hub admins can insert their organisation EPCC report template"
on public.epcc_report_templates for insert to authenticated
with check (public.has_pins_hub_access('admin') and public.is_organisation_member(organisation_id));

create policy "Pins Hub admins can update their organisation EPCC report template"
on public.epcc_report_templates for update to authenticated
using (public.has_pins_hub_access('admin') and public.is_organisation_member(organisation_id))
with check (public.has_pins_hub_access('admin') and public.is_organisation_member(organisation_id));
