# Pins Hub Rebuild

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

The shared Supabase migration sequence is synchronized through `20260902000000_create_merchbuddy_show_inventory_counts.sql`, including the EPCC and inventory migrations. Pins Hub remains the migration authority for project `vggajzzagwzgmddnytle`.

## Shared Supabase migration ownership

Pins Hub owns the forward-only migration history for the shared Supabase project `vggajzzagwzgmddnytle`. Pins Merch App consumes generated database types and must not independently run `db push` against that project. Merch-specific schema migrations, including inventory persistence, are authored and applied from this repository; consumer applications may regenerate their types from the shared project.

Pins Hub is the internal operations hub for Pins & Knuckles merchandise workflows. This repository is the clean rebuild of the hub, with the legacy app kept as reference only for confirmed business behaviour.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, RLS, migrations, and generated database types

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from [`.env.example`](../.env.example). It is the
   environment-variable contract, including server-only integration, cron, and
   database-tooling variables.

3. Set the required environment variables by name:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

## Development

Run development with Webpack:

```bash
npm run dev
```

`npm run dev` uses `next dev --webpack`. Keep this until the Turbopack HMR reload loop is resolved.

## Supabase Workflow

Create migrations locally under `supabase/migrations/`. Do not edit applied migrations casually; add a new migration for schema changes.

Apply migrations only when intentionally updating a target database:

```bash
npx supabase db push
```

Generate database types after remote schema changes:

```bash
npx supabase gen types typescript --project-id <project-id> --schema public > src/types/database.types.ts
```

## Database tooling

The repository provides local operational commands:

```bash
npm run db:test
npm run db:backup
npm run db:restore -- backups/database/<file>.dump
```

Backup uses `DIRECT_DATABASE_URL`. Restore requires a separate disposable
target (`RESTORE_DATABASE_URL`) and has safeguards for local `auth.users`
handling; it must never target production.

## Verification

Run these before handing off code changes:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run db:test
```

`npm test` runs the existing Node test suite. The database check needs an
authorised connection and verifies connectivity only. Follow
[maintenance instructions](SALES_AI_CONTEXT.md) and the
[technical handover](TECHNICAL_HANDOVER.md#verification) for approval, full
verification and release restrictions.

## Operational verification

The repository declares integrations and schedules but cannot prove their live
state. Verify deployed Vercel cron execution, Gmail OAuth/mailbox access,
Monday API/board access, and remote Supabase migration/RLS/RPC state
operationally. See [ingestion and cron operations](operations/INGESTIONS_AND_CRONS.md).

## Legacy Reference Warning

The legacy Pins Hub is reference-only. Do not reintroduce Prisma, Neon, referrals, legacy database architecture, or old implementation patterns into this rebuild.

## Documentation directory

All project documentation and supporting reference files are under `ai-context/`. Root `README.md` and `AGENTS.md` remain repository entry points; root `ROLES.md` is the single Codex role selector. Private credential notes and application-served public assets were not moved into this folder.

- [Management handover](FINAL_MANAGEMENT_HANDOVER.md)
- [Final maintenance policy](RESTRICTED_MAINTENANCE_POLICY.md)
- [Support guide](HUB_SUPPORT_GUIDE.md) and [Codex instructions](SALES_AI_CONTEXT.md)
- [Daily operations](DAILY_OPERATIONS_GUIDE.md), [making changes](MAKING_CHANGES_GUIDE.md) and [troubleshooting](TROUBLESHOOTING_GUIDE.md)
- [Emergencies](EMERGENCY_PROCEDURES.md), [responsibilities](RESPONSIBILITIES_AND_ESCALATION.md) and [final checklist](FINAL_HANDOVER_CHECKLIST.md)
- [Technical handover](TECHNICAL_HANDOVER.md), [audit](FINAL_HANDOVER_AUDIT.md) and [infrastructure disclosures](INFRASTRUCTURE_REMAINING_ACTIONS.md)
- Supporting material: `operations/`, `development/`, `reference/`, `planning/` and `imports/`

The `handover/` subfolder contains an explicitly historical prompt. It does not supersede the final policy. Relocation does not resolve any unverified operational or infrastructure risk.
