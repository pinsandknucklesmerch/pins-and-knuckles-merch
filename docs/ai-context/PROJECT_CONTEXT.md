# Pins Hub Rebuild Project Context

This is the canonical project context for the Pins Hub rebuild.

## Project Purpose

Pins Hub is the internal operations platform for Pins & Knuckles merchandise workflows. The rebuild is a clean Next.js/Supabase application for pricing calculators, garment data, PK Tax, commercial invoices, reference data, sales reporting, and future operational tools.

The legacy Hub is reference-only. Use it only to confirm business behaviour and copy contracts. Do not reintroduce Prisma, Neon, referrals, legacy database architecture, or old implementation patterns.

## Rebuild Strategy

- Build feature-by-feature in the new architecture.
- Keep route files thin and move data access, mapping, calculations, and business logic into feature modules.
- Preserve validated calculator behaviour only after it has been confirmed against source and planning docs.
- Prefer explicit, typed domain engines over configurable formulas stored in data.
- Keep Supabase Auth, SSR cookie handling, RLS, migrations, and `pins_hub` access checks intact.

## Current Tech Stack

Installed versions from `package-lock.json`:

- `next` 16.2.10
- `react` 19.2.7
- `react-dom` 19.2.7
- `typescript` 5.9.3
- `tailwindcss` 3.4.19
- `@supabase/ssr` 0.12.0
- `@supabase/supabase-js` 2.110.1
- `supabase` CLI 2.109.1 as a dev dependency

Other active UI/helper packages include Radix checkbox/dropdown/label/slot, `lucide-react`, `next-themes`, `class-variance-authority`, `clsx`, `tailwind-merge`, and `tailwindcss-animate`.

## Development Runtime

- `npm run dev` runs `next dev --webpack`.
- Webpack is required for local development because Turbopack HMR caused repeated reload/request loops.
- `next.config.ts` currently enables `cacheComponents: true`.

## Environment Variables

Required local variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not add service-role keys, database URLs, Monday tokens, or other secrets to client code or `NEXT_PUBLIC_` variables.

## Auth And Access

- `/login` uses Supabase email/password auth.
- `/auth/forgot-password`, `/auth/confirm`, `/auth/update-password`, and `/auth/error` are active auth routes.
- `proxy.ts` delegates to `src/lib/supabase/proxy.ts` for Supabase SSR cookie handling and root/protected-route redirects.
- `src/lib/supabase/server.ts` creates typed server Supabase clients using SSR cookies.
- `src/lib/access/pinsHubAccess.ts` loads the current profile, organisation membership, and `pins_hub` app access through RLS-backed Supabase table reads.
- `AppShell` protects hub pages and renders `AccessDenied` when the authenticated user lacks `pins_hub` access.

## Supabase Schema State

Applied migrations:

- `20260709120000_foundation_auth_access.sql`
  - Organisations, profiles, organisation members, app access.
  - RLS helpers and access policies.
  - Auth profile trigger.
- `20260715120000_calculator_schema.sql`
  - Garments.
  - Calculator profiles.
  - Calculator garment markups.
  - Calculator pricing sets and profile-to-pricing-set mappings.
  - EU print tiers and embroidery pricing.
  - UK Trade print and embroidery tables.
  - Calculator fees.
  - Delivery rates.
  - RLS policies for calculator reference data.
- `20260715130000_calculator_seed.sql`
  - Global calculator seed data with `organisation_id = null`.
  - Active profiles for `EU_STANDARD`, `EU_US_CLIENTS`, and `UK_TRADE`.
  - No active EU Trade profile.

Generated database types are present at `src/types/database.types.ts`.

## Current Routes

| Route | Status |
| --- | --- |
| `/` | Implemented branded landing page; shows sign-in options when signed out and an `Open Pins Hub` action when authenticated |
| `/login` | Implemented |
| `/auth/forgot-password` | Implemented |
| `/auth/confirm` | Implemented route handler |
| `/auth/update-password` | Implemented |
| `/auth/error` | Implemented |
| `/hub` | Protected dashboard shell |
| `/hub/sales-dashboard` | Protected fixture-backed sales dashboard |
| `/hub/calculators` | Protected calculator region menu |
| `/hub/calculators/eu` | Protected EU calculator menu |
| `/hub/calculators/eu/standard` | Protected initial EU Standard calculator |

There is no active `/test` route.

## Current Landing UI

- `src/app/page.tsx` is the public entry screen and performs a server-side Supabase auth check.
- The landing screen uses the reusable `src/components/backgrounds/Galaxy.tsx` background and Pins & Knuckles assets under `public/branding/`.
- Email sign-in links to `/login`; Microsoft and Google buttons are present as disabled placeholders until those providers are configured.
- Authenticated users see a direct link to `/hub`.

## Sales Dashboard Status

- Implemented under `src/features/sales-dashboard`.
- Uses fixture data only.
- Includes date range filtering, KPI summary, salesperson table, and lead source table.
- Future work is replacing fixtures with server-side source mapping once source IDs and column IDs are confirmed.

## Calculator Status

Implemented:

- Supabase schema and seed migrations for calculator reference data.
- Generated Supabase database types.
- EU Standard route and initial UI.
- EU calculator repository loading global reference data.
- EU domain engine, validation, price lookup, profile constants, mappers, and tests.

Not implemented yet:

- EU US Clients route/UI behaviour.
- UK Trade route/UI/domain implementation.
- Admin tooling for editing calculator reference data.

Deferred:

- EU Trade. No active profile should be added until rules are explicitly confirmed.

## EU Calculator Structure

- Routes:
  - `src/app/(hub)/hub/calculators/page.tsx`
  - `src/app/(hub)/hub/calculators/eu/page.tsx`
  - `src/app/(hub)/hub/calculators/eu/standard/page.tsx`
- Data:
  - `src/features/calculators/data/calculatorRepository.ts`
  - `src/features/calculators/data/mappers.ts`
- Domain:
  - `src/features/calculators/domain/euPricingEngine.ts`
  - `src/features/calculators/domain/priceLookup.ts`
  - `src/features/calculators/domain/profiles.ts`
  - `src/features/calculators/domain/types.ts`
  - `src/features/calculators/domain/validation.ts`
- UI:
  - `src/features/calculators/components/CalculatorShell.tsx`
  - `src/features/calculators/components/EuCalculator.tsx`
  - Supporting controls and summary components in the same folder.
- Tests:
  - `src/features/calculators/tests/calculatorRepository.test.ts`
  - `src/features/calculators/tests/euPricingEngine.test.ts`

## Repository Structure

- `src/app`: App Router routes and route-level composition.
- `src/components/auth`: Auth forms and auth actions.
- `src/components/layout`: Protected shell, sidebar, page header, access denied state.
- `src/components/ui`: Shared UI primitives and state components.
- `src/features/calculators`: Calculator data access, mapping, domain logic, UI, and tests.
- `src/features/sales-dashboard`: Fixture-backed sales dashboard feature.
- `src/lib/access`: Pins Hub access helpers.
- `src/lib/supabase`: Supabase SSR proxy and server clients.
- `src/types/database.types.ts`: Generated Supabase database types.
- `supabase/migrations`: Applied SQL migrations and seed data.
- `docs/planning`: Validated planning and legacy behaviour notes.

## UI Rules

- Keep UI compact, dark, and operational.
- Do not add marketing pages, hero sections, decorative badges, helper paragraphs, or subtitles unless explicitly requested.
- Reuse `src/components/ui`, `src/components/layout`, and feature components before adding new patterns.
- Every data surface should handle loading, empty, and error states.
- Use server components for initial data loading where practical; keep forms and rich controls as client components.

## Development Workflow

- Do not install packages unless explicitly requested.
- Do not edit applied migrations for routine changes; add a new migration.
- Do not run `supabase db push` unless explicitly requested.
- Do not commit unless explicitly requested.
- Use generated database types in Supabase repositories.
- Keep calculator formulas out of UI components.

Migration workflow:

```bash
npx supabase migration new <name>
npx supabase db push
```

Type generation:

```bash
npx supabase gen types typescript --project-id <project-id> --schema public > src/types/database.types.ts
```

Verification:

```bash
npm run lint
npx tsc --noEmit
node --test src/features/calculators/tests/*.test.ts
npm run build
```

## Known Issues

- Turbopack HMR caused repeated reload/request loops; local development uses Webpack.
- Sales dashboard is fixture-backed.
- EU US Clients and UK Trade are seeded but not implemented in UI/domain routes yet.
- Admin workflows for calculator data are not implemented.
- EU Trade remains deferred pending confirmed rules.

## Next Recommended Work

1. Implement EU US Clients using the existing EU engine and seeded profile data.
2. Implement UK Trade domain engine, route, and UI against the seeded UK tables.
3. Replace sales dashboard fixtures with server-side source mapping after source configuration is confirmed.
4. Add focused parity tests for EU US Clients and UK Trade copy/output behaviour.
5. Design admin-only calculator reference data editing after read-only calculator flows are stable.
