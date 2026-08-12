# Pins Hub Rebuild

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

2. Create `.env.local` from [`.env.example`](.env.example). It is the
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
npm run build
```

There is currently no `npm test` script. Test files exist, but a deterministic
full-suite command has not yet been added.

## Operational verification

The repository declares integrations and schedules but cannot prove their live
state. Verify deployed Vercel cron execution, Gmail OAuth/mailbox access,
Monday API/board access, and remote Supabase migration/RLS/RPC state
operationally. See [ingestion and cron operations](docs/operations/INGESTIONS_AND_CRONS.md).

## Legacy Reference Warning

The legacy Pins Hub is reference-only. Do not reintroduce Prisma, Neon, referrals, legacy database architecture, or old implementation patterns into this rebuild.
