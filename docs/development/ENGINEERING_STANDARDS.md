# Pins Hub Engineering Standards

These are repository conventions. Read the [project context](../ai-context/PROJECT_CONTEXT.md) first for current architecture and source ownership.

## Architecture and ownership

- Organise feature code under `src/features/<feature-name>/`; use `components/`, `data/`, `lib/`, `domain/`, `server/`, and `types.ts` only when they clarify ownership. Keep routes thin.
- Put reusable cross-feature UI in `src/components/ui` and layout in `src/components/layout`. Keep feature-specific code local until genuine reuse justifies extraction.
- Prefer server components for initial data loading. Use client components for interaction, browser APIs, and local form state. Put external clients and privileged operations in server-only modules.
- Keep data access, mapping, validation, and domain rules outside presentation components. Avoid cross-feature imports and circular dependencies; depend on a focused shared layer when necessary.

## Reuse

> Before creating a new component, hook, helper, domain function, formatter, validation rule, or UI pattern, search the existing repository for an equivalent. Reuse or extend the existing abstraction wherever practical. Introduce a new abstraction only when the existing one genuinely does not fit.

Similar appearance alone is not a reason to duplicate a component. Conversely, do not turn a focused shared abstraction into a giant configuration surface prematurely.

## TypeScript and domain rules

- Use explicit domain, input, and view types where they make boundaries clear. Do not use unnecessary `any`.
- Handle nullable data and errors deliberately. Validate and normalise at request, integration, and form boundaries.
- Keep generated database types separate from domain/view models when mapping improves clarity or prevents database details leaking into UI.
- Keep each calculation or business rule authoritative in one domain implementation. UI consumes results; it does not recreate formulas. Add focused automated tests for important rules and edge cases.

## Supabase and security

- `supabase/migrations/` is authoritative for schema changes. Add forward-only, versioned migrations; do not casually edit applied migrations.
- RLS, grants, RPC checks, and server-side authorization are the security boundary. UI visibility is never authorization.
- Use established SSR/browser/admin clients correctly. `SUPABASE_SERVICE_ROLE_KEY` and all integration credentials remain server-only; never use `NEXT_PUBLIC_` for secrets.
- Regenerate `src/types/database.types.ts` when a schema change requires it. Treat destructive migrations and data actions as deliberate, reviewed operations with a recovery plan.

## Verification

Duncan runs the project's verification workflow separately after implementation. Codex/AI implementation work must not run routine verification automatically; Codex runs these commands only when Duncan explicitly requests them. The available commands are:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The repository has no deterministic full-suite command; focused tests may be run when explicitly requested.
