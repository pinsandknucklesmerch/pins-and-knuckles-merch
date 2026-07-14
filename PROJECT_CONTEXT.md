# Project Context

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, Storage foundation
- No Prisma

## Architecture

- `src/app` owns routes and route-level composition only.
- `src/components` owns shared UI, auth, and layout components.
- `src/lib` owns shared utilities, Supabase clients, auth/access helpers, and server-side integrations.
- `src/features` is the target location for feature modules.
- Feature modules should keep UI, data access, mapping, and calculations separate.

## Rules

- Preserve Supabase SSR cookie handling and Pins Hub access checks.
- Keep page files thin; move business logic and external API logic into feature `data/` or `lib/` files.
- Keep external API credentials server-only. Do not use `NEXT_PUBLIC_` for Monday credentials or tokens.
- Use server components for initial reads where practical.
- Reuse shared components before adding new JSX/Tailwind patterns.
- Include loading, empty, and error states for data views.
- Keep product UI compact, dark, and operational.
- Do not add unnecessary descriptions, subtitles, helper paragraphs, decorative badges, or marketing sections.
- Verify changes with `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
