# PINS Hub Technical Handover

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Current authority, provenance and use

The [final restricted-maintenance policy](RESTRICTED_MAINTENANCE_POLICY.md) is authoritative. Salesperson work is limited to specifically approved minor text, label and styling changes within existing functionality. Codex refuses prohibited requests and refers to management or appointed support. The canonical six-step workflow is in that policy; the salesperson makes no independent command, provider, build/test, migration, deployment or database operation.

Existing GitHub permissions/branch settings and Supabase/Vercel permissions/configuration remain unchanged. No mandatory CODEOWNERS, branch protections, role changes or new infrastructure safeguards are adopted. Procedural limits do not technically prevent prohibited actions or make Supabase inaccessible. Management arranges support when required; the departing developer has no ongoing maintenance, troubleshooting, training or support obligation.

This document combines the **19 November 2026 source-based handover**, **22 November local-remediation results** and **23 November infrastructure disclosures**. It is not a new source/provider inspection. Historical account-control proposals and support follow-up inventories below are not mandatory activation requirements; future technical actions require separate authorisation. Documentation is prepared for delivery; receipt is not recorded, operational/security readiness is not established, and risks remain open. No application checks or routine verification were run for the final cleanup.

## Recorded infrastructure assessment — 23 November 2026 (historical)

Use [Infrastructure remaining actions](INFRASTRUCTURE_REMAINING_ACTIONS.md) as the current infrastructure sign-off checklist. It separates fresh read-only results from historical observations, provides numbered closure steps and assigns management, salesperson and technical-support responsibilities. The earlier sections below describe source and procedures; they do not establish current provider access, successful restoration or live password recovery.

Handover remains blocked by unverified usable backups/restoration, unavailable Vercel management access, personal Monday credentials, outstanding live authentication acceptance and undemonstrated successor ownership/protected changes. Management owns company access, billing/recovery custody and risk approval. Appointed technical support owns maintenance, troubleshooting, training, releases and recovery; the salesperson reports issues and uses normal Hub functions. The departing developer has no ongoing duties.

No production operations were performed for this update. Documentation-only verification replaces no application checks: tests, lint, typecheck, build and database checks were not run, as requested. Keep private operational evidence outside this public repository.

Read [FINAL_HANDOVER_AUDIT.md](FINAL_HANDOVER_AUDIT.md) for the final verification results, live read-only observations, unresolved security/ownership/recovery findings and required actions from 22 November 2026. The baseline below was written earlier; its documentation-only check results are not the final audit results. No historical statement below certifies current production readiness.

## Scope and evidence

Repository inspection: 19 November 2026. This is a source-based handover, not certification of a live deployment or backup. Live domains, production branch, Vercel settings, applied migrations, email templates, credentials, backup retention, and restore availability must be confirmed by the account owners. No production systems were changed during this documentation batch.

For the designated non-technical maintainer, [SALES_AI_CONTEXT.md](SALES_AI_CONTEXT.md) controls the maintenance workflow. [HUB_SUPPORT_GUIDE.md](HUB_SUPPORT_GUIDE.md) is the employee-facing entry point. Release and production recovery require technical support and separate business-owner approval.

## Architecture and hosting

Pins Hub is the internal Pins & Knuckles operations application. It uses Next.js App Router, React, strict TypeScript, Tailwind CSS, shared UI primitives, and CSS modules. Use `package-lock.json` for the installed dependency snapshot; several dependencies in `package.json` use `latest`, so an upgrade is not a routine maintenance step.

Routes/layouts are in `src/app`; feature behavior is under `src/features`. Initial rendering and privileged data access are server-side, with client components for interaction. Server actions and API routes enforce request boundaries. Supabase provides hosted Postgres and Auth; browser/server clients use the publishable key and RLS, while explicitly privileged server operations use the isolated service-role client.

Vercel is the deployment target evidenced by `vercel.json`, cron routes, and the GA4 Vercel identity implementation. The linked project, team ownership, live domain, production branch, deployment protection, Node version, build settings, and automatic deployment rules require dashboard confirmation. `next.config.ts` contains development-origin configuration; it is not a disaster-recovery mechanism.

`npm run dev` uses Webpack intentionally. `npm run build` builds locally; it does not deploy. `npm start` serves an existing build. Installation runs the MetricUI style generator through `postinstall`; do not reinstall or update dependencies just to investigate an incident. A preview deployment can still use production resources if configured that way: verify backend isolation before any write-based testing.

## Important modules

| Area | Source and responsibility |
| --- | --- |
| Authentication/access | `src/features/auth`, `src/components/auth`, `src/lib/access`, `src/lib/supabase`, `src/proxy.ts`: login, sessions, recovery, invitations, organisation and app access. |
| User Access Management | `src/features/team`, `src/app/(hub)/hub/team`: user listing, invitations, profile/access updates, administrator reset requests. |
| Sales dashboard | `src/features/sales-dashboard`: current/history views, KPIs, Final Values, TV settings, exports, Monday and EPCC ingestion. Some historical workbook fallback remains intentional. |
| Calculators and pricing data | `src/features/calculators`, `data-management`, `garments`: EU/EU-US and UK trade pricing, reference data and quote output. Drafts are client-local, not persisted. |
| Business tools | `commercial-invoices`, `pk-tax`, `profile`, `quick-reference`, `reference`, `dashboard`: invoice export, tax tools, member views, reference information and navigation. |
| Sales checklist | `src/features/sales-checklist`: persisted current board, assignments, statuses, management, TV slide and scheduled reset. |
| Analytics/diagnostics | `analytics`, `developer-diagnostics`, `feedback`: GA4 reporting, operational issues, ingestion history and feedback. These views have their own access restrictions. |
| Database/tooling | `supabase/migrations`, `src/types/database.types.ts`, `scripts`: versioned database intent, generated types, imports and local database tooling. |

Read [engineering standards](development/ENGINEERING_STANDARDS.md), [UI standards](development/UI_STANDARDS.md), and the [component catalog](development/COMPONENT_CATALOG.md) for relevant implementation work. Domain references are in `ai-context/reference/`; historical plans and audits are context, not current requirements.

## Supabase authentication and database

`src/lib/supabase/client.ts` and `server.ts` use Supabase SSR browser/cookie clients. The proxy handles session routing/refresh; current access helpers and database policies determine permissions. `profiles`, `organisation_members`, and `app_access` are separate parts of the access model. Organisation roles, active membership and app-level `read`/`write`/`admin`/`developer` access must be evaluated together; an ordinary Hub administrator does not automatically receive every developer capability.

The service-role factory in `src/lib/supabase/admin.ts` is server-only and bypasses normal RLS restrictions. Privileged actions must enforce their own authenticated actor and organisation checks before using it. Keep the key server-only; hiding a menu item is not authorization.

Password recovery reuses `sendPasswordRecoveryEmail` in `src/features/auth/lib/passwordRecovery.ts`. `/auth/confirm` handles supported confirmation callbacks. The explicit `/auth/recovery-confirm` page and POST verification route validate a recovery token hash, establish the recipient's session, and proceed to `/auth/update-password`. The existing form calls Supabase to set the password; recovery then signs out and returns to login. Invitation completion is a separate mode and route.

The source includes administrator reset requests in `src/features/team/actions/users.ts`: active administrator checks, organisation-scoped target lookup, Owner/Developer restrictions, registered Auth email lookup, and generic success/failure messages. Its presence does not prove it is deployed. Because the sender and recipient can use different browsers, verify the Supabase recovery email uses the existing token-hash flow rather than relying on a verifier in the administrator's browser. An applicable template link is:

```text
{{ .SiteURL }}/auth/recovery-confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password
```

Technical support must verify the Site URL, redirect allowlist, SMTP/email delivery, expiry/rate limits, and both self-service and administrator-initiated recovery before relying on this in production. Recovery requests do not grant missing Hub access or reactivate membership. Never create predictable temporary passwords or share recovery links.

The 22 November remediation fixes the demonstrated backslash-path redirect defect locally in `getSafeAuthNextPath`: it rejects backslashes/control characters and verifies the parsed destination origin, with regression coverage. Legitimate local paths retain their queries/fragments. The 22 November record describes a local repair without release; no later approved deployment or live security certification is established by these documents. Authentication changes remain outside employee maintenance scope. The private live email template/URL configuration still needs an owner's dashboard review; because Hub and Merch share Supabase, do not apply a Hub-only template without checking both applications.

Pins Hub owns forward-only migrations for the shared Supabase project identified in the README as `vggajzzagwzgmddnytle`. Verify the actual target before operational work. The separate Pins Merch App consumes the same backend contracts; identity, authorisation and shared data changes can affect both applications. Maintenance staff must not run schema pushes, edit applied migrations, or regenerate types as a speculative repair. Generated types and migration files do not prove remote migration/RLS/RPC parity. See [database reference](reference/DATABASE_SCHEMA.md).

## External integrations and scheduled jobs

| Integration | Current source behavior | Critical access |
| --- | --- | --- |
| Monday sales | `scripts/lib/monday` and `sales-dashboard/server/mondaySalesCron*`: scheduled current-UTC-month sync for the canonical organisation, with a per-period lock and validation. Owns quotes, orders and sales-inbox/conversion data; does not overwrite EPCC-owned profit. | Monday token, board/workspace access, correct mappings, Supabase service-role/RPC permissions. |
| EPCC/NetSuite via Gmail | `gmailProfitClient.ts`, `epccProfitImporter.ts`, `scripts/lib/epccProfitEmail.ts`: refreshes Gmail OAuth, finds/parses report emails, validates/reconciles totals and handles duplicate/older reports. Active write RPC is `ingest_epcc_monthly_profit_and_members`. | Report mailbox, report delivery, OAuth client/refresh authorisation, service-role/RPC permissions. |
| Snuggle | `sales-dashboard/server/snuggleProfit.ts`: reads its configured Monday board for dashboard presentation; no dedicated cron is declared. | Monday token and Snuggle board access. |
| GA4 | `analytics/server/ga4.ts`: Google Analytics Data API using Vercel OIDC and Google Workload Identity Federation/service-account impersonation. It has no local credential fallback. | Vercel deployment identity, Google Cloud federation/IAM, service account and GA4 property permissions. Local unavailability alone is not proof of a code defect. |

From July 2026, EPCC owns company Profit and member Profit/PK Tax. Final Values are independent display overrides, not corrections to upstream source data. Do not replay imports, remove locks, remap providers, or change financial values as a maintenance shortcut. CLI imports may default to dry-run, but cron ingestion applies writes.

Current `vercel.json` declares three schedules. Vercel cron expressions are UTC; South Africa is UTC+2:

| Route | Cron | Expected South African time | Effect |
| --- | --- | --- | --- |
| `/api/cron/epcc-profit` | `5 8 * * *` | Daily 10:05 | Applies EPCC report ingestion. |
| `/api/cron/monday-sales-sync` | `15 8 * * *` | Daily 10:15 | Syncs current reporting month. |
| `/api/cron/sales-checklist-rollover` | `0 7 * * 1` | Monday 09:00 | Calls `reset_all_sales_checklists`; resets the configured scope of statuses to To Do. |

All three require server-side bearer `CRON_SECRET`; opening these GET routes can mutate data and is not a safe health check. EPCC/Monday record runs in `cron_run_history`; Developer Diagnostics shows last run, last successful run, failures and overdue state, with a documented 60-minute grace period. The checklist route does not use that same run-history wrapper: check its Vercel function logs separately. Configuration alone proves neither deployment nor successful execution.

For stale figures, first inspect selected reporting period, last successful run, upstream availability and sanitized logs. Monday can report recoverable skipped rows while successfully processing other rows; fatal validation rejects the sync. Alert delivery and retention policies have not been established by this handover. See [ingestion operations](operations/INGESTIONS_AND_CRONS.md) and [checklist reference](reference/SALES_WEEKLY_CHECKLIST.md).

## Verification

The existing automated test entry point is the `test` script in `package.json`. It runs Node's built-in test runner over `src/**/*.test.ts` and `scripts/**/*.test.ts`, with TypeScript stripping and the repository alias/server-only loader in `scripts/register-test-alias.mjs`, `test-alias-loader.mjs`, and `test-server-only-shim.mjs`. Use an approved Node runtime supporting these flags; do not upgrade it speculatively. Tests include domain, integration-boundary and source-structure checks; they are not a live email or browser acceptance test.

There is no combined `verify` script or `.github` CI workflow in the inspected repository. Use all configured checks below, including the existing database connectivity script; do not assume an automatic release gate exists:

| Check | Existing command | Initial documentation batch (19 November 2026) |
| --- | --- | --- |
| Automated tests | `npm test` | NOT RUN — documentation only. |
| ESLint | `npm run lint` | NOT RUN — documentation only. |
| Strict TypeScript | `npx tsc --noEmit` | NOT RUN — documentation only. |
| Next.js production build | `npm run build` | NOT RUN — documentation only. |
| Database connectivity | `npm run db:test` | NOT RUN — documentation only. |

For restricted maintenance code changes, appointed support establishes the baseline and runs the required checks after each attempt; the salesperson session runs none and receives no credentials. Candidate tests, lint, typecheck and build require a suitable authorised validation route, with any required database check handled by technical support without supplying salesperson credentials. Isolation and secret handling remain unverified; no new infrastructure safeguards are mandated by the final policy. Specific local edit approval and separate technical/release approval remain required. Report PASS only for completed successful commands on the reviewed files, otherwise FAIL or NOT RUN; any missing required result blocks release. Preserve failing checks, escalate existing unrelated failures and environmental blockers, and do not install unapproved dependencies or reuse historical results as current certification.

`npm run db:test` requires an authorised `DIRECT_DATABASE_URL`, `psql` and Python 3. It executes `SELECT 1`; it does not validate RLS, application behavior or restore readiness. Use the approved verification target, never guess or repoint a production connection. If the connection or tooling is unavailable, record NOT RUN and have technical support arrange it before release. Never print its connection string. Build/test environment problems must be reported rather than bypassed. Backup and restore are operational actions, not verification checks. Technical support must also arrange focused manual checks using a confirmed appropriate environment before release.

The final remediation ran all five checks successfully after its last code change: 496 tests passed with no failures/skips, plus lint, strict TypeScript, production build and database connectivity. See the audit's remediation update for exact commands, environmental limitations and remaining manual checks. These results do not approve a production release. The ingestion runbook describes two ingestion jobs, while `vercel.json` also schedules the checklist reset. The operations notices now link to the handover and archived planning records; those archived records are historical, not current operational acceptance. Resolve facts from source/configuration rather than inventing missing current documents.

## Vercel release and application rollback

There is no release or rollback automation established by this repository. The maintainer's AI must never push or deploy automatically. Committing, pushing, merging, deployment promotion and rollback belong to technical support with separate approval; a connected branch push/merge may itself trigger deployment.

Before any approved release, technical support should identify the exact project/team/domain, production branch, intended revision, configured build/runtime, production/preview variables, connected Supabase target, cron configuration and known working deployment. Preserve the current deployment identifier and verification results. Complete all required checks and targeted manual checks through an appropriate authorised validation route. Existing preview/resource isolation remains unverified; do not assume it or infer permission to change infrastructure. No new safeguards are mandated by the final routine policy. Release only after the business owner approves the specific reviewed result.

If a released application breaks:

1. Record impact, first failure time, current deployment identifier, recent release/configuration changes and safe logs. Distinguish an application regression from an external outage, access problem or database corruption. Preserve evidence before further action.
2. Technical support assesses a known working deployment's compatibility with the current database and provider configuration. The business owner approves the proposed rollback and expected impact.
3. In the correct Vercel project's Deployments dashboard, use the available **Rollback** operation for the known working production deployment. If the account/plan does not offer it, technical support must arrange an approved promotion or redeployment of the known working revision. Do not invent a CLI command or bypass account controls.
4. Confirm the live domain serves the intended version; check login/recovery, an authorised dashboard/calculator example, and affected jobs. Confirm cron schedules and external dependencies separately, and monitor for recurrence.

An application rollback does not undo database writes, restore deleted records, reverse Supabase migrations, revoke exposed credentials, or reliably revert external/hosting configuration. Do not assume an old deployment is safe against a changed shared backend. Local verification success also does not prove that production rollback is available; the owner should have technical support confirm the process before departure.

## Database backup and production recovery

The existing tooling is documented in [DATABASE_BACKUP_RESTORE.md](operations/DATABASE_BACKUP_RESTORE.md):

| Command | Scope and safeguards |
| --- | --- |
| `npm run db:backup` | Uses `DIRECT_DATABASE_URL` with `pg_dump --format=custom`; writes `backups/database/pins-hub-YYYY-MM-DD_HH-MM-SS.dump` via a temporary file. Requires PostgreSQL tools. It does not itself schedule, encrypt, upload, or prove recoverability of backups. |
| `npm run db:restore -- backups/database/<file>.dump` | **Destructive, disposable local/test target only.** Uses `RESTORE_DATABASE_URL`, rejects matching source/hosted Supabase targets, requires typed interactive `RESTORE`, and may need matching local `RESTORE_ADMIN_DATABASE_URL` privileges. Never use this script as the production restore procedure or remove its safeguards. |

The restore script drops non-extension public objects, loads required `auth.users` data, and restores filtered public schema/data. It removes existing local users and recreates relevant triggers. It intentionally does not restore sessions, refresh tokens, MFA or OAuth state, other managed schemas, Storage objects, hosting configuration or external systems. A partial restore failure must be reviewed; do not repeatedly apply it to a valuable target.

Production recovery is a separate, technical-support-led operation:

1. Notify the business owner; identify affected data and both Hub/Merch consumers. Establish the incident interval and acceptable recovery point/data loss. If necessary, obtain approval to pause affected writes/jobs through the authorised operators.
2. Preserve a secure snapshot of the current state where possible. Confirm which Supabase backups or point-in-time recovery are actually available under the project's plan, their age, retention, scope and restore target. No available backup, PITR entitlement or successful restore drill has been verified here.
3. With owner approval, use Supabase's supported recovery process and support team. Recover into an isolated target for validation where supported; agree downtime and post-recovery reconciliation. If the required backup is unavailable, escalate to Supabase support rather than improvising destructive SQL.
4. Validate schema, RLS/RPC/grants, representative counts/records, Auth/profile/member relationships and business totals. Treat sessions, credentials, Storage and provider state as separate recovery concerns. Reconcile both applications and integration source ownership before reopening writes or replaying missed jobs.
5. Confirm service, scheduled runs, login/recovery and critical workflows, then record the recovery point, actual data loss and follow-up work. Job replay and cutover require explicit technical approval.

The earlier handover proposed a local/test restore exercise using a protected backup. It remains unperformed/unverified in these records and requires a separate management decision and authorised technical support; it is not a salesperson or departing-developer obligation. Store backups in company-controlled protected storage with defined encryption, retention and restore access; a local dump on the departing developer's computer is insufficient. Set recovery-time and acceptable-data-loss expectations with the owner. None of these operational tasks were performed in this batch.

<a id="successor-access-and-protected-changes"></a>

## Existing access, review and publication — final decision

Leave existing GitHub roles, branch settings and related Supabase/Vercel permissions/configuration unchanged. Earlier proposals for salesperson Read/Triage-only access, role removal, protected `main`, mandatory independent/code-owner approvals, no direct pushes and new required CI gates are not mandatory activation requirements under the final agreement. No such controls were applied by the documentation work.

The salesperson procedure still limits local edits to approved minor text/label/style changes and prohibits routine-session commits, pushes, merges and deployments. Actual rights may be broader; this is not technical enforcement. Management arranges support when required for review, configured checks/manual acceptance and separately authorised publication/release. Existing automation may deploy from a push/merge; no mandatory technical gate is assumed.

The earlier unprotected-branch, single-visible-administrator, missing workflow and unverified successor/company-custody findings remain disclosures in the audit and infrastructure register. Management must decide how to handle them; no risk is closed by retaining current settings. Any future access/control remediation requires a separate management decision outside this routine policy.

## Historical recovery and integration follow-up proposals — not activation requirements

The following proposals originate from the earlier technical handover. Retain them as potential separately authorised support work and risk context, not instructions to grant permissions, change configuration or require a new safeguard before documentation receipt. Management decides whether to accept, defer, investigate or separately authorise action. Keeping settings unchanged does not resolve the disclosed risks.

### Supabase backup sign-off

The 22 November backup-list record returned `backups: null` and PITR disabled; no usable recovery point was established. This does not prove that every provider backup option was absent. WALG enabled is not a verified restore point. The August local dump is not a proven current backup. The owner must inspect the project's actual plan, available backups, retention and restore options with Supabase support; no reliable recovery window is established here.

Assign a company custodian and alternate with the necessary project/backup permissions. Agree recovery point and recovery time objectives, establish protected off-machine copies where appropriate, and have technical support demonstrate restoration into an isolated target. Include Auth, Storage and external configuration in the recovery inventory; a database dump does not cover everything. Approve any paid backup/PITR service separately. Follow the production recovery sequence above during an incident; the local restore script must never be repointed at hosted production or have its safeguards removed.

Supabase is independent of Vercel, so database restoration can be managed separately from an application deployment, but it needs an available recovery source and may affect both Hub and Merch. [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups) describes plan-dependent options; it is not evidence that this project has them enabled. Restoration and data-loss acceptance belong to authorised technical support and the business owner.

### Vercel and domain sign-off

The expired management credential prevents verifying current team membership, project roles, live alias and rollback entitlement. Ask a company owner to sign in normally and demonstrate these; do not copy a token into a report. The salesperson is procedurally prohibited from using Vercel controls/secrets for routine edits, but existing membership/permissions remain unchanged and were not reverified; do not claim technical exclusion. Management arranges support when required. The technical release operator needs project/deployment access that includes rollback/promote and, where applicable, **Full Production Deployment**. Exact roles depend on the plan; retain company control of team ownership/billing and recovery. See [Vercel roles](https://vercel.com/docs/rbac/access-roles) and [project roles](https://vercel.com/docs/rbac/access-roles/project-level-roles).

Privately record the production domain, registrar, DNS provider, renewal date, payment owner, MFA recovery and two company custodians. Demonstrate that a successor can access them. A working URL or Vercel project does not establish registrar ownership.

Use the approved dashboard rollback procedure above and [Vercel's rollback guidance](https://vercel.com/docs/instant-rollback). The GitHub-recorded deployment from 4 November is only a candidate: the operator must identify the actual live version and validate a compatible known-good predecessor. Record the selected deployment before a release. Rollback does not undo database/external writes or establish that credentials/environment settings are correct. No rollback or deployment was attempted.

### Monday credential succession

Read-only evidence identifies the current token principal as Duncan, a non-admin Monday member. `MONDAY_API_TOKEN` is consumed by `mondaySalesCron.ts`, `snuggleProfit.ts`, `scripts/lib/monday/salesHistoryAudit.ts`, and the historical audit/sync CLIs. Inventory every production/preview/operator environment using these before departure. Monday personal tokens inherit the user's UI permissions; do not describe this token as intrinsically read-only or narrowly scoped. No verifiable expiry was established.

The company owner and technical support should perform this separately approved migration:

1. Choose a company-managed integration identity supported by the account's plan and policy, with only the required board/workspace access and documented company custody/recovery. Confirm Monday supports the chosen identity; do not assume a generic shared account is acceptable.
2. Use read-only queries to confirm identity and required board/schema access. Record responsible custodians privately, without recording the token. Do not trigger a sync to test permissions.
3. Obtain separate approval for replacing the server-only secret in each relevant environment and for any release needed to load it. Preserve a secure, time-limited rollback path until validation finishes. Regenerating a personal token invalidates the previous token immediately; plan that cutover explicitly.
4. Observe the next scheduled Monday run and Snuggle reads; check run history, skipped rows and representative values. Technical support approves any replay separately. After sign-off, the owner retires the old credential/account dependency and records ongoing renewal/access review responsibilities.

Scoped OAuth is an alternative for a managed custom integration, but this repository has no Monday OAuth issuance/refresh implementation. Introducing it is separate engineering work, not a maintenance shortcut. Transferring Monday's built-in automation ownership does not automatically replace this custom Hub token. No credential was rotated, environment setting changed or job invoked in remediation.

Sources: [Monday authentication](https://developer.monday.com/api-reference/docs/authentication), [choosing authentication](https://developer.monday.com/apps/docs/choosing-auth), [member departure guidance](https://support.monday.com/hc/en-us/articles/12348047493906-What-to-do-when-a-member-leaves-your-account).

## Historical technical-custody checklist — support reference only

Keep the access register and secret values in the company password manager, never this repository or an AI chat. App administrator access is separate from Vercel, Supabase and source-repository ownership.

- Assign a business owner, primary technical support contact and backup. Record their incident channel and availability privately; establish how urgent outages are handled.
- Confirm company-owned source-repository access, Vercel team/project ownership, billing, domain registrar/DNS access and deploy/rollback permission. Record the live domain, production branch and known working deployment privately.
- Confirm Supabase organisation/project ownership, billing, backup/PITR access, recovery contacts, Auth email-provider ownership and the ability to restore administrator access securely. Retain an approved alternate owner and MFA recovery arrangements.
- Transfer Monday board/workspace ownership and token stewardship, the report mailbox and NetSuite/EPCC delivery ownership, Google OAuth/Cloud project access, GA4 property access and federation/service-account administration. Technical support must coordinate replacement authorisations before deprovisioning the developer's accounts.
- Inventory production and preview configuration by **name and purpose**. Core names include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, server-only `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL` (site resolver also supports the Vercel production-host variable). Database-tooling names are `DIRECT_DATABASE_URL`, `RESTORE_DATABASE_URL`, `RESTORE_ADMIN_DATABASE_URL`.
- Integration names include `MONDAY_API_TOKEN`, `MONDAY_QUOTES_BOARD_ID`, `MONDAY_SNUGGLE_BOARD_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GMAIL_REPORT_ADDRESS`, `GA4_PROPERTY_ID`, `GCP_PROJECT_NUMBER`, `GCP_WORKLOAD_IDENTITY_POOL_ID`, `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID`, `GCP_SERVICE_ACCOUNT_EMAIL`, and `CRON_SECRET`. Check current source as well as `.env.example`; the example is not proof of complete live configuration. Keep OAuth credentials, database URLs, tokens and service-role keys server-only and out of logs.
- Assign backup monitoring, restore drills, failed/overdue job monitoring, credential renewal and subscription ownership. The runbook lists alerting/retention work as outstanding: do not assume someone receives automatic incident notifications.

Until these ownership and recovery checks are complete, the documents provide a maintenance process but do not establish operational readiness. Unresolved access or recovery gaps belong with the business owner and technical support, not an improvised AI repair.
