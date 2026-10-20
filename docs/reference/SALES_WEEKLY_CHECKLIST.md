# Sales Weekly Checklist

The current board lives at `/hub/sales-checklist`; administrators manage duties and
organisation-user assignments at `/hub/sales-checklist/manage`. Previous-week navigation
is removed. Legacy `?week=` URLs display the current board; historical RPC requests are
rejected. Organisation-scoped RLS limits period, staff/duty snapshot and status reads to
the current week. Existing historical rows remain in the database without destructive
cleanup. Source configuration and existing duties, assignments and current statuses are
preserved by the migration.

## Weekly rollover

The period boundary remains Monday 09:00 Africa/Johannesburg (07:00 UTC). Before that
time, the preceding period remains current. The existing
`/api/cron/sales-checklist-rollover` cron (`0 7 * * 1`) and current-board reads both call
`ensure_sales_checklist_week`, protected by the existing organisation transaction lock.
The next board starts with every task set to To Do. A late/missed cron creates only the
current period using its effective configuration; intervening historical periods are
no longer backfilled. Rollover is idempotent. One organisation's setup failure does not
roll back successful organisations; cron reports failure for retry.

## Statuses, scores and permissions

Each click cycles To Do → Completed → N/A → To Do. Scores remain
Completed / (Completed + To Do), rounded to a percentage; N/A is excluded. No applicable
tasks show N/A without a percentage/progress bar. Shared status controls, profile display
name enrichment, keyboard behaviour, table layout and optimistic feedback are retained.

Only active Hub users can read their organisation's board. Staff can edit their own
current column, with captured membership and Auth identity checked. Existing Hub
admin/developer and active owner capability permits editing any column. The database
checks period boundaries independently of stale browser state.

**Clear All** appears only when the database reports reset permission. Its confirmation
dialog explains that every team member's tasks will become To Do and cannot be undone.
The checked RPC derives the actor from `auth.uid()` and permits existing checklist
administrators/developers (including the established active owner capability), or Johan's
explicitly provisioned Auth UUID in that organisation. There is no name/email comparison
or client-supplied actor authority. Johan still requires active organisation Hub access.

The reset updates the full current task matrix and rotates the board's reset revision
in one transaction. Status writes, resets, configuration changes and rollover share the
organisation lock. Each status save must supply the board's reset revision, so a delayed
save from another browser cannot restore a status after reset. The previous status RPC
signature and direct authenticated status UPDATE permission are removed to prevent
bypassing this guard. The checked security-definer writer explicitly reuses the existing
organisation/current-column permission helper; RLS remains enabled with existing update
policies retained. Actor/timestamp auditing remains in place. Stale reset requests are
also rejected. UI edits are blocked during confirmation/reset; Clear All is blocked while
local saves are pending. A successful reset refreshes the board before editing resumes.

The page refreshes every minute while visible and on returning to the tab. Other open
boards converge on refresh; the database rejects writes using an obsolete reset revision.

## Configuration management

Management still supports adding, renaming, ordering and deactivating duties; selecting,
ordering, activating and deactivating actual organisation-user assignments. Assigned
users must be unique, with at least one active team member. Deactivate existing source
rows instead of deleting them. Initial bootstrap Monday identities are Johan `14589471`,
Hardus `29869326`, Bux `26816626` and Justin `69507598`; these are external IDs, not Auth
UUIDs. Management selects real active organisation users with Hub access and resolves
identities server-side. Missing bootstrap links require configuration before first use.

Once any period exists, configuration changes take effect the following Monday at
09:00, even if this week's board has not yet materialized. Initial setup before the first
period takes effect this week. Effective-dated full configuration versions and source
records remain intact. Concurrent configuration saves reject stale revisions and stale
effective weeks under the organisation lock. The private configuration writer cannot
bypass the checked management RPC. Refresh Configuration discards a stale local draft.
Clear All changes statuses only; it does not alter duties, staff or pending configuration.

## TV Mode

The checklist remains a read-only slide in the Sales Dashboard TV rotation, independently
of the dashboard reporting month/year. TV settings still control enabled state, order
and duration, using validated persisted settings and existing fallback defaults. The
full assigned checklist team is displayed, including Johan. Scores and status presentation
use the same domain rules as the page.

The slide reads the current board on entry, every 15 seconds while visible and when
returning to the tab. This picks up Clear All and Monday rollover through the same RPC;
access/setup failures clear stale data and show existing failure states. Status-only
refreshes, including Clear All, retain playback position. A changed week or duty/team
layout restarts pagination. Pages contain up to four staff/eight duties, with scores
covering all duties. Pause, full-page dwell, duration-plus-complete-pass rotation gating,
manual Next/Previous and single-slide restart behaviour are unchanged. Error/empty states
do not block rotation indefinitely. Dashboard settings refresh behaviour is unchanged.

## Deployment

Apply the migrations in order through the established Supabase workflow:

1. `20261013100000_sales_weekly_checklist.sql`
2. `20261013110000_sales_checklist_management_and_tv.sql`
3. `20261013120000_sales_checklist_batch3.sql`
4. `20261015100000_sales_checklist_current_board_reset.sql`

Coordinate migration 4 with the application deployment: the status RPC now requires
`p_reset_revision`, and the read payload is current-board-only. Existing checklist tabs
must refresh after deployment. Old clients cannot write through the removed signature.
No historical data is deleted and no configuration/status reset occurs during migration.
New schema and functions are Hub-checklist-only; shared auth helpers, membership semantics,
Merch tables/policies and TV settings/rotation contracts are unchanged.

Provision **only Johan's verified Supabase Auth user UUID** in
`public.sales_checklist_reset_users` using a trusted database connection. The table has
no authenticated client access and no UI for granting reset privileges. Insert/upsert
`(organisation_id, user_id)` for the intended organisation after verifying that exact Auth
account; never substitute a Monday ID or match runtime names/emails. Without this row,
Johan's special permission is denied; administrators retain their normal reset capability.
The UUID was not established from repository evidence and must be supplied before rollout.

Retain the existing Vercel cron deployment, server-only `CRON_SECRET` and Supabase
service-role credentials. No new secret or schedule is required. RPC TypeScript contracts
are maintained locally; they are not evidence of deployed schema.

Remote migration application, Johan identity provisioning, cron execution and live
runtime behaviour remain unconfirmed. Lint, tests, typecheck, build, browser checks and
routine Git operations were not run as requested. The existing pagination fixture was
updated for the current-board domain shape; no verification commands were run.
