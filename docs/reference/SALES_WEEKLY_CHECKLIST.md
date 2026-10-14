# Sales Weekly Checklist

The checklist lives at `/hub/sales-checklist`; administrators manage its configuration
at `/hub/sales-checklist/manage`. The additive Hub-only migrations are
`20261013100000_sales_weekly_checklist.sql` (Batch 1) and
`20261013110000_sales_checklist_management_and_tv.sql` (Batch 2), followed by
`20261013120000_sales_checklist_batch3.sql` (Batch 3). They do not change
shared authentication, access helpers, organisation membership semantics or Merch policies.

## Deployment and identity setup

Apply these migrations in order through the established Supabase migration workflow. Batch 1
seeds the six requested duties and four staff assignments for the organisation whose
slug is `pins-knuckles`. Other organisations can configure their team and duties in
Checklist Management; their records remain organisation-scoped.

Batch 1's bootstrap can link the four staff through the existing canonical Monday
identity in **User Access Management**:

| Staff | Monday person ID |
| --- | --- |
| Johan | 14589471 |
| Hardus | 29869326 |
| Bux | 26816626 |
| Justin | 69507598 |

These IDs come from `src/features/sales-dashboard/domain/memberIdentity.ts`; they are
external person IDs, not authentication UUIDs. Membership links must belong to the
same organisation, be active, point to an existing authenticated user, and have
Pins Hub app access. Do not match on display names or fabricate user UUIDs.
The initializer resolves unbound bootstrap assignments from those links. Batch 2
also supports selecting actual organisation users directly in **Checklist Management**,
without requiring Monday links. Selection is restricted to active memberships backed
by real Auth users with Hub access. Names and user identities are resolved server-side;
the client cannot supply an authoritative name or user UUID. Missing bootstrap links
show a setup message. Select the four users and save before opening the first checklist.

Deploy the Vercel cron declaration and configure the existing server-only `CRON_SECRET`
and service-role credentials. `/api/cron/sales-checklist-rollover` runs at `0 7 * * 1`
(Monday 09:00 Africa/Johannesburg). Remote migration application, staff links and cron
deployment have not been confirmed by this implementation.

The first period starts with the current week; no earlier business history is invented.
Thereafter cron and current-week page loads create persisted periods idempotently.
The database determines the current period from Africa/Johannesburg time; before Monday
09:00 the previous week is current. Cron execution time does not define the boundary.
Missed periods use the configuration effective for each period and start as To Do.
The Batch 2 migration captures the source configuration as a baseline; it cannot
reconstruct undocumented configuration changes from before that migration. Existing
weekly snapshots are never rewritten. A failed organisation does not roll back successful organisations;
the cron returns an error for retry. No previous period is deleted or reset.

## Behavior and access

Duties are rows and staff are columns. Status changes persist immediately through a
server action and an invoker RPC subject to RLS. Pending controls show Saving; shared
toasts report success or failure. Scores use Completed / (Completed + To Do), excluding
N/A. Zero applicable tasks show N/A and no percentage or progress bar.

Only active Hub users may read records in their organisation. A salesperson may
change only their own current-week column, with the snapshotted membership and user
both rechecked. Hub administrators/developers and active organisation owners with Hub
access may change any current-week column. No other client mutations are granted.
The database checks the Monday 09:00 boundary independently of browser state.
Historical weeks are read only through the selector and direct week URLs.

Weekly duty names, staff names, identities, order and the full task matrix are
snapshotted. Source duties/assignments are referenced without cascading deletion;
deactivate them for future periods. Membership removal clears the source assignment
link while retaining historical user/membership identity snapshots. Status updates
record the authenticated actor and timestamp. Client access is limited to updating
the status column, never the period, identity, snapshot or audit fields. Existing
snapshotted staff who subsequently lose Hub access remain visible to authorised users;
they cannot edit their old or current column. Administrators can still edit the current
period and schedule future assignment changes.

The page refreshes while visible and on returning to the tab to pick up rollover and
other users' changes. The database remains authoritative if an open page is stale.

## Management and effective configuration

Management supports adding, renaming, moving and deactivating duties; selecting,
moving, activating and deactivating organisation-user assignments. Deactivation is
used rather than deletion. Each assigned user must be unique; at least one active team
member is required. Inactive users whose access was removed can be retained by clearing
their selection and deactivating the row. No names or Auth UUIDs are hard-coded in the
management interface. Newly generated duty/assignment UUIDs identify configuration
records, not user accounts.

Once any weekly period exists, all configuration changes take effect the following
Monday at 09:00. This applies even if the current period has not yet been materialized;
a missed cron cannot accidentally make an edit apply to this week. Before the first
ever period, initial setup takes effect this week. The editor displays that effective
date. There is no current-week configuration override in Batch 2.

Configuration versions persist full duty and staff definitions, including real user
identities, for safe delayed rollover. Repeated edits for the same future week replace
the pending version, with a fresh revision. Concurrent administrator saves reject
stale revisions instead of overwriting another administrator's work. Configuration
changes and rollover share an organisation lock. Saved source records and versions
are updated atomically; historical period rows remain untouched.

Batch 3 requires the save request to include the effective week displayed in the editor.
The database checks it under the organisation lock before calling the existing writer.
An editor left open across Monday 09:00, or across initial week creation, cannot silently
save for a different effective week. Stale-week and revision conflicts require an explicit
**Refresh Configuration** before saving again. Refresh reloads the configuration and
discards the unsaved draft; the component resets for either a new revision or effective
week. The old four-argument writer is private and cannot bypass the week guard.

Route checks, server actions and checked organisation-scoped RPCs require existing
Hub admin/developer capability (including the established active owner capability).
Configuration RLS permits admin reads only; no direct authenticated configuration or
source mutations are granted. The checked RPC is the management write boundary.

## TV Mode

**Sales Weekly Checklist** is a seventh slide in the existing Sales Dashboard TV
rotation. Enable/disable, reorder and set its duration at
`/hub/sales-dashboard/tv/settings`. Playback now consumes validated persisted settings;
missing/invalid settings use the shared safe defaults. Six-slide settings are normalized
during rollout by appending the new slide without changing their saved values. Saving
the seven-slide configuration requires the Batch 2 migration.

The checklist slide is read-only, includes the full assigned weekly team (including
Johan, who is normally hidden from dashboard member KPIs), and uses the same score
and zero-applicable-task rules as the interactive checklist. It always loads the
current weekly period regardless of the dashboard's selected reporting month/year.
Green/check, orange/clock and grey/minus indicators include text labels.

The slide reads on entry, every 15 seconds while visible, and when returning to the
tab, using the authenticated session and the same data-access/RPC boundary. This also
handles a missed/late rollover cron. Loading, setup and refresh failures are explicit;
old account data is cleared on failed access. The existing rotation refreshes saved
configuration and other dashboard data every five minutes while visible.

The initial four staff and six duties fit on one TV page. Larger teams/duty lists
page in groups of four staff/eight duties; scores always cover all duties. Paging
respects rotation pause and the configured slide duration. Increase the slide duration
for larger checklists to retain readability. No status edit controls are rendered.

Batch 3 gates automatic rotation on both the configured duration and a complete page
pass. Every page, including the last, receives its full dwell time. Large checklists
extend the slide beyond its configured duration when necessary; other slides retain
their existing timing. The controller shows **Showing remaining pages** while extended.
Manual Next/Previous still override automatic playback. A changed week, duty/team count
or order resets the page pass; status-only refreshes retain playback. Pausing also pauses
page advancement. Loading waits for content; error/empty-team states do not block rotation.
When the checklist is the only enabled slide, completed passes restart automatically.

TV settings saves and resets now apply the same existing owner override as the Hub UI.
The invoker RPC and table insert/update/delete RLS policies reuse
`can_admin_sales_checklist`: active organisation owners with Hub access may save settings
even when their stored app access is read/write. Non-owner users still require stored
admin/developer access. Shared authorisation helpers and Merch policies are unchanged.

## Deployment boundary and remaining work

Apply Batch 1, Batch 2 and Batch 3 in order, then deploy the application. Batch 2 backfills a baseline
configuration and appends the TV slide while preserving all existing TV settings.
The existing Monday 07:00 UTC cron schedule and secrets remain required; no new secret
or cron schedule is introduced. RPC types are included; table access remains behind
RPCs with validated JSON boundaries.

Batch 3 changes the management save RPC signature by requiring
`p_expected_effective_from`. Apply it with the corresponding application deployment;
open management tabs must refresh after deployment. It alters TV settings authorisation
policies/functions but does not update checklist records, scores, configuration values
or historical snapshots. No new secrets or cron configuration are required.

Remote migrations, staff account links, scheduling and live runtime behavior have not
been verified. Focused pagination and management-boundary tests are present but have
not been run. Sanitized per-organisation rollover diagnostics remain outside Batch 3.

Needs Help and mandatory activity notes are outside this implementation. Routine
verification and remote operational deployment were not run.


## Checklist UI refinements

The interactive, historical/read-only and TV checklist reuse one compact status button and Hub theme tokens. Each click cycles To Do → Completed → N/A → To Do. Completed is green, To Do orange and N/A grey, using shared theme-derived tones. All statuses use identical dimensions, padding, typography and alignment. Permissions affect interactivity, not the palette or opacity. Native buttons support Enter/Space and shared keyboard focus; duty/staff-specific accessible labels announce the current status and next action. Historical and other read-only cells remain disabled. Persisted status values remain `to_do`, `complete` and `na`; only the display label changes to Completed.

Changes save immediately with optimistic feedback. An entry-level synchronous guard blocks duplicate submissions; controls stay locked for that entry until the action settles. Confirmed status is tracked separately from the optimistic view. Failure restores the last confirmed status, shows the existing safe error toast and refreshes from the server to reconcile persisted state. Incoming refreshes update non-pending entries while preserving in-flight choices. Week selection is disabled during pending saves. RLS/RPC authorization remains the write authority.

The weekly table uses a fixed duty column, equal staff columns, centered compact status controls, full-name wrapping and horizontal overflow on narrow screens. Progress still uses the existing scoring function and excludes N/A. TV reuses the same disabled status button, Completed label and status colours; refresh, pagination, pause, full-page dwell and rotation completion logic are unchanged.

Staff labels prefer available profile full names from captured weekly user identities, using session-scoped, organisation/week-restricted reads. If enrichment is unavailable, saved names remain usable; email-shaped names use the established user-creation display-name fallback rather than exposing raw addresses as staff headings. No saved snapshots or account identities are rewritten. Management selection shows the display name, while email remains searchable and secondary account-disambiguation information in administrator options.

No database schema, scoring, history, rollover, management-write or TV rotation changes were made for these UI refinements. Lint, tests, typecheck, build, browser checks and routine Git operations were not run, as requested.
