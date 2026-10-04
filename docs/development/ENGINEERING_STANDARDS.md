# Pins Hub Engineering Standards

This document contains durable implementation principles. Root [`AGENTS.md`](../../AGENTS.md) owns repository working rules and verification workflow; [`PROJECT_CONTEXT.md`](../ai-context/PROJECT_CONTEXT.md) owns the changing implementation and operational snapshot. Current source, migrations, manifests, and configuration remain the technical authority.

## Architecture and ownership

- Keep App Router route files thin. Route files should compose loading, authorization, and feature entry points rather than own business rules.
- Organise feature behavior under `src/features/<feature-name>/`. Use internal `components`, `data`, `domain`, `lib`, `server`, or type modules when those boundaries clarify ownership; do not create folders mechanically.
- Keep reusable UI in `src/components/ui`, shared layout in `src/components/layout`, and genuinely cross-feature infrastructure in focused shared modules.
- Keep feature-specific behavior local until more than one consumer has a stable, meaningful contract. Avoid circular feature dependencies and convenience imports that blur ownership.
- Follow the persistence, authentication, and integration architecture already established by the repository. New work should extend those systems rather than introduce a competing stack for a local problem.

## Server and client boundaries

- Prefer server components for initial data access and rendering. Use client components for interaction, browser APIs, and local UI state.
- Keep privileged credentials, service-role clients, Admin API operations, integration clients, and trusted mutations in server-only modules.
- Treat server actions and route handlers as request boundaries: authenticate, authorize, validate, call domain/data code, and return a deliberate result.
- Do not make presentation components responsible for database access, integration calls, authorization decisions, or business calculations.
- Pass the smallest serializable contract across the server/client boundary. Do not expose secrets, privileged records, or database implementation detail because it is convenient for the UI.

## TypeScript and data contracts

- Use strong, explicit types for domain values, validated inputs, persistence records, integration payloads, and view models where they make boundaries clearer.
- Avoid unnecessary `any`, unsafe assertions, and casts used only to silence a mismatch. Narrow unknown values at the boundary that introduced them.
- Handle nullable and optional data deliberately. Preserve the difference between absent, unknown, empty, and zero when the domain distinguishes them.
- Generated database types are compile-time snapshots, not domain models or deployment proof. Map them to domain/view types when that prevents persistence concerns from leaking through the application.
- Keep transformations explicit and one-directional where practical so source data, normalized data, derived values, and display values cannot be confused.

## Domain rules and validation

- Give each calculation, mapping, permission interpretation, and business rule one authoritative implementation. UI, exports, reports, and integrations should consume that implementation rather than recreate it.
- Keep source-owned values distinct from derived values. Do not overwrite one integration's fields from another source unless the domain contract explicitly defines that behavior.
- Validate at every trust boundary: requests, forms, environment/configuration input, external APIs, imported files, and database-facing mutations.
- Enforce critical invariants at the strongest appropriate layer. Database constraints and policies protect persisted integrity; server/domain validation provides clearer application errors; client validation improves interaction but is not a security boundary.
- Prefer explicit state transitions over scattered boolean updates for workflows with lifecycle, ownership, or audit requirements.

## Supabase, authorization, and migrations

- Represent schema changes as new forward-only, versioned migrations. Do not rewrite migration history that may have been applied.
- Inspect the full migration history before changing a table, function, policy, grant, or constraint; its creation migration is rarely the whole current contract.
- Preserve RLS, grants, RPC checks, and server-side authorization. Hiding a control or route in the browser never grants or revokes authority.
- Use the established Supabase browser, SSR, and admin/service-role clients for their intended trust levels. Service-role keys and integration credentials must remain server-only and must never use public environment-variable exposure.
- Design privileged RPCs narrowly: derive the actor from the authenticated context, use fixed search paths, validate scope and lifecycle, grant execution deliberately, and avoid accepting caller-supplied identity as authority.
- Treat schema used by Pins Merch App as a shared contract. Assess compatibility of identity, access, organisation, Band, Tour, product, show, inventory, RLS, and RPC changes across both consumers.
- Regenerate database types when a schema change requires compile-time coverage, while continuing to treat migrations and operational inspection as the authorities for schema intent and deployment state respectively.
- Make destructive or irreversible data changes explicit, narrowly scoped, and recoverable where practical. Separate migration intent from assumptions about production data.

## Integrations and external data

- Keep provider clients and provider-specific parsing in dedicated server-side modules behind domain-facing interfaces.
- Validate external payloads and fail clearly when required identifiers, mappings, or configuration are missing. Do not guess board IDs, metric meanings, tax rules, ownership, or other business mappings.
- Make retry, idempotency, deduplication, locking, provenance, and partial-failure behavior explicit for scheduled jobs and imports.
- Sanitize operational diagnostics. Logs and persisted run history may contain useful context, but must not expose tokens, credentials, raw sensitive payloads, or unnecessary personal data.
- Keep browser export and presentation formatting separate from canonical calculations and persisted source data.

## Reuse and interface implementation

- Search for an existing component, hook, helper, formatter, validator, domain function, data-access layer, or interaction pattern before creating another one.
- Reuse or extend an existing abstraction when its contract fits. Do not fork a business rule or component for a cosmetic difference that the existing contract can express cleanly.
- Avoid premature generalization. A focused local implementation is preferable to a shared abstraction with a large speculative configuration surface.
- Keep shared components accessible, composable, and free of feature-specific business rules. Follow [`UI_STANDARDS.md`](UI_STANDARDS.md) and consult [`COMPONENT_CATALOG.md`](COMPONENT_CATALOG.md) for interface work.

## Errors and observability

- Return errors at the right abstraction level. Preserve actionable internal context for server diagnostics while showing users concise, safe messages.
- Do not swallow failures or convert them into plausible empty data. Distinguish unavailable, unauthorized, invalid, and genuinely empty states.
- Include enough structured context to diagnose integration and background-job failures without logging secrets or duplicating entire external payloads.
- Keep expected business rejections separate from unexpected system failures so callers, run history, and monitoring can respond correctly.

## Maintainability and change design

- Prefer focused changes with clear ownership over broad refactors that mix unrelated concerns.
- Use names that express domain meaning rather than current screen placement. Keep public module contracts small and implementation details private.
- Remove duplication at the rule or contract level, not merely by combining unrelated code that happens to look similar.
- Preserve established behavior outside the requested scope. Before removing code or schema, inspect call sites, data dependencies, scripts, policies, and operational usage.
- Add focused automated coverage for important business rules, boundary validation, and regressions where the repository's testing patterns support it. Verification commands and when to run them are governed by root `AGENTS.md` and the current package manifest, not a fixed command inventory in this document.

## Documentation boundaries

- Document durable engineering principles here, current implementation state in `PROJECT_CONTEXT.md`, repository working procedure in `AGENTS.md`, and detailed domain behavior in focused reference documentation.
- Do not copy route inventories, migration counts, dependency versions, rollout stages, or temporary implementation status into this file.
- When documentation disagrees with confirmed current behavior, update the stale description; do not change working code merely to satisfy historical material.
