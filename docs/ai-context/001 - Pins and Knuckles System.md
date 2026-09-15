# Pins and Knuckles System

## Project overview

Pins Hub is Pins & Knuckles' internal, multi-organisation operations application. It supports staff and management with sales reporting, calculators, commercial invoice generation, reference-data maintenance, user access administration, feedback, and developer diagnostics.

The repository is also the authoritative Supabase migration owner for shared MerchBuddy data. It does not contain the separate MerchBuddy application/mobile UI.

## Technology stack

| Area | Current implementation |
| --- | --- |
| Framework | Next.js App Router, React 19, Node tooling; development uses Webpack. |
| Language/UI | TypeScript, Tailwind CSS, Radix Select/Dropdown Menu, Lucide, Sonner, MetricUI, shared UI components. |
| Database/backend | Supabase/Postgres; forward-only migrations under supabase/migrations; generated snapshot at src/types/database.types.ts. |
| Auth | Supabase Auth with SSR cookie clients, browser client, server client, and server-only service-role client. |
| Deployment | Vercel-oriented deployment and scheduled routes; Vercel OIDC is used by GA4. |
| Export support | ExcelJS, jsPDF, html2canvas, jspdf-autotable. |
| External systems | Monday GraphQL, Gmail API, Google OAuth, GA4 Data API, Google Workload Identity Federation. |

next.config.ts enables cacheComponents, hides development indicators, and allows the 192.168.3.34 development origin.

## Repository architecture

| Area | Responsibility |
| --- | --- |
| src/app | Thin App Router pages, layouts, and API routes; auth and Hub route groups. |
| src/features | Feature-local domain logic, loaders, server integrations, actions, components, and tests. |
| src/components | Shared UI, layout/navigation, auth controls, and background components. |
| src/lib | Shared Supabase clients, access resolution, constants, and utilities. |
| src/config/hubNavigation.ts | Canonical Hub navigation configuration. |
| supabase/migrations | Authoritative schema, RLS, RPC, grant, seed, and migration history. |
| scripts | Operational imports, audits, maintenance, and historical tooling; not normal request-path code. |
| docs | Current AI context, operations, references, imports, audits, and archive material. |

Pages compose feature loaders/components. Business rules, calculations, validation, mappings, and external API clients belong in feature/domain/data/server modules rather than page or presentational components.

The Hub layout resolves access and records throttled user activity. AppShell provides the dark operational shell and renders AccessDenied when no valid Pins Hub grant exists. proxy.ts refreshes Supabase sessions and redirects unauthenticated requests; RLS remains the database security boundary.

## Authentication, organisations, and permissions

- Supabase Auth owns users. The handle_new_user trigger creates/updates profiles.
- organisations owns organisations; organisation_members links profiles to organisations.
- Membership roles are owner, admin, manager, staff, and viewer. Membership also has is_active and optional globally unique monday_member_id.
- app_access is distinct from organisation role. Pins Hub levels are read, write, admin, and developer.
- Current access resolution requires an authenticated profile, an active membership, and a Pins Hub app_access row. Owners have effective Hub admin capability; stored developer access or owner role can access the Developer area.
- RLS helpers include has_pins_hub_access, has_pins_hub_access_for_organisation, and developer equivalents. They enforce the access hierarchy in Postgres.
- Server-only team provisioning upserts profile, membership, and app access through the Supabase Admin API. The last active owner must not be safely deactivated/demoted.
- Current auth routes cover login, confirmation, error, forgotten password, invite, recovery confirmation/verification, and password update. Recovery is an explicit confirmation flow, not implicit client token handling.

## Database architecture

The migration directory is authoritative. The generated database type file may lag deployed state. Static repository review cannot prove remote migration, RLS, RPC, grant, or data state.

| Domain | Main data |
| --- | --- |
| Identity/access | profiles, organisations, organisation_members, app_access. |
| Calculator/reference | garments, product_types, calculator profiles/pricing sets/profile mappings/markups, EU/UK print and embroidery data, calculator_fees, delivery_rates. |
| Sales/reporting | sales_kpi_months, sales_kpi_member_months, sales_kpi_targets, sales_kpi_month_final_values, sales_dashboard_tv_settings, Monday lock rows, EPCC ingestion/audit rows, cron_run_history. |
| Commercial invoices | invoice_companies, invoice_products, and Product Type defaults. Invoice drafts are not persisted. |
| Support/developer | hub_feedback_reports and developer_diagnostic_issues. |
| Shared MerchBuddy foundation | customer, contact, manager, tour, tour-user, product, variant, show, and show-inventory tables. |

Significant functions include the Pins Hub/MerchBuddy access predicates, ingest_epcc_monthly_profit_and_members, Monday lock acquire/release RPCs, TV-settings RPCs, and feedback/diagnostics workflow RPCs. The older ingest_epcc_monthly_profit overload is retired, not active ingestion behavior.

### Ownership and precedence

- From July 2026, Monday owns Quotes Done, Orders Processed, sales-inbox/conversion values, and related member/provenance fields.
- EPCC/NetSuite owns company Profit and member Profit/PK Tax from July 2026.
- Final KPI values are display overrides and do not overwrite source-owned snapshots.
- Organisation-scoped rows take precedence over global rows where supported by the active loader.
- The historical workbook fixture is retained Sales Dashboard fallback technical debt, not a live source.

## Major systems

### Sales Dashboard and Reporting

Routes: /hub/sales-dashboard, /hub/sales-dashboard/tv/settings, /hub/reporting, /hub/reporting/epcc, /hub/reporting/metrics.

The dashboard reads persisted snapshots; page rendering does not call Monday or Gmail. Sales Dashboard repository loaders and domain modules such as calculateDashboardKpis, calculateYearToDate, and comparison helpers own KPI computations. Views are Overview, Company Profit, YTD, Snuggle, and Team Members. Query state selects reporting period, view, and TV mode.

Admins manage independent monthly final display values and organisation-scoped TV settings. TV settings cover Overview, YTD, Year Comparison, Snuggle, Live Zoo Cam, and Team Members with enabled state, ordering, and 10 to 300 second durations.

Reporting is the canonical export workspace. The EPCC report page uses ProfitPdfReport and the organisation-scoped epcc_report_templates configuration. The fixed two-page landscape A4 export is presentation-only; report templates do not own formulas. The metrics page reuses the same KPI pipeline.

Snuggle reads a configured Monday board server-side for its profit presentation. Its invalid/multi-assignee/unmapped/unassigned data quality signals become developer diagnostic issues; this is separate from monthly KPI ownership.

### Calculators

Routes: /hub/calculators, /hub/calculators/eu/standard, /hub/calculators/eu/us-clients, /hub/calculators/uk/trade, /hub/calculators/uk/standard.

Implemented profile codes are EU_STANDARD, EU_US_CLIENTS, and UK_TRADE. Calculator reference data comes from Supabase, but drafts/calculations are local and not persisted. The two EU calculators share the EUR engine, profile-specific garment markups, decoration configuration, optional PK markup, VAT, and separate delivery helper. UK Trade has GBP pricing, a 50-unit minimum, its own print/embroidery tier/setup rules, and 20 percent VAT.

EU_TRADE is not implemented. garment_type is transitional data; Product Types and pricing_category are the current direction. Generic Hoodies is an intentional temporary fallback.

### Commercial invoices and data management

Routes: /hub/commercial-invoices, /hub/data, /hub/data/garments, /hub/data/product-types, /hub/data/invoice-companies.

Commercial Invoice Generator validates parties/line items, applies Product Type/customs/origin defaults, previews an in-memory draft, and exports XLSX/PDF in the browser. It does not persist invoice records/history. Invoice companies are organisation-scoped. The generator uses directory selection and Product Type defaults; invoice_products being in the schema does not make it the primary active generator source.

### Other implemented workspaces

- /hub/pk-tax: local calculation/allocation and export; no persistence.
- /hub/profile: account/profile editing, background preference, member performance, password reset action.
- /hub/team, /hub/team/add, /hub/team/[membershipId]: developer/owner user administration, invitation, activation, role/access level, and Monday identity management.
- /hub/developer/feedback and /hub/developer/diagnostics: support workflow, diagnostic issues, and cron health.
- /hub/analytics: authenticated GA4 website reporting for 7, 30, and 90-day periods.

## External integrations

| Integration | Current data flow |
| --- | --- |
| Monday | MondayClient calls GraphQL. The scheduled sync discovers/validates boards, paginates items, builds safe KPI snapshots, and persists Hub KPI rows. Operational audit/import scripts are isolated from production Sales Dashboard sync behavior. |
| Gmail/Google OAuth | gmailProfitClient exchanges a refresh token for access, searches EPCC report emails, retrieves raw messages, and sends them to the EPCC parser/importer. Retryable 429/5xx Gmail responses retry up to three times with bounded backoff. |
| GA4/Google Cloud | Analytics server module uses Vercel OIDC with Google Workload Identity Federation and analytics.readonly. It has no local long-lived service-account-key fallback. It retrieves live metrics, trends, geography, acquisition, pages, and investigation data. |
| Supabase | Auth/session cookies, RLS queries, RPCs, service-role cron/provisioning, and persistence. |
| Vercel | Hosting assumptions, cron execution, and deployment identity for GA4. |

Analytics API routes are /api/analytics/traffic-investigation for authenticated range investigations and /api/developer/analytics/ga4-connectivity for developers.

## Scheduled processing

vercel.json declares two UTC routes:

| Job | Schedule | Behavior |
| --- | --- | --- |
| /api/cron/epcc-profit | 5 8 * * * | Requires a timing-safe CRON_SECRET bearer match; reads/parses Gmail EPCC reports, reconciles member totals, then applies the EPCC RPC. |
| /api/cron/monday-sales-sync | 15 8 * * * | Requires the same bearer check; syncs current UTC month only for the canonical Pins & Knuckles organisation, after board validation and a per-organisation/year/month database lock. |

Both use best-effort cron-run lifecycle recording. cron_run_history records status, period, duration, sanitized metadata/summary/errors. History-recording failure is logged but does not itself block ingestion. A completed cron handler can have a business-level Monday rejected outcome without being an execution failure.

Developer Diagnostics derives overdue state from the configured UTC schedule plus a 30-minute grace period. Repository code cannot prove remote Vercel schedule execution.

## Important business logic

- Reuse feature domain logic; do not recreate calculator, KPI, invoice, mapping, or validation calculations in a UI/page.
- Preserve the Monday/EPCC ownership split. EPCC writes deliberately exclude Monday-owned member fields.
- Monday sync is current-month-only, lock-protected, validates board input before write, and records provenance. Unsafe input should be rejected rather than partially stored.
- EPCC reconciles member Profit/PK Tax against report totals at a 0.01 currency tolerance before member application.
- Dashboard final values are display-only overrides.
- EU delivery is intentionally excluded from EU calculator production, customer, VAT, profit, and quote totals.
- Commercial invoice generation is intentionally in-memory; persistence/history is a material product change.

## UI and navigation

AppShell supplies the responsive dark Hub shell, sidebar, background, and access-denied treatment. TV mode hides the sidebar and uses full-screen content.

Navigation defined in src/config/hubNavigation.ts includes Sales Dashboard; Reporting; Analytics; Calculators; PK Tax; Commercial Invoices; Data Management; Profile; and access-gated Developer pages. Shared controls include ActionButton, ActionMenu, Dialog, Panel, Surface, FormField, Select, SearchableCombobox, loading/error/empty states, and toast support. Reuse these components for equivalent UI behavior.

## Development conventions

- Use the existing Next.js App Router, TypeScript, Tailwind, Supabase SSR-cookie, RLS, and feature-based structure. Do not introduce Prisma, Neon, or legacy Hub patterns.
- Keep routes thin and feature work under src/features. Keep sensitive/external client logic server-only.
- Use explicit types and validate at request, integration, and form boundaries.
- Preserve unrelated dirty worktree changes.
- Schema changes are forward-only timestamped migrations; do not edit applied migrations.
- Use public/reference-assets for supplied visual implementation references.
- Read AGENTS.md, PROJECT_CONTEXT.md, ENGINEERING_STANDARDS.md, relevant UI standards, and component catalog before implementation.

## Deployment and environment categories

The project is Vercel-oriented and has local Supabase CLI linkage metadata. Source proves configuration contracts, not deployed configuration, live credentials, remote policy parity, or external account access.

| Category | Configuration purpose |
| --- | --- |
| Public Supabase | project URL and publishable key. |
| Server-only Supabase | service-role key for privileged provisioning and cron work. |
| Maintenance | direct/restore database URLs for local or disposable maintenance; never production restore targets. |
| Monday | API token, optional sales board IDs, Snuggle board ID. |
| Gmail EPCC | OAuth client ID/secret, refresh token, report mailbox. |
| GA4 federation | GA4 property, Google Cloud project/workload identity pool/provider, service-account email. |
| Cron | CRON_SECRET bearer value. |

Never commit or expose actual secret values.

## Incomplete or intentionally pending areas

- EU Trade has no active profile/route.
- MerchBuddy application/mobile code is separate; this repository has only its shared data foundation.
- Sales Dashboard workbook fallback remains intentional technical debt.
- sales_kpi_profit_email_sources is retained legacy schema, not the active EPCC path.
- Current operations documentation identifies remote cron confirmation, run-history retention, and alerting/escalation for failed/overdue jobs as outstanding operational work.
- Hub request diagnostics in proxy.ts and the Hub home page are explicitly temporary instrumentation.

## Technical guardrails

- Current source/migrations outrank generated types, plans, audit summaries, and historical documents.
- A table's existence does not prove a current UI workflow; inspect the active feature loader and source.
- Browser UI is not an authorisation boundary; RLS/functions/RPCs/server-only code enforce access.
- Preserve active membership plus app_access semantics; organisation role and Hub access level are intentionally separate.
- Do not add live Monday/Gmail calls to dashboard page rendering.
- Keep credentials and Monday write capability out of browser code. Keep one-off scripts isolated from scheduled sync semantics.
- Do not claim remote deployment, external credentials, migration/RLS state, or production data is proven by local source.

## Repository-specific workflow

Routine lint, typecheck, test, and build commands are handled separately by the developer. Do not run them automatically during implementation or documentation work unless explicitly requested.
