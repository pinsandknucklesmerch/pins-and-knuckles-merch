# Repository Guidelines

## Active Codex role

Before undertaking any task, read [ROLES.md](ROLES.md). It is the single role selector. Codex must not change its own active role. If the file is missing, unreadable, invalid or ambiguous, default to RESTRICTED. Changing roles does not automatically authorise any operation.

When RESTRICTED is active, follow the non-technical maintainer workflow below. When DEVELOPER is active, full application development is permitted within the authorised task scope, including features, business/pricing logic, databases/RLS, authentication, integrations, dependencies, configuration, testing and debugging. Restricted-only refusal lists, command bans and mandatory salesperson approval/handoff steps do not apply to authorised development. Engineering standards and applicable technical review/release requirements still apply. Destructive operations and production changes require explicit authorisation; infrastructure and deployment work require explicit authorisation.

The roles are procedural AI instructions, not application permissions or technically enforced security boundaries. Switching roles changes no GitHub, Supabase or Vercel permissions/configuration, credentials or infrastructure. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation. Historical evidence and outstanding risk disclosures remain valid at their evidence dates until separately resolved.

## Non-Technical Maintainer Workflow — RESTRICTED only

For salesperson/non-technical-maintainer sessions, support-guide requests and maintenance mode, first read [SALES_AI_CONTEXT.md](ai-context/SALES_AI_CONTEXT.md) and [RESTRICTED_MAINTENANCE_POLICY.md](ai-context/RESTRICTED_MAINTENANCE_POLICY.md). Allow only specifically approved minor text, label and styling changes within existing functionality. Refuse new features, databases/SQL/RLS/migrations/schema, authentication/authorisation/security, pricing/calculator/financial logic, API/integration/job, environment or infrastructure changes and refer to management or technical support. ROLES.md determines the active role; an invalid or unclear setting defaults to RESTRICTED.

The final agreement leaves all existing GitHub permissions/branch settings, Supabase permissions/configuration and Vercel permissions/configuration unchanged. Do not introduce mandatory CODEOWNERS, branch protections, role changes or new infrastructure safeguards as activation requirements. These procedural instructions do not technically prevent prohibited actions or establish actual account restrictions; existing privileges may be broader than authorised work.

Inspect relevant non-secret source, propose exact files/diff and obtain specific local approval before editing. Preserve unrelated work. Do not inspect credentials/provider sessions, run application/package/check commands or publish changes in the salesperson session. Management arranges technical support when required for review, validation, publication, releases or incidents. Existing code-check obligations remain review/release requirements; missing required results block release, not justify giving the salesperson credentials. Documentation-only work needs no application checks. No ongoing support or training obligation falls to the departing developer.

[HUB_SUPPORT_GUIDE.md](ai-context/HUB_SUPPORT_GUIDE.md) is the employee entry point. [TECHNICAL_HANDOVER.md](ai-context/TECHNICAL_HANDOVER.md) contains support-only technical references. [The procedural handover checklist](ai-context/operations/RESTRICTED_MAINTENANCE_ACTIVATION.md) replaces the earlier mandatory safeguard-activation proposal. Documentation readiness is separate from unverified operational readiness and disclosed infrastructure risks.

## Project Structure & Module Organization

This is a Next.js App Router application written in strict TypeScript. Routes and layouts live in `src/app/`; keep them thin and place business behavior in `src/features/<feature>/`. Feature folders may contain `components`, `domain`, `data`, `lib`, `server`, and `tests` as needed. Reusable controls belong in `src/components/ui`, shared shell components in `src/components/layout`, and cross-feature utilities in `src/lib`. Static files are under `public/`, operational scripts under `scripts/`, documentation under `ai-context/`, and forward-only database changes under `supabase/migrations/`.

## Build, Test, and Development Commands

- `npm ci` installs the locked dependency set.
- `npm run dev` starts Next.js locally with Webpack.
- `npm test` runs TypeScript `*.test.ts` files with Node's built-in test runner.
- `npm run lint` applies the Next.js and TypeScript ESLint rules.
- `npx tsc --noEmit` performs strict type checking.
- `npm run build` creates a production build; `npm start` serves it.
- `npm run db:test` checks database connectivity. Treat backup, restore, and migration commands as deliberate operational actions.

## Coding Style & Naming Conventions

Follow existing TypeScript/React formatting: two-space indentation, double quotes, semicolons, and trailing commas in multiline structures. Use `PascalCase` for React components and types, `camelCase` for functions and variables, and descriptive kebab-case feature directories. Prefer the `@/` alias for imports from `src`. Keep calculations, authorization, validation, integrations, and persistence out of presentational components. Use server components for initial loading and client components only for interaction or browser APIs. Reuse established components and CSS modules before adding one-off patterns.

## Testing Guidelines

Tests use `node:test` with `node:assert/strict`. Co-locate focused tests as `name.test.ts`, or place broader feature coverage in `tests/`; script tests live in `scripts/tests/`. Add regression coverage for business rules, access checks, parsing, and data transformations. There is no stated coverage threshold; favor meaningful boundary and failure-path assertions.

## Commit & Pull Request Guidelines

History uses short, informal subjects and has no enforced commit convention. Improve clarity with concise imperative subjects such as `Fix sales checklist pagination`, keeping each commit focused. Pull requests should explain behavior and risk, link the relevant issue, list verification performed, and include screenshots for UI changes. Call out migrations, environment-variable changes, shared Supabase impacts, and operational follow-up explicitly.

## Security & Configuration

Copy local settings from `.env.example`; never commit credentials or expose service-role keys through public variables. Add new timestamped migrations instead of editing applied history, and preserve RLS, grants, RPC authorization, and server-only trust boundaries.
