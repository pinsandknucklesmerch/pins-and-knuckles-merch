# Pins Hub — Canonical Project Context

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
  Website, and Social Media views (Google Analytics 4 and Meta integrations
  remain unconfigured), User Access Management at `/hub/team`,
  `/hub/team/add`, and `/hub/team/[membershipId]`.
- Sales Dashboard: `/hub/sales-dashboard` and
  `/hub/sales-dashboard/tv/settings`.
- Calculators: EU Standard, EU US Clients, and UK Trade under
  `/hub/calculators`.
- Operations: PK Tax, Commercial Invoice Generator, and Data Management for
  Garments, Product Types, and Invoice Companies.
- Developer: `/hub/developer`, `/hub/developer/feedback`, and
  `/hub/developer/diagnostics`.
- Scheduled routes: `GET /api/cron/epcc-profit` and
  `GET /api/cron/monday-sales-sync`.

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

## Sales Dashboard

The dashboard is Supabase-first: rendering reads persisted company/member KPI
rows, effective targets, final-value overrides, TV settings, trends, and years;
it never calls Monday or Gmail during a page request. Views are Overview,
Company Profit, YTD, Snuggle, and Team Members. It supports active-data exports,
including metrics exports and the profit PDF path. TV mode is dashboard query
state; admins manage six persisted slides (enabled state, order, and 10–300
second duration) in the TV settings route.

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

Pins Hub/Supabase contains MerchBuddy Phase 1 foundation only: organisation-
scoped customers and contacts, account managers, tours and tour users, products
and variants, shows, indexes/triggers, access helper functions, RLS policies,
and authenticated grants. The schema includes tour-level roles and MerchBuddy
app access rules. There are no MerchBuddy routes or mobile application source
files in this repository. The actual MerchBuddy Expo/React Native application
lives in a separate repository.

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
`GMAIL_REPORT_ADDRESS`, and `CRON_SECRET` remain server-only.

Snuggle remains subject to a known data-quality diagnostic: Monday can return
invalid `FormulaValue` responses. The server warns, excludes invalid values
from attribution, and Developer Diagnostics persists the resulting issue; do
not treat it as resolved without repository and operational confirmation.

Before handing off code changes run:

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
