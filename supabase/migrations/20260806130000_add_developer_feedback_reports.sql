-- Developer access extends Pins Hub administration without changing organisation roles.
alter table public.app_access drop constraint if exists app_access_access_level_check;
alter table public.app_access add constraint app_access_access_level_check check (access_level in ('developer', 'admin', 'write', 'read'));

create or replace function public.has_pins_hub_developer_access()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organisation_members membership
    join public.app_access access on access.organisation_member_id = membership.id and access.app_key = 'pins_hub'
    where membership.user_id = auth.uid() and membership.is_active
      and (membership.role = 'owner' or access.access_level = 'developer')
  );
$$;
grant execute on function public.has_pins_hub_developer_access() to authenticated;

create table public.hub_feedback_reports (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  issue_type text not null check (issue_type in ('bug', 'incorrect_data', 'suggestion', 'other')),
  comment text not null check (length(trim(comment)) > 0), attempted_action text,
  page_route text not null, user_agent text, status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'closed')),
  developer_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  resolved_at timestamptz, resolved_by uuid references public.profiles(id) on delete set null
);
create index hub_feedback_reports_created_at_idx on public.hub_feedback_reports(created_at desc);
create trigger set_hub_feedback_reports_updated_at before update on public.hub_feedback_reports for each row execute function public.set_updated_at();
alter table public.hub_feedback_reports enable row level security;

create policy "Developers can read feedback reports" on public.hub_feedback_reports for select to authenticated using (public.has_pins_hub_developer_access());

create or replace function public.submit_hub_feedback_report(p_issue_type text, p_comment text, p_attempted_action text, p_page_route text, p_user_agent text)
returns uuid language plpgsql security definer set search_path = public as $$
declare target_organisation_id uuid; report_id uuid;
begin
  select membership.organisation_id into target_organisation_id from public.organisation_members membership join public.app_access access on access.organisation_member_id = membership.id
  where membership.user_id = auth.uid() and membership.is_active and access.app_key = 'pins_hub' and access.access_level in ('developer', 'admin', 'write', 'read') limit 1;
  if auth.uid() is null or target_organisation_id is null then raise exception 'Pins Hub access required'; end if;
  if p_issue_type not in ('bug', 'incorrect_data', 'suggestion', 'other') or length(trim(coalesce(p_comment, ''))) = 0 then raise exception 'Invalid feedback report'; end if;
  insert into public.hub_feedback_reports (organisation_id, submitted_by, issue_type, comment, attempted_action, page_route, user_agent)
  values (target_organisation_id, auth.uid(), p_issue_type, trim(p_comment), nullif(trim(p_attempted_action), ''), left(case when p_page_route like '/hub%' then p_page_route else '/hub' end, 500), nullif(left(p_user_agent, 1000), '')) returning id into report_id;
  return report_id;
end; $$;
grant execute on function public.submit_hub_feedback_report(text, text, text, text, text) to authenticated;

create or replace function public.update_hub_feedback_report(p_id uuid, p_status text, p_developer_notes text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_pins_hub_developer_access() then raise exception 'Developer access required'; end if;
  if p_status not in ('new', 'in_progress', 'resolved', 'closed') then raise exception 'Invalid status'; end if;
  update public.hub_feedback_reports set status = p_status, developer_notes = nullif(trim(p_developer_notes), ''),
    resolved_at = case when p_status in ('resolved', 'closed') then now() else null end,
    resolved_by = case when p_status in ('resolved', 'closed') then auth.uid() else null end where id = p_id;
end; $$;
grant execute on function public.update_hub_feedback_report(uuid, text, text) to authenticated;
