# Pins Hub Repository Guidance

## Purpose and repository boundary

Pins Hub is the Pins & Knuckles internal web application and business-tooling system. Pins Merch App is a separate application and repository, although both applications consume parts of the same Supabase/backend infrastructure. Changes to shared schema, authentication, RLS, roles, organisations, access logic, or shared domain structures must account for possible Pins Merch App effects.

## Authority and context

Use this evidence hierarchy:

1. Current source code and migrations.
2. Current repository configuration and package manifests.
3. Maintained current documentation.
4. Historical plans, audits, generated summaries, screenshots, and chat-derived context.

Implementation wins when documentation disagrees with confirmed current behavior. Before making feature-status claims, inspect the relevant implementation. Do not revive requirements solely because they appear in historical material, and do not treat old plans as active requirements without current supporting evidence. Placeholders and mockups do not prove intended functionality. Generated database types are snapshots for compile-time use; they do not prove that schema objects, policies, grants, RPCs, migrations, or functionality are deployed. Remote deployment state requires operational evidence.

Read [`docs/ai-context/PROJECT_CONTEXT.md`](docs/ai-context/PROJECT_CONTEXT.md) when a task depends on current product, integration, migration, or operational state. Treat it as maintained context, not as an override of source or migrations. Read the relevant nested `AGENTS.md` before working in a scoped directory. Use these standards for their respective branches:

- [`docs/development/ENGINEERING_STANDARDS.md`](docs/development/ENGINEERING_STANDARDS.md) for implementation and architecture.
- [`docs/development/UI_STANDARDS.md`](docs/development/UI_STANDARDS.md) for interface work.
- [`docs/development/COMPONENT_CATALOG.md`](docs/development/COMPONENT_CATALOG.md) when selecting reusable controls.

## Development workflow

Before editing, inspect the relevant implementation and search for an equivalent component, hook, utility, formatter, validation rule, domain function, data-access layer, RPC, table, or established pattern. Reuse or extend the existing system where practical; do not create a parallel implementation for a minor difference.

- Preserve behavior outside the requested scope and preserve unrelated working-tree changes.
- Prefer focused changes over broad refactors.
- Keep types strong, avoid unnecessary `any`, and validate at request, integration, and form boundaries.
- Inspect current schema and migration history before database work.
- Audit call sites, data dependencies, scripts, and operational use before deleting functionality, files, migrations, or data.
- Place user-supplied implementation screenshots or visual references in `public/reference-assets/` when they need to live in the repository.

## Architecture

Follow the architecture confirmed by the current repository: Next.js App Router, TypeScript, Tailwind, Supabase Auth with SSR cookies, RLS, and feature-oriented source organization. Dependency versions and available commands come from current manifests and configuration, not from this file.

- Keep route files thin. Put feature behavior under `src/features/<feature-name>/`; keep reusable UI in `src/components/ui` and shared layout in `src/components/layout`.
- Prefer server components for initial data loading. Use client components for interaction, browser APIs, and local UI state.
- Keep business rules, calculations, mappings, validation, integrations, and data access out of route files and presentational components.
- Keep privileged operations and external clients in server-only boundaries, following established repository patterns.
- Use the existing access model and source-owned domain implementations instead of inventing replacements.
- Do not introduce unrelated persistence or architecture stacks that compete with the repository's established systems.

Changing route inventories, feature status, migration counts, dependency versions, and temporary rollout state belong in maintained context or reference documentation, not in this file.

## Supabase and security

- Make schema changes through new forward-only, versioned migrations. Preserve historical migration files; do not rewrite applied migration history.
- Preserve RLS, grants, RPC checks, and server-side authorization boundaries. Browser UI visibility is never an authorization boundary.
- Keep service-role operations, privileged credentials, and external secrets server-only. Never expose service-role keys or secrets through public environment variables, repository files, logs, or output.
- Inspect actual source and migrations rather than inferring behavior from generated database types.
- Confirm the current access helpers and policy model before changing roles, memberships, organisations, or permissions.
- Evaluate shared-backend changes for Pins Merch App compatibility and coordinate schema/type consumption through the established shared workflow.

## Integrations and business rules

For Monday, EPCC, GA4, Microsoft, calculators, PK Tax, reports, spreadsheets, and other business integrations, inspect the current implementation and authoritative source material before changing behavior. Do not invent mappings, identifiers, formulas, targets, tax rules, ownership boundaries, or external API behavior. Keep source data distinct from derived calculations, and preserve established integration boundaries unless the task intentionally changes them.

## UI and UX

Keep Pins Hub compact, functional, professional, and operational. Reuse shared controls and interaction patterns. Avoid duplicate wording, unnecessary helper copy, decorative clutter, excessive whitespace, and one-off components where a shared pattern exists. Preserve established accessibility, feedback, responsive, and interaction behavior unless the task intentionally changes it.

## Documentation

Keep rapidly changing implementation status out of this file. Record changing feature, migration, integration, and operational state in the appropriate maintained context or reference document. Historical workflow documents remain historical evidence, not implementation authority.

When documentation conflicts with current implementation, update the stale documentation rather than changing working code to satisfy obsolete text, unless the user explicitly requests a behavior change.

## Verification ownership

Duncan runs routine verification separately. Do not automatically run lint, tests, typecheck, build, or other routine verification commands unless explicitly requested. When verification is requested, inspect current package scripts and repository documentation for the applicable commands. Do not ask Duncan to report routine successful verification output.

## Git and operational safety

- Never discard unrelated work or reset the working tree merely to make it clean.
- Do not perform routine commits, branch operations, rebases, or pushes unless requested.
- Avoid destructive Git, database, migration, or data operations without explicit need and confirmed scope.
- Keep secrets and sensitive values out of command output, documentation, and repository files.
