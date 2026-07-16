# Pins Hub Rebuild Project Context

## Project Summary
Pins Hub is an internal operations platform for Pins & Knuckles. The rebuild is intended to cover pricing calculators, garment data, PK Tax workflows, commercial invoices, quick reference data, sales/reporting surfaces, and future operational tools.

## Rebuild Strategy
- This repository is a clean rebuild.
- The legacy Pins Hub is reference-only for existing workflows, pricing logic, calculator behaviour, and business rules.
- Migrate features incrementally into the new architecture.
- Preserve validated business logic after verifying it against current business expectations.
- Replace legacy architecture with the new stack in this repo.
- There is no compatibility requirement with Prisma, Neon, or the old database schema.

## Current Tech Stack
- Next.js App Router: `next` 16.2.10.
- React: `react` 19.2.7 and `react-dom` 19.2.7.
- TypeScript: 5.9.3.
- Tailwind CSS: 3.4.19 with `tailwindcss-animate`.
- Supabase Auth through `@supabase/ssr` 0.12.0 and `@supabase/supabase-js` 2.110.1.
- Supabase PostgreSQL foundation migration in `supabase/migrations`.
- Supabase Storage is part of the intended platform but no storage buckets or storage code are present yet.
- Supabase generated database types are not present yet.
- UI/helper libraries: `lucide-react`, `next-themes`, `class-variance-authority`, `clsx`, `tailwind-merge`, Radix checkbox/dropdown/label/slot packages.
- Deployment target is expected to be Vercel/Next.js; `src/app/layout.tsx` uses `VERCEL_URL` for metadata base when available.
- Prisma is not installed and must not be added unless explicitly approved.

## Authentication and Access Control
- `/login` provides Supabase email/password login with `signInWithPassword`.
- `/auth/forgot-password` sends Supabase password reset emails.
- `/auth/update-password` requires an authenticated Supabase session and updates the password; invite mode redirects to `/hub`, recovery mode signs out and redirects to `/login`.
- `/auth/confirm` handles Supabase `code` exchange and `token_hash` verification; it sanitises `next` paths and redirects failures to `/auth/error`.
- Root `proxy.ts` calls `updateSession()` from `src/lib/supabase/proxy.ts`.
- The proxy redirects unauthenticated users away from non-public routes to `/login`.
- Supabase clients:
  - `src/lib/supabase/client.ts` creates browser clients.
  - `src/lib/supabase/server.ts` creates server clients with cookie handling.
  - `src/lib/supabase/proxy.ts` refreshes auth state in the Next proxy.
- Protected `/hub/*` pages use `AppShell`, which calls `getCurrentPinsHubAccess()`.
- Authenticated users require a valid `app_access` row for `app_key = 'pins_hub'` with access level `admin`, `write`, or `read`.
- Organisation roles are `owner`, `admin`, `manager`, `staff`, `viewer`.
- App access levels are `admin`, `write`, `read`.
- No service-role credentials are used in client code.

## Database Foundation
Migration location: `supabase/migrations/20260709120000_foundation_auth_access.sql`.

Current tables:
- `profiles`: one row per Supabase auth user; references `auth.users(id)` with cascade delete.
- `organisations`: shared organisations with unique `slug`.
- `organisation_members`: joins users to organisations with one role per organisation/user.
- `app_access`: grants app-specific access per organisation membership.

Relationships:
- `profiles.id -> auth.users.id`.
- `organisation_members.organisation_id -> organisations.id`.
- `organisation_members.user_id -> profiles.id`.
- `app_access.organisation_member_id -> organisation_members.id`.

Constraints and enums are implemented as text checks:
- `organisation_members.role in ('owner', 'admin', 'manager', 'staff', 'viewer')`.
- `app_access.app_key in ('pins_hub', 'merchbuddy')`.
- `app_access.access_level in ('admin', 'write', 'read')`.
- Unique membership per `(organisation_id, user_id)`.
- Unique app access per `(organisation_member_id, app_key)`.

Indexes:
- `profiles_email_idx`.
- `organisation_members_organisation_id_idx`.
- `organisation_members_user_id_idx`.
- `app_access_organisation_member_id_idx`.
- `app_access_app_key_idx`.

Functions and triggers:
- `set_updated_at()` updates `updated_at` on mutable foundation tables.
- `is_organisation_member(uuid)` supports organisation RLS checks.
- `is_own_organisation_membership(uuid)` supports app access RLS checks.
- `handle_new_user()` provisions or updates `profiles` from new `auth.users` rows.
- Trigger `on_auth_user_created` runs `handle_new_user()` after auth user insert.

RLS and grants:
- RLS is enabled on all foundation tables.
- Authenticated users can read/update their own profile.
- Authenticated users can read organisations they belong to.
- Authenticated users can read their own memberships and memberships in their organisations.
- Authenticated users can read app access for their own memberships.
- `authenticated` is granted execute on the helper RLS functions.

## Current Routes
| Route | Status | Access |
| --- | --- | --- |
| `/` | Implemented redirect to `/hub` or `/login` | Public entry; uses Supabase session |
| `/login` | Implemented | Public |
| `/auth/confirm` | Implemented route handler | Public auth callback |
| `/auth/error` | Implemented | Public |
| `/auth/forgot-password` | Implemented | Public |
| `/auth/update-password` | Implemented | Requires active Supabase session |
| `/hub` | Implemented shell/dashboard placeholder | Protected by auth and `pins_hub` access |
| `/hub/sales-dashboard` | Implemented with fixture data | Protected by auth and `pins_hub` access |
| `/test` | Development/testing-only page | Auth-gated by proxy; does not use `AppShell` access check |

## Current Repository Structure
```text
src/app
  (hub)/hub/page.tsx
  (hub)/hub/sales-dashboard/page.tsx
  auth/confirm/route.ts
  auth/error/page.tsx
  auth/forgot-password/page.tsx
  auth/update-password/page.tsx
  login/page.tsx
  test/page.tsx
  layout.tsx
  page.tsx
src/components
  auth/
  layout/
  ui/
src/features/sales-dashboard
  components/
  data/fixtures.ts
  lib/calculateKpis.ts
  types.ts
src/lib
  access/pinsHubAccess.ts
  supabase/client.ts
  supabase/server.ts
  supabase/proxy.ts
supabase/migrations
docs
  ai-context/PROJECT_CONTEXT.md
  planning/CALCULATOR_MIGRATION_AUDIT.md
```

## Shared UI Foundation
- `AppShell`: protected hub shell; renders `AccessDenied` without valid `pins_hub` access.
- `SidebarNav`: desktop sidebar with current and placeholder module links.
- `PageHeader`: compact page heading with optional description.
- `Panel`: bordered card/panel wrapper.
- `ActionButton`: shared button/link style.
- `EmptyState`: reusable empty state.
- `LoadingState`: reusable loading state.
- `ErrorState`: reusable error state.
- `AccessDenied`: compact denied-access surface with logout action.

## Current Feature Status
- Auth: implemented for login, reset, update, confirmation callback, logout, and proxy session refresh.
- Hub shell: implemented with protected `AppShell`, sidebar, dashboard placeholder, and status panel.
- Sales dashboard: implemented with fixture data, date range filtering, KPI cards, salesperson table, lead source table.
- Calculators: not implemented in rebuild; migration audit exists in `docs/planning/CALCULATOR_MIGRATION_AUDIT.md`.
- Garments: placeholder nav only.
- PK Tax: placeholder nav only.
- Commercial invoices: placeholder nav only.
- Quick reference: placeholder nav only.

## Legacy Reference Rules
- Legacy calculations may be inspected and reproduced when rebuilding features.
- Legacy code should not be copied blindly.
- Business rules must be verified before migration.
- Referrals were removed/deferred and must not be reintroduced unless explicitly requested.
- Legacy Prisma/Neon setup is obsolete for this rebuild.

## UI Rules
- Keep the UI compact, dark, and operational.
- Use utility-first layout and reuse shared components before adding new patterns.
- Do not add marketing-style copy.
- Do not add generic descriptions, helper text, subtitles, or explanatory copy unless explicitly requested.
- Prefer labels, headings, actions, values, statuses, validation, warnings, and errors.
- Preserve stable layouts and avoid unnecessary reflow.

## Development Workflow
- Work on feature branches; current branch during this snapshot is `feature/hub-updates`.
- Recent commits include auth shell/password reset, auth/local development fixes, sales dashboard planning, and fixture-backed sales KPI dashboard.
- Run before handoff when code changes are made:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- Supabase migrations live in `supabase/migrations`; create migrations only when requested and after schema design is agreed.
- Supabase generated types are not configured yet; when added, generate them from the active Supabase schema and commit generated type files, not secrets.
- Do not commit `.env.local`.
- Do not commit secrets, tokens, service-role keys, database URLs, passwords, or private keys.
- Do not work directly against the legacy repo for rebuild implementation.

## Known Issues and Current Cautions
- LAN development requires `allowedDevOrigins`; current `next.config.ts` allows `192.168.3.34`.
- Auth access depends on both PostgreSQL grants and RLS policies.
- `/test` is development/testing only and should not become a production navigation surface.
- Access checks must never be bypassed for `/hub/*`.
- Password values must never appear in URLs, logs, docs, or error telemetry.
- `README.md` still contains starter-kit text and is not an authoritative project context source.
- `docs/planning/CALCULATOR_MIGRATION_AUDIT.md` is currently untracked unless added later.

## Next Recommended Work
1. Replace sales dashboard fixtures with server-side data mapping when source IDs and column IDs are confirmed.
2. Add Supabase generated database types and wire typed database access.
3. Design calculator Supabase pricing/config tables from the migration audit before creating migrations.
4. Build the EU Standard calculator first, then EU US Clients, UK Trade, and EU Trade after missing rules are confirmed.
5. Replace placeholder nav targets with real routes as modules are implemented.

## Verification Checklist
```bash
npm run lint
npx tsc --noEmit
npm run build
git status --short
```
