<!-- headroom:rtk-instructions -->
# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage by 60-90% with zero behavior change. If rtk has no filter for a command,
it passes through unchanged — so it is always safe to use.

## Key Commands
```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules
- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage
<!-- /headroom:rtk-instructions -->

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

- Before handing off code changes, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
