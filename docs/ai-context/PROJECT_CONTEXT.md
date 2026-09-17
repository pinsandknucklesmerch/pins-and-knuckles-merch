# Pins Hub — Canonical Project Context

## Band-first lifecycle and legacy compatibility (Batch 2C-2C)

`20260911170000_finalize_merchbuddy_band_lifecycle.sql` completes the prepared backend authorization/lifecycle chain. Legacy Tour-user rows now support soft revocation by a direct Band owner only; no authenticated client can create or otherwise mutate new legacy grants. Revoked grants are excluded from the internal exact-Tour resolver, never create Band-wide access, and inactive Bands continue to block legacy operational writes. Direct owners deactivate Bands through a status-only RPC; effective active managers or direct owners reactivate them through a separate status-only RPC, leaving the inactive-definition guard intact. Account-manager associations remain non-authorizing metadata with authenticated mutation deferred; no Organisation-admin mutation path is restored. The Band-first schema, helpers, RLS cutover, creation, direct membership/ownership, Organisation assignment, and lifecycle migrations are prepared but unapplied. The mobile app remains Organisation-first pending its separate cutover.

## Band-first remaining rollout

After prepared Batch 2C-2C, the remaining Band-first rollout is scoped account-manager administration if approved, a later/manual legacy Tour-user conversion or sunset decision, migration application and type regeneration through the shared schema workflow, runtime verification, and the separate mobile Band-first access/selection/provider cutover. Organisation relationship and explicit assignment administration are complete in the prepared migration sequence.

## Band-first Organisation management (Batch 2C-2B)

`20260911160000_manage_merchbuddy_band_organisations.sql` completes the Organisation relationship and explicit assignment slice. Direct owners request, remove, assign, change, and revoke; active target-Organisation members with effective Pins Hub or Pins Merch admin/developer access may accept a request or relinquish only their Organisation's own relationship. Every Organisation-derived Band path still requires active membership, eligible entitlement, an active relationship, and an active explicit assignment. Read entitlement caps assignments at viewer; write/admin/developer caps at manager. Relationships grant no Organisation-wide or future-Band access. Relationship removal/relinquishment soft-revokes active assignments but never alters direct membership or ownership; reattachment requires fresh acceptance and explicit reassignment. An owner-only lookup exposes minimal eligible member identity fields for a single attached Organisation. Legacy conversion/sunset and mobile Band-first cutover remain later work.

## Band-first direct membership administration (Batch 2C-2A)

`20260911150000_manage_merchbuddy_band_members.sql` adds private Band invitations and authenticated RPCs for direct membership role changes, soft revocation/self-leave, and explicit ownership transfer. Only active direct owners may administer direct members; Organisation-derived managers and Organisation owner/admin/developer status do not bypass that rule. Pending invitations grant no visibility, target an existing profile, expire after seven days, and require invited-profile acceptance plus current inviter-owner revalidation. Every mutation derives actors from `auth.uid()` and preserves event provenance. Band-row locking serializes ownership changes and guarantees at least one active direct owner; transfer promotes the target before optionally demoting the caller to manager. Organisation relationship/assignment administration remains Batch 2C-2B.

## Band-first creation (Batch 2C-1)

`20260911140000_create_merchbuddy_bands.sql` adds the authenticated transactional RPCs `create_merchbuddy_standalone_band(text)` and `create_merchbuddy_organisation_band(uuid, text)`. Both require a valid profile, derive all actor/owner fields from `auth.uid()`, and bootstrap a direct active owner before returning. Managed creation additionally requires active membership in the target Organisation and effective Pins Hub or Pins Merch admin/developer entitlement; it creates the active Organisation relationship and creator manager assignment. Raw authenticated Band INSERT remains blocked. Batch 2C-2 remains responsible for member/access administration, ownership transfer and last-owner protection, Organisation relationship/assignment administration, lifecycle/legacy-grant operations, and the later mobile cutover.

## Band-first operational authorization (2026-09-11, prepared Batch 2B)

`20260911120000_cut_over_merchbuddy_band_authorization.sql` follows the foundation
and Batch 2A. It defines the atomic operational RLS/helper cutover for Bands,
Tours, Products, variants, Shows, inventory, contacts, account-manager
associations, and Tour-user grants. It is prepared, not applied or runtime-verified
here; no generated types were regenerated in this batch.

The migration replaces the three operational Tour helpers and customer visibility
helper, adds `can_operate_merchbuddy_tour` for staff inventory writes, drops all
29 known policies, and creates 22 scoped policies in one transaction. All nine
tables are locked during the change; unexpected remaining policies abort and
roll back the transaction instead of leaving a permissive OR fallback.

After successful application, direct/explicitly assigned Band paths determine
operational access. Organisation entitlement alone and Organisation owner/admin/
developer status do not authorize Bands. Legacy Tour roles remain Tour-scoped;
legacy staff retains Product/Show compatibility writes while new Band staff has
only Count In/Count Out writes. Every operational write requires an active Band.

Authenticated mutation grants are column-specific: parent IDs, legacy Organisation
metadata, row IDs, creation timestamps, and actor fields cannot be changed through
ordinary updates. Inventory updates are restricted to its two counts. Band UPDATE
is direct-owner-only for name/status; a trigger rejects renaming an inactive Band
even when reactivating in the same statement. Owner reactivation must be status-only.

Band INSERT, account-manager association mutations, and legacy Tour-grant
mutations are blocked for authenticated clients pending Batch 2C RPCs. Contacts
require full Band visibility for reads and active manager/owner for writes.
Account-manager reads are owner-only; Tour grants are visible to their subject
or a direct Band owner. No authenticated hard-delete remains on these tables.

Tour INSERT RETURNING uses the policy row's existing parent Band permission,
without the old broad Organisation SELECT branch or a new-row STABLE lookup.
Descendant inserts authorize existing parents. The private Band access tables and
one-way Pins Hub/Merch entitlement inheritance are retained.

The mobile app is still Organisation-first and needs its later client cutover;
the old Create Band action is blocked after this migration is applied. Batch 2C
must implement transactional Band creation, member/Organisation assignment and
ownership administration, last-owner protection, and scoped lifecycle/legacy
grant operations. See the [Band-first reference](../reference/MERCH_BAND_FIRST_FOUNDATION.md)
for the full policy/grant inventory and deferred work. None of these migrations
has been applied as part of the implementation batches described here.

## Band-first Merch helpers (2026-09-11, prepared Batch 2A)

`20260911110000_add_merchbuddy_band_permission_helpers.sql` follows the foundation
migration below. It implements `get_merchbuddy_band_role`, the four
`can_access/operate/manage/administer_merchbuddy_band` predicates, and authenticated
`get_accessible_merchbuddy_bands()`. Three database-owner-only internal functions share
Band-path aggregation, caller-bound legacy Tour grants, and staged Tour access
context for the later cutover.

Effective Band role is the highest active direct or valid assigned Organisation
path. Organisation paths require the exact active caller membership, active
relationship/assignment, and existing Hub/Merch entitlement capped at viewer for
read or manager for write/admin/developer. Reusing the Organisation entitlement
helper relies on the existing unique Organisation/user membership constraint;
there is no Organisation-wide fallback or Organisation-owner exception. Owner
remains direct-only. Legacy Tour grants never raise Band-wide role.

The workspace RPC deduplicates Band IDs, returns active and inactive Bands with
role/provenance flags, and represents Tour-only users with a null Band role,
`is_tour_limited`, and only their assigned Tour IDs. Operate/manage predicates
require an active Band; historical reads and owner access administration remain
possible on inactive Bands. Permission tables remain private with no client
SELECT grants; only the six safe API functions gain authenticated execution.

Batch 2A is prepared, not applied or runtime-verified here. Batch 2A alone leaves
operational RLS and Tour helpers Organisation-first; the prepared Batch 2B above
cuts over those policies/helpers and protects canonical parent IDs. Do not infer
deployed Band-first protection from the presence of these migration files.
No mobile code or creation/mutation RPCs are included. See the
[foundation and Batch 2A reference](../reference/MERCH_BAND_FIRST_FOUNDATION.md)
for exact API shapes, security boundaries, and next-batch dependencies. Apply
foundation then Batch 2A, and regenerate shared/consumer database types afterward.

## Band-first Merch schema foundation (2026-09-11, prepared)

`20260911100000_add_merchbuddy_band_first_foundation.sql` adds direct Band
memberships, Organisation management relationships, and same-Organisation member
assignments. It establishes an unconditional Tour-to-Band FK and makes legacy
Band/Tour `organisation_id` metadata nullable. Physical `merchbuddy_customers`
names and all operational IDs/data are retained.

This is foundation-only and has not been applied in this batch. New access tables
are RLS-enabled with no client grants/policies; only service-role SELECT/INSERT/
UPDATE is granted. Existing Organisation-wide authorization helpers, operational
RLS, Pins Hub inheritance, and mobile navigation are unchanged. Direct Band access
and least-privilege Organisation visibility are not delivered until the separate
authorization cutover.

There are no real Bands; the guarded backfill supports zero or one disposable
Band, grants its valid creator direct ownership, and records its existing
Organisation relationship. It creates no Organisation-member assignments and
does not promote Tour users. Unexpected Band counts or an invalid creator abort
the transaction for explicit resolution. Regenerate shared and consumer database
types after application; generated snapshots were not hand-edited.

See [Band-first foundation reference](../reference/MERCH_BAND_FIRST_FOUNDATION.md)
for the exact schema, integrity rules, test-data handling, and next-batch policy
dependencies.

## Current shared schema status (2026-09-02)

The three previously pending migrations are now applied to project `vggajzzagwzgmddnytle`: TV cleanup, EPCC report templates, and MerchBuddy inventory counts. Pins Hub remains the authoritative migration repository; its generated types include both new tables.

## Shared Supabase ownership status (2026-09-02)

Pins Hub is the authoritative owner of the shared Supabase migration history for project `vggajzzagwzgmddnytle`. The inventory migration is prepared here as `supabase/migrations/20260902000000_create_merchbuddy_show_inventory_counts.sql`; it is not yet applied. Pins Merch App is a schema/type consumer and must not independently run `db push` against the shared project.

## Authority and verification boundary

This is the current repository context for Pins Hub. Current source code,
`supabase/migrations/`, configuration/package files, generated database types,
and tests are authoritative in that order. Plans, historical audits, Git
history, and this document are supporting evidence only.

Static review cannot prove deployed Vercel configuration or execution, remote
Supabase migration/RLS/RPC/grant state, production data, Google OAuth/mailbox
access, Monday access, or configured environment variables. Those are
operational verification items, not repository facts.

## Purpose, stack, and repository shape

Pins Hub is the internal Pins & Knuckles operations application for sales
reporting, pricing calculators, commercial invoices, PK Tax allocation,
reference-data maintenance, access administration, and developer support.
It uses Next.js App Router, React 19, TypeScript, Tailwind CSS, Supabase Auth
with SSR cookies, and forward-only Supabase migrations. Prisma, Neon, and the
legacy Hub architecture are not part of this application.

- `npm run dev` deliberately uses Webpack. `next.config.ts` enables
  `cacheComponents`, hides dev indicators, and permits `192.168.3.34` as a
  development origin.
- There are 38 migrations, from `20260709120000_foundation_auth_access.sql`
  through `20260817120000_remove_current_month_comparison_tv_slide.sql`.
- Feature code belongs under `src/features/`; routes remain thin. Initial data
  loading is predominantly server-side, while forms, exports, TV mode, and
  calculator interaction are client-side.

## Routes and active product areas

- Auth: `/`, `/login`, `/auth/confirm`, `/auth/error`,
  `/auth/forgot-password`, `/auth/invite`, `/auth/recovery-confirm`,
  `/auth/recovery-confirm/verify`, and `/auth/update-password`.
- Hub: `/hub`, `/hub/profile`, Analytics at `/hub/analytics` with Overview,
  Website, and Social Media views. Website reads live GA4 reporting; Meta and
  social integrations remain pending. User Access Management at `/hub/team`,
  `/hub/team/add`, and `/hub/team/[membershipId]`.
- Sales Dashboard: `/hub/sales-dashboard` and
  `/hub/sales-dashboard/tv/settings`. Reporting routes: `/hub/reporting`, `/hub/reporting/epcc`, and `/hub/reporting/metrics`.
- Calculators: EU Standard, EU US Clients, and UK Trade under
  `/hub/calculators`.
- Operations: PK Tax, Commercial Invoice Generator, Data Management for
  Garments, Product Types, and Invoice Companies, and Quick Reference.
- Developer: `/hub/developer`, `/hub/developer/feedback`, and
  `/hub/developer/diagnostics`.
- Scheduled routes: `GET /api/cron/epcc-profit` and
  `GET /api/cron/monday-sales-sync`.

### Quick Reference

Quick Reference is centrally managed in Supabase with no browser-local
persistence. `/hub/reference` provides protected active-record read/copy access;
write users can add and edit through `/hub/reference/manage`, while effective
admins (including developers under the existing hierarchy) can also deactivate,
reactivate, and permanently delete records. Read users have no management
controls.

## Authentication, access, and user management

- Browser code uses the publishable Supabase client; server components use the
  SSR-cookie client. `src/lib/supabase/admin.ts` is server-only and uses
  `SUPABASE_SERVICE_ROLE_KEY` only for privileged work.
- The proxy refreshes sessions and protected Hub rendering is gated by an
  authenticated, active membership with a `pins_hub` `app_access` row.
  Organisation roles (`owner`, `admin`, `manager`, `staff`, `viewer`) are
  distinct from Pins Hub levels (`read`, `write`, `admin`, `developer`). An
  owner has effective admin capability; owner or developer status grants the
  developer area and privileged user-management controls.
- User Access Management is accessible to effective admins. Owners/developers
  alone may add users or manage owner/developer access. It provisions or
  updates the profile, membership, and app access via server-only Admin API;
  a known Monday member ID is unique per organisation. Existing accounts are
  updated rather than duplicated. The last active owner cannot be deactivated
  or demoted.
- Updating a user synchronises the canonical profile `full_name` and Auth user
  display-name metadata. Invites/resends use Supabase Auth and configured site
  URLs; successful delivery remains a remote Auth/email configuration concern.
  A reset-password action exists in the user editor. `last_active_at` is a
  best-effort, throttled (15-minute) latest-activity timestamp, not audit
  history.

### Password recovery and invitation confirmation

The standard reset request calls `resetPasswordForEmail` with
`/auth/confirm?next=/auth/update-password`. `/auth/confirm` is the primary
callback: it exchanges a PKCE `code` for an SSR session, and also supports the
Supabase token-hash/OTP callback form for recovery or invite links. It only
redirects to a safe local `next`; invite confirmation selects invite mode.

`/auth/recovery-confirm` is the explicit token-hash recovery confirmation path:
it validates `token_hash` plus `type=recovery`, then its POST-only verify route
calls `verifyOtp` and creates the session before redirecting to the password
page. `/auth/update-password` requires that server-visible session. The client
then calls `updateUser({ password })`; recovery signs out and returns to login,
while invitation mode enters the Hub. Do not reintroduce client-side recovery
token exchange or abandoned implicit approaches.

## Sales Dashboard and Reporting

Reporting is the canonical location for EPCC report generation and metric exports. The Sales Dashboard remains the operational KPI view and no longer exposes duplicate export actions; shared report and metric business logic remains reused by Reporting.

The EPCC template editor independently controls meaningful report blocks including Bonus Profit, Previous-year YTD, YTD Target, and Target Variance, alongside the existing report cards. Persisted templates are forward-compatible through normalization/default merging and legacy-label migration; structural/chart elements remain fixed and calculations remain owned by the Sales Dashboard/domain pipeline.

`/hub/reporting/metrics` is the dedicated metric export workspace. It reuses the Sales Dashboard loader, metric definitions, and authoritative KPI/calculation pipeline; the duplicate Sales Dashboard export entry point has been removed. No duplicate metric business logic exists.

Reporting routes are `/hub/reporting`, `/hub/reporting/epcc`, and `/hub/reporting/metrics`. The EPCC workspace at `/hub/reporting/epcc` is the main place to view and export the Company Profit report; it shares the Sales Dashboard loader and authoritative KPI/calculation pipeline. `ProfitPdfReport` accepts a typed `EpccReportTemplate`; the canonical default preserves the existing two-page report, labels, ordering, sizing, and `[data-profit-pdf-page]` export targets. Template configuration controls presentation only; KPI and domain calculations remain authoritative elsewhere. The active template is persisted as one organisation-scoped configuration; malformed or missing data falls back to the canonical default.
Reporting routes are `/hub/reporting`, `/hub/reporting/epcc`, and `/hub/reporting/metrics`. The EPCC workspace at `/hub/reporting/epcc` is the main place to view and export the Company Profit report; it shares the Sales Dashboard loader and authoritative KPI/calculation pipeline. `ProfitPdfReport` accepts a typed `EpccReportTemplate`; the canonical default preserves the existing two-page report, labels, ordering, sizing, and `[data-profit-pdf-page]` export targets. Template configuration controls presentation only; KPI and domain calculations remain authoritative elsewhere. The active template is now persisted as one organisation-scoped configuration, editable only by existing Pins Hub admins; malformed or missing data falls back to the canonical default.

The dashboard is Supabase-first: rendering reads persisted company/member KPI
rows, effective targets, final-value overrides, TV settings, trends, and years;
it never calls Monday or Gmail during a page request. Views are Overview,
Company Profit, YTD, Snuggle, and Team Members. It supports active-data exports,
including metrics exports and the two-page EPCC profit PDF path. The report
reuses Sales Dashboard/domain presentation helpers: Company Profit contains
Monthly Profit, Target, Profit Above Target, and its dedicated gauge; Year to
Date contains YTD Profit, Monthly Profit, Monthly Profit Comparison, Orders
Processed, Active Marketing Enquiries, and Conversion Rate. TV mode is
dashboard query state; admins manage six persisted slides (enabled state,
order, and 10–300 second duration) in the TV settings route.

- `sales_kpi_months`, `sales_kpi_member_months`, and `sales_kpi_targets` hold
  KPI/snapshot and effective-dated target data. Organisation rows take
  precedence over global rows.
- Admins can set or clear independent month-final display overrides for Profit,
  PK Tax, Quotes Done, and Orders Processed. They are persisted in
  `sales_kpi_month_final_values` with editor/timestamp metadata and never
  rewrite source-owned values.
- The Overview Monthly Profit card deliberately shows only the current value,
  target progress, and shirt visual; it shares the Sales Inbox card's row
  height and has no prior-year comparison. Quotes Done, Orders Processed, and
  Conversion Rate share a three-band gauge whose target marks the green-band
  threshold. See `docs/reference/SALES_DASHBOARD.md` for presentation details.
- Member performance is shared by the Team Members view and profile feature.
  It merges organisation rows over global rows and then uses the retained
  historical workbook fixture only for missing periods. Dashboard query errors
  also surface historical data with a setup issue. The fixture is intentional
  technical debt, not live source data.

### KPI source ownership

- Monday owns Quotes Done, Orders Processed, sales-inbox/conversion fields,
  Monday provenance, and the corresponding member quote/order fields. It
  supplied monthly profit through June 2026.
- From July 2026 onward, EPCC/NetSuite report emails own company monthly Profit
  and member Profit/PK Tax. The active RPC rejects pre-July-2026 EPCC periods.
- Monday payload construction omits `monthly_profit` and its source from July
  2026 onward, so a Monday sync cannot overwrite EPCC profit. Monday and EPCC
  also patch only their owned member fields and metadata.

## Scheduled ingestion and observability

`vercel.json` currently schedules both jobs daily in UTC:

- EPCC profit: `5 8 * * *` (08:05).
- Monday sales sync: `15 8 * * *` (08:15).

Both handlers require `Authorization: Bearer <CRON_SECRET>`. EPCC reads Gmail,
parses/reconciles monthly company/member profit, handles duplicate and older
reports, and applies through the service-role
`ingest_epcc_monthly_profit_and_members` RPC. Its CLI defaults to dry-run;
the cron applies. The retired `ingest_epcc_monthly_profit` overload is not
current behavior.

Monday synchronises only the current UTC reporting month for the canonical Pins
& Knuckles organisation. It discovers/validates boards, records provenance,
uses an organisation/year/month database lock, completes canonical member rows,
and has guarded historical CLI tooling. A rejected sync reports a reason but
does not write an unsafe snapshot.

Both cron handlers now use best-effort persisted run history. A failure to
start, complete, or record history is logged but does not prevent source
ingestion from running. `cron_run_history` records a running/success/failed
attempt, reporting year/month, start/completion timestamps, duration, bounded
summary, sanitized metadata, and sanitized error message. Migration
`20260813100000` explicitly grants service-role schema usage plus
`SELECT, INSERT, UPDATE`; `SELECT` is needed because run start inserts then
returns the row. Authenticated developer access is read-only through RLS.

Run-history `success` means the handler completed without throwing. In
particular, the Monday sync can return a business-level `rejected` result (for
example, unsafe source data), which is recorded as `success` with `Monday
rejected` in the summary; only thrown handler failures receive `failed` status.
This limits what the current overdue/stale calculation can prove.

Developer Diagnostics displays each job’s latest attempt, latest successful
attempt, status, failure, and stale-data signal. It calculates overdue from the
configured UTC schedule plus a 30-minute grace period. Admin dashboard pages
show stale warnings only for the current UTC period: Monday always applies;
EPCC applies only from its July 2026 authority cutoff. Failed or overdue jobs
are warnings, not evidence of a particular root cause.

## Calculators

Calculator drafts are client-local; reference data comes from Supabase. Active
profiles are `EU_STANDARD`, `EU_US_CLIENTS`, and `UK_TRADE`; EU Trade has no
route/profile and remains deferred pending business rules.

- EU Standard and EU US Clients use the shared EUR engine with garment markup,
  print/embroidery tiers, fees, optional enabled PK markup, profile VAT, and
  their own quote formatter. Print-colour controls are numeric text inputs:
  invalid characters and leading zeroes are normalised, zero clears the value,
  and standard print selections start at one colour (EU max 9). The per-unit
  PK markup field accepts signed decimals, including a negative value, and is
  included only when enabled. Delivery is an optional, separate EU helper;
  its rate/box/optional-markup VAT calculation and copy are excluded from the
  quote and calculator totals.
- UK Trade uses GBP garment prices, a minimum quantity of 50, floor quantity
  tiers, 20% VAT, configured screen/embroidery setup fees, and its own quote
  presentation. Its colour fields are numeric text, normalise leading zeroes,
  default standard selections to one, and cap at 10. Standard-print setup adds
  an underbase screen for non-white garments; `white`/`whites` do not. Neck
  standard uses two setup screens and neck transfer none. Embroidery normalises
  through its configured 7,000–15,000 blocks, with extra 1,000-stitch blocks.

Do not infer prices, rate tables, or additional business rules from this
summary; calculation code and current reference data are authoritative.

## Commercial invoices, reference data, and PK Tax

Commercial Invoice Generator builds an in-memory draft only: it validates
details, sender/receiver, and line items, uses persisted Invoice Company and
Product Type defaults, applies country-of-origin rules, previews the result,
and downloads browser-generated XLSX or PDF. It has no invoice persistence,
history, or server-side export store. `invoice_products` exists in the schema,
but the current generator’s directory query uses Invoice Companies and Product
Types. Invoice Companies are organisation-scoped; write users edit/add them,
while admins control activation/deletion. Garments and Product Types are
persisted reference data with access-controlled management; `garment_type` is
still transitional and Generic Hoodies remains a temporary fallback.

PK Tax is a client-side, calculation-only allocation; it is not persisted. It
normalises non-finite/negative inputs to zero, then exposes fixed allocations
of overall total (EPCC 40%, admin 10%, marketing 5%, operations 5%) and Johan
allocation (40% of Johan PK Tax). Its pool is 40% of PK Tax brought in by
Hardus, Justin, Bux, and Shannon plus 7% of total Snuggle profit. Hardus,
Justin, and Bux receive that pool by normalised weighted performance score:
company profit 40%, Snuggle profit 25%, PK Tax brought in 20%, orders handled
15%. If all scores are zero it returns no allocations and a performance-data
error. Amounts are allocated in cents, with remaining cents given by descending
unrounded amount then stable recipient order.

## MerchBuddy boundary

Pins Hub/Supabase owns the MerchBuddy operational schema: customers/Bands and
contacts, account managers, tours and tour users, products and variants, shows,
inventory counts, indexes/triggers, access helpers, RLS, and grants. The prepared
Band-first foundation described above adds explicit Band access structures and
nullable legacy Organisation metadata, but leaves current Organisation-first
authorization in place until the next cutover. There are no Pins Merch routes or
mobile application source files in this repository. Pins Merch App lives in a
separate Expo/React Native repository and consumes this shared schema.

## Developer support, configuration, and verification

Users can submit feedback; owner/developer users manage feedback and persisted
Snuggle diagnostic issues. Animated backgrounds are opt-in local preference
and respect reduced motion. Database scripts provide backup, guarded restore,
connection testing, and an EPCC CLI importer. Restore is designed for a
disposable/local target and may require `RESTORE_ADMIN_DATABASE_URL` for
`auth.users` work; it must never target production.

`.env.example` is the environment contract. Public values are
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
`SUPABASE_SERVICE_ROLE_KEY`, `MONDAY_API_TOKEN`, Google OAuth values,
`GMAIL_REPORT_ADDRESS`, and `CRON_SECRET` remain server-only. GA4 uses Vercel
OIDC to Google Workload Identity Federation, then impersonates its dedicated
read-only GA4 service account; no long-lived Google service-account key is
used. Production GA4 connectivity is verified. Website Analytics reads live
GA4 data without persistence, while Meta/social integration remains pending.
The developer-only `GET /api/developer/analytics/ga4-connectivity` check reads
the last seven days of `activeUsers`, `sessions`, and `screenPageViews`.

Snuggle remains subject to a known data-quality diagnostic: Monday can return
invalid `FormulaValue` responses. The server warns, excludes invalid values
from attribution, and Developer Diagnostics persists the resulting issue; do
not treat it as resolved without repository and operational confirmation.

Before handing off code changes, Duncan runs the project's verification workflow separately. Codex/AI implementation work must not run routine verification automatically; Codex runs verification commands only when Duncan explicitly requests them. The available commands are:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

There is no `npm test` script. Focused Node tests exist in `src/` and
`scripts/tests/`, but a deterministic documented full-suite command is still
not provided.

## Genuinely outstanding / externally unverified

- Add alerting/escalation and decide retention for cron history and the legacy
  `sales_kpi_profit_email_sources` table. Decide whether a business-level
  rejected Monday sync should become a failed run-history/stale status.
- Verify remote Vercel schedules, `CRON_SECRET`, Gmail OAuth/mailbox access,
  Monday token/board access, service-role grants, applied migrations/RLS/RPCs,
  and real `cron_run_history` writes. Verify production Auth redirect URLs and
  actual invite/recovery delivery as part of that work.
- Confirm persisted KPI coverage before bounding or retiring the historical
  workbook fallback; retain it meanwhile.
- Complete business-approved calculator/invoice parity and export checks,
  generic-hoodie material reconciliation, and remaining garment identity
  review. Keep EU Trade deferred until rules are supplied.
- Add a deterministic full test command; reassess the Webpack workaround,
  hard-coded development origin, and dashboard access ordering separately.
