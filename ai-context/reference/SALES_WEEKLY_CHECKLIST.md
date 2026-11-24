# Sales Weekly Checklist

The checklist at `/hub/sales-checklist` is one persistent current board per
organisation. Administrators manage duties and organisation-user assignments at
`/hub/sales-checklist/manage`. There are no week selectors, weekly snapshots,
effective-dated configurations or historical checklist views.

## Persistent board

`sales_checklist_duties` and `sales_checklist_assignments` own the active board
configuration and ordering. `sales_checklist_statuses` contains one row for each
active duty/assignment pair, with `to_do`, `complete` or `na` status.

Status clicks cycle To Do → Completed → N/A → To Do and update the status row
immediately through the authenticated Supabase client. RLS restricts staff to
their own assignment; existing Hub admin/developer and active-owner capability
can update every assignment. Scores remain Completed / (Completed + To Do),
rounded to a percentage, with N/A excluded.

Management changes apply immediately. Existing statuses remain for duty/staff
pairs that stay active. Deactivated pairs are removed from the status matrix;
new or reactivated pairs start at To Do. Assignments use active organisation
members with Pins Hub access and never infer Auth identity from display names or
email addresses.

## Reset

`reset_sales_checklist(organisation_id)` is the single atomic reset operation.
It sets non-To-Do rows to To Do and is safe to repeat. Manual **Clear All** uses
this function after confirmation. Database authorization derives the actor from
`auth.uid()` and permits checklist administrators/developers (including the
established active-owner capability) or the organisation's explicitly
provisioned Johan Auth UUID in `sales_checklist_reset_users`.

The existing `/api/cron/sales-checklist-rollover` endpoint runs at `0 7 * * 1`
(Monday 09:00 Africa/Johannesburg) and calls `reset_all_sales_checklists()`,
which invokes the same organisation reset function using the service role. No
new board or historical period is created.

## TV Mode

Sales Dashboard TV Mode reads the same persistent board. It remains read-only,
refreshes every 15 seconds while visible and preserves the existing staff/duty
pagination, dwell and rotation behavior. Status-only changes and resets retain
the current playback position; duty, assignment or ordering changes restart the
checklist pagination.

## Database migration and deployment

Apply the checklist migrations in order, ending with:

`20261020100000_simplify_sales_checklist_current_board.sql`

The migration:

- creates and populates `sales_checklist_statuses`;
- retains the newest available status for active matching duty/staff pairs;
- replaces snapshot/effective-date RPCs with current-board contracts;
- drops checklist weeks, snapshots, entries and effective-dated configurations;
- preserves duties, assignments, ordering, RLS and existing access helpers.

Deploy the application with the migration because the read, management, status
update and reset contracts change together. Retain the Vercel cron schedule,
server-only `CRON_SECRET` and Supabase service-role configuration.

Provision only Johan's verified Supabase Auth UUID in
`public.sales_checklist_reset_users` for the intended organisation through a
trusted database connection. The table has no authenticated client access. A
Monday member ID, display name or email address is not an acceptable substitute.

The schema remains Hub-specific. Shared authentication/access helpers and Pins
Merch tables or policies are not changed.
