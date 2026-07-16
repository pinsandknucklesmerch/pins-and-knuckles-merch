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

2. Create `.env.local` from `.env.example`.

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

## Verification

Run these before handing off code changes:

```bash
npm run lint
npx tsc --noEmit
node --test src/features/calculators/tests/*.test.ts
npm run build
```

## Legacy Reference Warning

The legacy Pins Hub is reference-only. Do not reintroduce Prisma, Neon, referrals, legacy database architecture, or old implementation patterns into this rebuild.
