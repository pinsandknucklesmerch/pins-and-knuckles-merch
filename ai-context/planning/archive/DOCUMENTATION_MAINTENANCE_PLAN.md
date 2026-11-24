# Pins Hub — Documentation Maintenance Plan

## Canonical documentation

- `README.md`: setup, environment-variable entry point, local commands, and
  supported verification commands.
- `ai-context/development/ENGINEERING_STANDARDS.md` and
  `ai-context/development/UI_STANDARDS.md`: current implementation standards.
  `ai-context/development/COMPONENT_CATALOG.md` is a concise component-routing aid.

## Operational documentation

- `ai-context/operations/INGESTIONS_AND_CRONS.md`: schedules, source ownership,
  authentication, locks, run history, diagnostics, and operator checks.
- `ai-context/operations/DATABASE_BACKUP_RESTORE.md`: database backup/restore
  safeguards, public schema behavior, and `auth.users` restoration boundaries.

## Reference documentation

Current focused references are:

- `ai-context/reference/SALES_DASHBOARD.md`
- `ai-context/reference/CALCULATORS.md`
- `ai-context/reference/DATABASE_SCHEMA.md`

They provide implementation detail. Migrations and source remain authoritative
when a reference conflicts with implementation.

## Historical documentation

Old rebuild contexts, Sales Dashboard plans, calculator migration analysis and
audits, dated weekly status, and prior project audits are historical records.
They may preserve rationale, but must not describe themselves as current
architecture or operational verification.

## Immediate tasks

- Keep the canonical context and current references aligned with routes,
  migrations, configuration, tests, and active integrations.
- Keep README free of unsupported verification commands.
- Keep EPCC/Monday operational details in the ingestion/cron guide.
- Add or strengthen historical notices where a dated plan could be mistaken for
  current implementation.
- Consolidate duplicate rebuild-context material in a later, separately
  approved documentation cleanup.
