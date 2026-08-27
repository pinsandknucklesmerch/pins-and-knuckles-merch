## Pins Hub Project Rules

Read [`docs/ai-context/PROJECT_CONTEXT.md`](docs/ai-context/PROJECT_CONTEXT.md) before implementation. It is the current architecture, product, source-ownership, and operational-context authority. Then read the relevant standards:

- [`docs/development/ENGINEERING_STANDARDS.md`](docs/development/ENGINEERING_STANDARDS.md)
- [`docs/development/UI_STANDARDS.md`](docs/development/UI_STANDARDS.md)
- [`docs/development/COMPONENT_CATALOG.md`](docs/development/COMPONENT_CATALOG.md) when selecting a reusable control

Before changing code, inspect the relevant existing feature and search for an equivalent component, hook, helper, formatter, validation rule, or domain function. Reuse or extend established abstractions where practical; do not duplicate business logic or create one-off UI patterns for minor visual differences.

- Use the existing Next.js App Router, TypeScript, Tailwind, Supabase Auth SSR-cookie, RLS, and feature-based architecture. Do not introduce Prisma, Neon, or legacy Hub patterns.
- Keep routes thin; place feature work under `src/features/<feature-name>/`. Keep business logic, API clients, mappings, and KPI calculations out of pages and presentational components.
- Preserve behavior outside the requested scope and preserve existing user changes in a dirty worktree.
- Keep types strong; avoid unnecessary `any`, validate at boundaries, and use established server/data-access patterns.
- Keep authorization and sensitive access enforcement server/database-side. Use forward-only versioned migrations for schema changes. Keep service-role and external credentials server-only; never expose tokens through `NEXT_PUBLIC_` variables.
- Use `public/reference-assets/` for implementation screenshots or visual references supplied by the user.
- Keep the Hub compact, dark, and operational; follow the UI standards for tables, forms, actions, and states.

- Duncan runs the project's verification workflow separately after implementation. Codex/AI implementation work must not run routine lint, tests, typecheck, or build commands automatically; run verification commands only when Duncan explicitly requests them. The command definitions remain documented in the engineering standards and project context.
