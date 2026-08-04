create table public.sales_dashboard_tv_settings (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  slide_key text not null,
  is_enabled boolean not null default true,
  display_order integer not null,
  duration_seconds integer not null default 30,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint sales_dashboard_tv_settings_slide_key_chk
    check (slide_key in ('overview', 'ytd', 'year_comparison', 'snuggle', 'team_members')),
  constraint sales_dashboard_tv_settings_display_order_chk
    check (display_order >= 0),
  constraint sales_dashboard_tv_settings_duration_seconds_chk
    check (duration_seconds between 10 and 300),
  constraint sales_dashboard_tv_settings_pkey primary key (organisation_id, slide_key),
  constraint sales_dashboard_tv_settings_order_key
    unique (organisation_id, display_order)
    deferrable initially deferred
);

create index sales_dashboard_tv_settings_organisation_idx
  on public.sales_dashboard_tv_settings (organisation_id, display_order);

create or replace function public.has_pins_hub_access_for_organisation(
  target_organisation_id uuid,
  required_access_level text default null
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organisation_members om
    join public.app_access aa
      on aa.organisation_member_id = om.id
    where om.user_id = auth.uid()
      and om.organisation_id = target_organisation_id
      and aa.app_key = 'pins_hub'
      and (
        (
          required_access_level is null
          and aa.access_level in ('admin', 'write', 'read')
        )
        or (
          required_access_level = 'admin'
          and aa.access_level = 'admin'
        )
      )
  );
$$;

revoke all on function public.has_pins_hub_access_for_organisation(uuid, text) from public;
revoke all on function public.has_pins_hub_access_for_organisation(uuid, text) from anon;
grant execute on function public.has_pins_hub_access_for_organisation(uuid, text) to authenticated;

create trigger sales_dashboard_tv_settings_set_updated_at
before update on public.sales_dashboard_tv_settings
for each row execute function public.set_updated_at();

alter table public.sales_dashboard_tv_settings enable row level security;

grant select, insert, update, delete on public.sales_dashboard_tv_settings to authenticated;

create policy "sales_dashboard_tv_settings_read"
on public.sales_dashboard_tv_settings
for select
to authenticated
using (public.has_pins_hub_access_for_organisation(organisation_id));

create policy "sales_dashboard_tv_settings_insert_admin"
on public.sales_dashboard_tv_settings
for insert
to authenticated
with check (public.has_pins_hub_access_for_organisation(organisation_id, 'admin'));

create policy "sales_dashboard_tv_settings_update_admin"
on public.sales_dashboard_tv_settings
for update
to authenticated
using (public.has_pins_hub_access_for_organisation(organisation_id, 'admin'))
with check (public.has_pins_hub_access_for_organisation(organisation_id, 'admin'));

create policy "sales_dashboard_tv_settings_delete_admin"
on public.sales_dashboard_tv_settings
for delete
to authenticated
using (public.has_pins_hub_access_for_organisation(organisation_id, 'admin'));

insert into public.sales_dashboard_tv_settings (
  organisation_id,
  slide_key,
  is_enabled,
  display_order,
  duration_seconds
)
select
  organisation.id,
  defaults.slide_key,
  true,
  defaults.display_order,
  30
from public.organisations organisation
cross join (
  values
    ('overview', 0),
    ('ytd', 1),
    ('year_comparison', 2),
    ('snuggle', 3),
    ('team_members', 4)
) as defaults(slide_key, display_order)
where organisation.slug = 'pins-knuckles'
  and not exists (
    select 1
    from public.sales_dashboard_tv_settings existing
    where existing.organisation_id = organisation.id
      and existing.slide_key = defaults.slide_key
  );
