create table public.developer_diagnostic_issues (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  source text not null, issue_key text not null, issue_type text not null,
  reporting_year integer not null check (reporting_year >= 2000), reporting_month integer not null check (reporting_month between 1 and 12),
  affected_item_id text, affected_member_key text, summary text not null, occurrence_count integer not null default 1 check (occurrence_count > 0),
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'ignored')),
  developer_notes text, first_detected_at timestamptz not null default now(), last_detected_at timestamptz not null default now(), no_longer_detected_at timestamptz,
  resolved_at timestamptz, resolved_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organisation_id, issue_key)
);
create index developer_diagnostic_issues_inbox_idx on public.developer_diagnostic_issues (organisation_id, status, last_detected_at desc);
create trigger set_developer_diagnostic_issues_updated_at before update on public.developer_diagnostic_issues for each row execute function public.set_updated_at();
alter table public.developer_diagnostic_issues enable row level security;
create or replace function public.has_pins_hub_developer_access_for_organisation(target_organisation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organisation_members membership
    join public.app_access access on access.organisation_member_id = membership.id and access.app_key = 'pins_hub'
    where membership.organisation_id = target_organisation_id and membership.user_id = auth.uid() and membership.is_active
      and (membership.role = 'owner' or access.access_level = 'developer')
  );
$$;
grant execute on function public.has_pins_hub_developer_access_for_organisation(uuid) to authenticated;
create policy "Developers can read diagnostic issues" on public.developer_diagnostic_issues for select to authenticated using (public.has_pins_hub_developer_access_for_organisation(organisation_id));

create or replace function public.update_developer_diagnostic_issue(p_id uuid, p_status text, p_developer_notes text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_pins_hub_developer_access() then raise exception 'Developer access required'; end if;
  if p_status not in ('open', 'investigating', 'resolved', 'ignored') then raise exception 'Invalid status'; end if;
  update public.developer_diagnostic_issues set status = p_status, developer_notes = nullif(trim(p_developer_notes), ''),
    resolved_at = case when p_status = 'resolved' then now() else null end,
    resolved_by = case when p_status = 'resolved' then auth.uid() else null end
  where id = p_id and public.has_pins_hub_developer_access_for_organisation(organisation_id);
end; $$;
grant execute on function public.update_developer_diagnostic_issue(uuid, text, text) to authenticated;
