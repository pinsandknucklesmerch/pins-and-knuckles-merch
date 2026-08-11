# Pins Hub — Canonical Project Context

Reviewed against the current working tree and remote Supabase schema on
2026-08-11. This
is the canonical repository context. Source code, migrations, `package-lock.json`,
and configuration are authoritative for implementation. Static review cannot
verify remote Supabase state, Vercel deployment state, scheduled execution, or
the presence/value of environment variables.

## Purpose and boundaries

Pins Hub is the internal Pins & Knuckles operations application for garment
pricing, commercial invoices, PK Tax allocation, operational reference data,
Sales Dashboard reporting, and team administration.

- The current stack is Next.js App Router, TypeScript, Tailwind CSS, and
  Supabase Auth/Database/RLS/SSR cookies/migrations.
- The legacy Hub is reference-only for confirmed business rules. Do not revive
  its architecture or implementation patterns.
- Prisma, Neon, referrals, and any legacy database architecture are obsolete
  and excluded from this rebuild.
- The current scope is Pins Hub access in the shared organisation model; it
  must not be casually generalized into a multi-organisation cron design.

## Review status

### Implemented and repository-verified

- The App Router application, Supabase SSR/client/service-role separation,
  Pins Hub access checks, feature modules, database types, and 33 forward-only
  migrations are in the repository. Generated database types were regenerated
  from the current remote public schema on 2026-08-11.
- The active calculators are EU Standard, EU US Clients, and UK Trade.
- Sales Dashboard persistence, source-isolated Monday/EPCC ingestion,
  month-final values, TV mode/settings, member performance, and dashboard
  exports are implemented.
- Commercial Invoice directory selection, editable invoice generation, XLSX
  and PDF export, garment/product-type management, profile management,
  User Access Management, feedback, and diagnostics are implemented.
- Current user activity is recorded at most once per 15 minutes on Hub-layout
  requests when the authenticated profile is eligible for update.
- Cron observability is implemented for EPCC and Monday scheduled jobs. Each
  run is persisted in `cron_run_history` (migration applied remotely);
  Developer Diagnostics shows latest
  status, reporting month, duration, errors, and overdue state. Overdue state
  is read-time logic using the 08:05/08:15 UTC schedules plus a 30-minute
  grace period.

### Implemented but not production-verified by this review

- Vercel cron execution, Gmail OAuth access, Monday API access, service-role
  privileges, and production run frequency remain operational verification
  concerns. The current remote schema and generated type alignment are now
  confirmed for this audit.
- The cron routes and CLI tooling exist and are tested in source, but static
  review cannot confirm their configuration, calls, writes, or schedule runs.

### Planned or outstanding

- Add external/operator alerting for failed EPCC and Monday scheduled runs;
  durable run/outcome retention is implemented.
- `sales_kpi_profit_email_sources` remains intentionally retained with its
  historical July 2026 row. The obsolete RPC overload that wrote to it has
  been retired remotely, no current application code depends on the table, and
  eventual table cleanup is a separate retention decision.
- Decide whether and when to remove/bound the historical Sales Dashboard
  fixture fallback as persistent KPI coverage is confirmed.
- Review the deferred July Monday source delta before any bounded historical
  apply. Do not automatically overwrite source-owned values.
- Complete real-world calculator and commercial-invoice parity/export checks
  before changing business pricing or reference data.
- Material-specific mapping for generic hoodies and the remaining non-hoodie
  garment identity conflicts require human review. EU Trade remains deferred.
- The package manifest has no `test` script. Add a deterministic, documented
  full-suite command before treating `npm test` as repository verification.

### Historical or obsolete

- Earlier dashboard plans describing live Monday page rendering, lead-source
  tables, date-range filter components, and proposed file names are historical;
  the active dashboard is Supabase-first.
- Earlier EPCC cron schedules (including `0 10 * * *`) are obsolete. The
  checked-in Vercel schedule is listed below.
- Any claim that `npm test` exists or that all tests run through it is stale.
- The old seven unreachable UI modules and three unused direct Radix packages
  identified in the 2026-08-05 audit have already been removed; stale planning
  references to them are not current architecture.

## Runtime, configuration, and verification

- npm is the package manager and `package-lock.json` is committed.
- `npm run dev` runs `next dev --webpack`. Webpack remains intentional because
  Turbopack HMR previously produced reload/request loops.
- `next.config.ts` enables `cacheComponents`, allows development origin
  `192.168.3.34`, and hides dev indicators. Retain the origin unless its LAN
  need is separately confirmed obsolete.
- Vercel defines two daily UTC crons:
  - `GET /api/cron/epcc-profit` — `5 8 * * *` (08:05 UTC)
  - `GET /api/cron/monday-sales-sync` — `15 8 * * *` (08:15 UTC)
- Active direct dependencies include Next, React, Supabase SSR/client,
  Tailwind, Radix dropdown/select, MetricUI, GSAP/OGL, ExcelJS, html2canvas,
  jsPDF/jsPDF-AutoTable, Sonner, Lucide, and shared class/style helpers.

`.env.example` is the variable-name checklist. Never put tokens or the
service-role key in `NEXT_PUBLIC_` variables or client code.

| Purpose | Variable names | Scope |
| --- | --- | --- |
| Supabase browser/SSR connection | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public configuration |
| Privileged server writes | `SUPABASE_SERVICE_ROLE_KEY` | server only |
| Monday audit/sync | `MONDAY_API_TOKEN`, optional `MONDAY_SALES_BOARD_ID`, `MONDAY_QUOTES_BOARD_ID`, `MONDAY_ORDERS_BOARD_ID`, `MONDAY_SNUGGLE_BOARD_ID` | server only |
| EPCC Gmail ingestion | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GMAIL_REPORT_ADDRESS` | server only |
| Cron authentication | `CRON_SECRET` | server only |
| Invitation origin | optional `NEXT_PUBLIC_SITE_URL`; production fallback uses `VERCEL_PROJECT_PRODUCTION_URL` | public URL only |

For code changes, project rules require `npm run lint`, `npx tsc --noEmit`, and
`npm run build`. `git diff --check` is also appropriate. Do not run `supabase
db push`, alter an applied migration, commit, or expose secrets without explicit
authorization.

## Routes

All `/hub/*` pages rely on the Hub shell and Pins Hub access. App Router
loading/error files also exist for relevant data and dashboard routes.

| Route | Current behavior |
| --- | --- |
| `/` | Public branded entry; server checks auth and links authenticated users to Hub. Google/Microsoft controls are disabled placeholders. |
| `/login` | Email/password sign-in. |
| `/auth/forgot-password`, `/auth/update-password`, `/auth/error` | Password recovery/update and auth error pages. |
| `/auth/confirm` | Auth confirmation route handler. |
| `/auth/invite` | Invite acceptance/implicit callback flow. |
| `/hub` | Protected Hub home. |
| `/hub/sales-dashboard` | Supabase-first dashboard; accepts `year`, `month`, `dashboardView`, `tv`, and `duration` query state. |
| `/hub/sales-dashboard/tv/settings` | Admin-only TV-slide settings. TV itself is dashboard query mode, not a separate `/tv` page. |
| `/hub/calculators`, `/hub/calculators/eu`, `/hub/calculators/eu/standard`, `/hub/calculators/eu/us-clients`, `/hub/calculators/uk/trade` | Calculator navigation and active calculator routes. |
| `/hub/pk-tax` | Calculation-only PK Tax allocation tool. |
| `/hub/commercial-invoices` | Commercial Invoice Generator. |
| `/hub/data`, `/hub/data/garments`, `/hub/data/product-types`, `/hub/data/invoice-companies` | Data Management and directory managers. |
| `/hub/profile` | Own profile, performance, and password reset. |
| `/hub/team`, `/hub/team/add`, `/hub/team/[membershipId]` | User Access Management, privileged add user, and admin view of a member profile. |
| `/hub/developer`, `/hub/developer/feedback`, `/hub/developer/diagnostics` | Owner/developer-only operational feedback and Snuggle diagnostic surfaces. |
| `/api/cron/epcc-profit`, `/api/cron/monday-sales-sync` | Server-only scheduled ingestion endpoints. |

## Auth, access, and User Access Management

### Architecture

- `proxy.ts` delegates session refresh and protected/public redirect handling to
  `src/lib/supabase/proxy.ts`.
- Server components use the SSR-cookie client. Browser code uses the
  publishable client. `src/lib/supabase/admin.ts` is `server-only` and creates
  the privileged client only from `SUPABASE_SERVICE_ROLE_KEY`.
- `getCurrentPinsHubAccess()` resolves the authenticated profile, an active
  organisation membership, and its `pins_hub` app-access row through RLS-backed
  reads. `AppShell` renders access denial when that access is absent.

### Roles and levels

- Organisation roles: `owner`, `admin`, `manager`, `staff`, `viewer`.
- Pins Hub app levels, in ascending hierarchy: `read`, `write`, `admin`,
  `developer`. Developer satisfies read/write/admin checks.
- Owner is treated as admin for Hub management and can use the Developer area.
  Developer-level access can also use that area. This does not alter the stored
  organisation role.
- `/hub/team` is available to a Hub admin, developer, or organisation owner.
  Only an owner or developer can open Add User and manage owner/developer
  assignments.
- User edits update profile full name, Supabase Auth display-name metadata,
  organisation role, active state, optional unique Monday member ID, and Pins
  Hub access level. The last active owner cannot be deactivated or demoted.
- Invitations are created through Supabase Auth’s admin API; existing users
  are provisioned/updated instead of being duplicated. Invite/resend requires a
  configured safe site URL. Monday IDs must be known canonical identities and
  unique per organisation.
- Membership history is retained through `is_active`; deactivation does not
  delete the membership. `last_active_at` is throttled to 15 minutes and no
  historical activity is backfilled.

## Supabase schema and migrations

The repository has 33 migrations, from `20260709120000` through
`20260811110000`. They are forward-only history; do not edit or remove applied
migrations. `src/types/database.types.ts` is regenerated from the current
remote public schema and includes the intentionally retained legacy table.

### Foundation and calculator data

- Foundation creates `profiles`, `organisations`, `organisation_members`, and
  `app_access`, enables RLS, adds read/update policies, and creates the auth
  profile trigger.
- The canonical organisation is selected by `organisations.slug =
  'pins-knuckles'` where migrations need it; new migrations should not hardcode
  its UUID.
- Calculator schema/seed migrations define global (`organisation_id IS NULL`)
  reference data: garments, profiles, profile mappings/pricing sets, garment
  markups, EU tiers/embroidery, UK Trade tiers/embroidery, calculator fees,
  delivery rates, product types, and staged garment/product-type relationships.
- Active seeded calculator profiles are `EU_STANDARD`, `EU_US_CLIENTS`, and
  `UK_TRADE`; EU Trade has no active profile.
- `garment_type` remains a transitional pricing field. Product Types provide
  the eventual category direction, including `OTHER`; do not assume that this
  migration is complete or remove the transitional field.
- The 2026-08-05 forward migration applies the authoritative global garment
  catalogue pricing data, preserves product/type/active metadata on matched
  rows, inserts resolvable records, and deactivates three specified legacy
  records. It intentionally validates ambiguity before changes.

### Sales Dashboard and integration data

- `sales_kpi_months`, `sales_kpi_member_months`, and `sales_kpi_targets` are
  organisation-scoped KPI persistence with RLS and global fallback support.
- Subsequent migrations add Monday snapshot provenance, monthly profit source,
  EPCC audit/ingestion RPCs, a per-organisation/month Monday lock,
  source-isolated member fields, and admin-managed `sales_kpi_month_final_values`.
- Final values are independent overrides for Profit, PK Tax, Quotes Done, and
  Orders Processed. They carry editor/timestamp metadata and must not overwrite
  source-calculated fields.
- TV settings are organisation-scoped in `sales_dashboard_tv_settings`, with
  transactional save/reset RPCs. Registered slides are Overview, YTD, Year
  Comparison, Snuggle, and Team Members; durations are 10–300 seconds and
  repository/server validation requires at least one enabled slide.
- Invoice-directory migrations add organisation-scoped invoice companies and
  products plus lifecycle/RLS support; Product Types gain invoice defaults
  (origin, description, non-negative default cost, and GBP/EUR default
  currency).
- `hub_feedback_reports` is organisation-scoped with authenticated submission
  RPC and owner/developer read/update workflow. `developer_diagnostic_issues`
  stores organisation-scoped Snuggle diagnostics with status/notes and
  detection timestamps.

### Remote-state caveat

The remote schema currently retains `sales_kpi_profit_email_sources` and its
single historical July 2026 row for audit/retention purposes. The obsolete RPC
overload that wrote to it has been retired, no current application code queries
the table, and the generated types intentionally retain its table definition.
Current EPCC writes use `sales_kpi_profit_email_ingestions`,
`sales_kpi_member_months.epcc_source_metadata`, and the newer ingestion RPCs.
The current public-schema type snapshot was regenerated from remote Supabase
on 2026-08-11.

## Sales Dashboard

- The page loads persisted KPI, member, target, final-value, trend, and
  available-year data through `salesDashboardRepository.ts`; it does not call
  Monday during page rendering.
- Repository selection prefers Pins-organisation rows and falls back to global
  rows by key. If persistent queries fail or a historical period is missing,
  `workbookFixture.ts` supplies historical fallback data and the UI receives a
  setup issue. This is intentional but should be retired/bounded only after
  coverage is confirmed.
- Views include overview, YTD, year comparison, Snuggle, and team members.
  Dashboard query TV mode rotates configured slides; admins manage settings on
  the separate settings route.
- Admin actions save targets and final values. Final-value input accepts
  formatted monetary text but validates server-side before upsert/delete.
- Member metrics are persisted separately, use canonical Monday identities and
  classifications, and are also reused by profile performance views.
- Dashboard exports use current MetricUI/feature components; an older
  standalone EPCC PDF helper is obsolete and removed.

### Source ownership and cron behavior

- Monday is the source for Quotes Done and Orders Processed (and current source
  metadata/member snapshots). From July 2026 it deliberately excludes
  EPCC-owned monthly profit fields from write payloads.
- EPCC/NetSuite Gmail ingestion parses the report email, reconciles member
  totals, and writes through a service-role-only RPC. From July 2026 it is the
  authoritative monthly-profit source; it does not overwrite Monday-owned
  quote/order fields.
- Current EPCC persistence uses `sales_kpi_profit_email_ingestions`,
  `sales_kpi_member_months.epcc_source_metadata`, and
  `sales_kpi_months.monthly_profit_source`; the active RPCs are
  `ingest_epcc_monthly_profit` and `ingest_epcc_monthly_profit_and_members`.
- The EPCC CLI is dry-run unless `--apply` is supplied. The scheduled EPCC route
  requires `Authorization: Bearer <CRON_SECRET>`, then invokes apply mode.
- The Monday scheduled route is server-only, uses the same cron authentication
  envelope, operates only on the current UTC reporting month, and uses a
  database lock keyed by canonical organisation/year/month. The current code
  contains a deliberate single-organisation UUID constant for this workflow.
- Cron routes fail independently. No application route exposes Monday or Gmail
  credentials to the browser.

## Calculators

Calculator data loading/mapping is in `src/features/calculators/data`; pricing,
validation, interactions, breakdowns, and quote formatters are pure domain/lib
code; UI components retain client-local draft state only.

### EU Standard and EU US Clients

- Uses database profiles/reference data, EUR garments, profile-specific
  markups, print/embroidery tiers, fees, VAT, and optional per-item delivery
  helper. Calculator state is not persisted in browser storage or Supabase.
- Production cost excludes garment and PK markups; customer price includes
  applicable garment markup, opted-in PK markup, customer decoration fees, and
  VAT. Delivery remains separately calculated/copyable and is excluded from
  production, Pins price, VAT, profit, and quote totals.
- Print positions are selectable Front/Back/Left Sleeve/Right Sleeve/Neck;
  decoration controls are shown only for selected positions. Print colour input
  is capped at 9. Missing-garment feedback is action-gated rather than shown on
  initial empty focus.
- Results offer copyable Pins-price output and aligned detailed
  Production/Pins breakdown rows. Presentation changes do not change the
  source-driven price formulas.

### UK Trade

- Requires a selected GBP-priced garment, quantity of at least 50, and at
  least one print or embroidery item; VAT is 20%.
- Print floor tiers are 50, 100, 200, 500, 1,000, 2,500, 5,000, and 10,000.
  Non-white standard prints add an underbase screen. Standard print screen
  setup follows colour count; neck-standard uses two setup screens; neck
  transfer uses none.
- Embroidery uses floor quantity tiers through 2,500; stitches normalize to
  7,000–15,000 tiers and add per-1,000 blocks over 15,000. Setups are read from
  reference fees per applicable decoration.
- The result includes a detailed cost breakdown and copy formatter. It remains
  client-local and does not persist quotes.

EU Trade is intentionally deferred; do not add an active profile or route until
pricing rules are confirmed.

## Commercial invoices and data management

- Commercial Invoice Generator creates a fresh in-memory invoice, validates
  reference/print location/duties/sender/receiver/line items, and calculates
  cost × whole-number quantity, total quantity, subtotal, and grand total.
  It has no freight, tax, other-charge, persistence, history, or browser-storage
  calculation layer.
- It exports editable XLSX and landscape A4 PDF with filenames derived from the
  reference/date. Product Type and Invoice Company directories supply defaults
  and selection data; they do not make the invoice itself persistent.
- Data Management has Garments, Product Types, and Invoice Companies. Mutations
  are server actions with access checks/RLS; read/write/admin distinctions are
  enforced by the relevant actions/policies. Garment validation requires an
  active Product Type and at least EUR or GBP price when active.
- Generic `Hoodies` is the temporary active fallback for 16 reviewed hoodie
  records. It maps to `HOODIE` and must be replaced by cotton or poly/cotton
  types only with reliable material evidence. Remaining identity conflicts are
  documented in `docs/imports/garments/GARMENT_IMPORT_REVIEW.md`.

## PK Tax

- PK Tax is calculation-only: no database, API, saved report, browser storage,
  or history.
- Fixed allocations are EPCC 40%, Admin 10%, Marketing 5%, Ops 5% of the
  overall total, and Johan 40% of Johan PK Tax.
- The pool is 40% of PK Tax brought by Hardus/Justin/Bux/Shannon plus 7% of
  Snuggle profit. Only Hardus, Justin, and Bux receive it; Shannon contributes
  but does not receive; Seth is excluded.
- Weights are company profit 40%, Snuggle profit 25%, PK Tax 20%, and orders
  handled 15%. All-zero weighted inputs are withheld with validation rather
  than equal-split. Display rounding assigns any cent remainder to the highest
  unrounded allocation (Hardus, Justin, Bux tie order).

## UI and architecture rules

- Keep screens compact, dark, and operational. Do not add marketing copy,
  heroes, decorative badges, helper paragraphs, or subtitles without request.
- Keep pages thin. Put data access, mappings, calculations, integrations, and
  KPI logic in feature/lib/domain modules, not route files or presentational UI.
- Prefer server components for initial data; reserve client components for
  forms, calculators, TV, clipboard, export, and other interaction.
- Reuse shared UI/layout/state components. All data surfaces should support
  loading, empty, and error states.
- Shared Sonner feedback is used for operations, exports, and clipboard actions;
  validation remains inline where appropriate.

## Recent Git history (current HEAD)

Recent commits confirm the direction of the current codebase:

- `9b25180` — owner/developer User Access Management behavior.
- `1125f68` — developer feedback/diagnostics and developer navigation.
- `ca30618` — team-member metric presentation updates.
- `4587451` — invitation flow and Auth display-name synchronization.
- `ef47e5e` — throttled profile last-active tracking.
- `daefdf4` — EU/UK calculator input and pricing behavior changes.
- `bada37b` and `028bfca` — profile performance, user editing, and dashboard
  member presentation.
- `2290856`, `7705499`, and related commits — dashboard TV mode/settings and
  visual/dashboard refinements.

## Recommended next work

1. Add operator-facing alerting for failed scheduled ingestion runs.
2. Treat eventual removal of the retained legacy profit-email-source table as
   a separate approved retention/cleanup decision; do not remove it as an
   application defect.
3. Add an actual complete test script and update any remaining documentation
   that claims one already exists.
4. Confirm historical KPI persistence and then intentionally reduce the
   workbook fallback.
5. Complete only approved calculator/invoice parity cases and garment material
   reconciliation; keep EU Trade deferred until business rules are supplied.
