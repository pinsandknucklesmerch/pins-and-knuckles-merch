# PINS Hub — Final Production Handover Audit

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Reading notice — historical evidence and current policy

The dated entries below are retained as historical evidence, including their findings, priorities, verification results and original readiness conclusions. They are not fresh checks or current instructions to change access controls. The [final restricted-maintenance policy](RESTRICTED_MAINTENANCE_POLICY.md) is authoritative: existing GitHub/Supabase/Vercel permissions and settings remain unchanged, and earlier mandatory safeguard/ownership proposals are superseded as routine-maintenance instructions, not erased as historical recommendations.

Read the original failed-test and redirect findings with the **22 November 2026 remediation update**, which records passing local checks and a local repair. Neither that update nor the **23 November 2026 infrastructure assessment** establishes a later production release, current provider configuration or operational/security acceptance. “Current”, “fresh” and “now” in an entry refer to that entry's evidence date. Documentation preparation, receipt, operational readiness and open risks are separate in the [management report](FINAL_MANAGEMENT_HANDOVER.md).

Repository paths reflect the earlier documentation relocation where already updated; relocation is not new audit evidence. Keep private account/contact details and any signed receipt in private company records. No historical entry below is modified by this reading notice.

## Infrastructure assessment update — 23 November 2026

**NOT READY for independent handover.** See [Infrastructure remaining actions](INFRASTRUCTURE_REMAINING_ACTIONS.md) for the current evidence, exact numbered actions, owners and statuses. This update supersedes infrastructure readiness statements below; prior code verification and incident observations remain dated historical evidence.

- Fresh GitHub reads confirm a public organisation repository, default `main`, current operator Admin, one visible collaborator/organisation administrator, unprotected `main` and empty repository rulesets. Organisation rules remain inaccessible with current scope; no permissions were expanded.
- Fresh Supabase project inventory reports the linked project healthy. Backup/private Auth management access was unavailable through the existing keyring credential path. The prior backup response does not establish a usable recovery point; no current backup availability or restore entitlement is certified. The local August dump remains present and unvalidated. A guarded local/test restore runbook exists; a successful drill and provider-supported production recovery remain outstanding.
- Vercel project management again returns HTTP 403. GitHub deployment records include successful production status on 4 November, but do not establish today's production alias, effective configuration or a known working rollback target. Domain/registrar control and renewal custody remain unverified.
- Monday metadata confirms the active credential belongs to the departing developer, a non-admin member. Both sales synchronisation and Snuggle depend on it. Company-managed identity selection, approved cutover and observed acceptance remain open.
- Password recovery source exists, including the local redirect validation repair. Current deployment, private email/URL configuration, delivery and separate-browser administrator/recipient acceptance remain unverified. Shared Supabase Auth changes require checking both Hub and Merch.

Management must appoint company owners, an alternate and technical support. Technical support owns maintenance, diagnosis, training, provider configuration and recovery; the salesperson owns safe reporting and ordinary business acceptance. No maintenance, troubleshooting or training responsibilities are assigned to the departing developer.

This assessment changed documentation only. Tests, lint, typecheck, build and database checks were **NOT RUN** by request. No production changes, jobs, account changes, rotations, migrations, restores, rollbacks, commits, pushes, merges or deployments occurred. Sensitive access evidence and completion records belong in a private company operations register, not this public repository.

## Remediation update — 22 November 2026

**NOT READY for independent handover. Local verification is now passing; ownership, recovery and live authentication acceptance remain blockers.** This update supersedes the open code/test findings below. The original audit is retained as historical evidence. Changes are local and have not been pushed, merged or deployed; no production configuration, data, permissions or credentials were changed.

### Repairs and root causes

| Baseline failure | Repair and preserved contract |
| --- | --- |
| `salesKpiHistoryImport.test.ts` | Workbook moved to `ai-context/planning/Monthly Compare.xlsx`. Corrected the test and operational CLI read path, retained source-value/count assertions and added a local-only CLI preview regression: 59 company rows, 54 member rows, no blocking errors. No import rules or remote writes changed. |
| `hubNavigation.test.ts` | Exact inventory omitted the existing Sales Checklist and Quick Reference routes. Updated the expected inventory; no navigation code changed. |
| `inviteSubmission.test.ts` | Validation-order check matched an imported function name before the action. AST checks now locate the actual invite action, its immediate invalid-input return and subsequent client/access/provisioning calls. Runtime input validation coverage remains. |
| `dashboardNavigation.test.ts` | Shell expectation omitted the existing access prop. Matched current wiring without changing the route. |
| `liveZooCam.test.ts` | Registry expectation omitted the existing checklist slide. Matched the registry and checked default settings against its complete IDs. |
| `metricsExport.test.ts` | Assertions targeted the previous component structure. Updated checks for the existing export workspace, canonical data/template props and EPCC access wiring; retained export isolation, purity, serialization and geometry coverage. Browser export acceptance is still required. |
| `salesInboxMetrics.test.ts` | Contradictory expectation used decided enquiries as the denominator. Preserved the current converted / total-enquiries calculation; test now proves decided metadata does not change the result and verifies missing/zero total denominators. Matched the current Active Marketing heading. No financial/KPI source changed. |

An additional full-suite run exposed a Node module-format warning in `mondaySalesDashboardSync.test.ts` on its subprocess import. The test now explicitly selects ES module mode; the import and empty-stderr assertions remain. No warning/error suppression or coverage removal was used.

The recovery helper previously accepted `/\\example.com`, which URL parsing treats as another origin. It now rejects backslashes and control characters, requires a local root-relative path, and verifies the parsed origin. Unsafe destinations fall back to `/auth/update-password`; legitimate local paths, queries and fragments are preserved. Regression tests cover unsafe destinations, parser fallback and legitimate paths. OTP verification, PKCE exchange, sessions, administrator/organisation checks and recipient password selection are unchanged. This closes the demonstrated local-source defect; production is not assumed to contain the repair.

### Verification after the final code attempt

| Exact command | Result | Evidence |
| --- | --- | --- |
| `npm test` | **PASS** | Exit 0: 496 tests passed, 0 failed, 0 skipped. |
| `npm run lint` | **PASS** | Exit 0. |
| `npx --no-install tsc --noEmit` | **PASS** | Exit 0 with the installed compiler. |
| `npm run build` | **PASS** | Exit 0, including compilation and page generation. Build does not deploy. |
| `npm run db:test` | **PASS** | Exit 0; authorised `SELECT 1` only. Not a backup/restore or permissions test. |

All five checks ran after each code attempt. The initial unchanged baseline reproduced the seven file failures. First-attempt sandbox tests could not capture the new CLI subprocess output; an unchanged network-enabled rerun passed that regression and exposed the separate module-mode warning described above. The final full suite and build ran with approved sandbox escalation; no checks were bypassed. Final logs: `/tmp/pins-hub-remediation-attempt2-{tests,lint,types,build}.log`; database result was observed directly. These temporary logs are not durable release evidence. Retain sanitised results with the eventual reviewed release. The existing parent-lockfile build warning remains; no deployment configuration was changed.

### Infrastructure findings and required sign-off

Fresh read-only checks still show repository ADMIN access for the current operator and unprotected `main`. The prior audit found only Duncan as a visible collaborator/organisation administrator; organisation rulesets remain unverified. No access or safeguards were changed. See the [manual access setup](TECHNICAL_HANDOVER.md#successor-access-and-protected-changes) for minimum successor permissions and the proposed approval workflow. There is still no repository CI workflow to enforce the five checks automatically.

Refreshed Supabase backup metadata still reports `backups: null`, `pitr_enabled: false`, `physical_backup_data: {}` and `walg_enabled: true`. This does not establish a reliable recovery source. No backup was created or restored. Vercel management remains unverified with the expired credential; the recorded deployment candidate below is not certified as the current or last-known-good production deployment.

**Required manual actions, in priority order:**

1. Business owner: appoint technical support and an alternate company-controlled owner; demonstrate GitHub, Vercel, Supabase, registrar/DNS, billing and MFA recovery access. Configure protected changes before giving the salesperson Write access. Keep sensitive operational reports private because this repository is public.
2. Supabase owner/support: establish a current usable backup, off-machine custody/retention, acceptable data loss and downtime, and an isolated restore drill. Plan/PITR upgrades need separate cost approval; none were enabled.
3. Technical support: review the local patch, retain all five PASS results, complete focused browser/export checks, and arrange a separately approved release. No release approval is implied by this report.
4. Auth owner: inspect actual recovery template, Site URL, allowlist and email provider with both Hub and Merch in mind. Obtain approval for designated-account emails; test administrator and self-service reset, cross-browser password choice, old-password rejection, expired/reused links, sender-session preservation and permission boundaries. These live checks are **NOT RUN**.
5. Integration owner: migrate Duncan's Monday credential under the supervised procedure in the handover before disabling his account. Confirm report mailbox/OAuth, Cloud/GA4, job monitoring and renewal custody. No tokens were rotated and no jobs triggered.
6. Supervisor and employee: complete the support guide's onboarding exercise, record the incident contacts and prove the employee knows when to stop. These human checks are **NOT RUN**.

The local repairs remove the seven baseline test failures and the demonstrated redirect defect. They do not establish production recovery, company ownership or end-to-end recovery-email delivery. The remaining blockers require authorised humans and technical support.

### Files changed in remediation

- Source/scripts: `src/features/auth/lib/recoveryConfirmation.ts`, `scripts/import-sales-kpi-history.ts`.
- Tests: `scripts/tests/salesKpiHistoryImport.test.ts`, `scripts/tests/mondaySalesDashboardSync.test.ts`, `src/config/hubNavigation.test.ts`, `src/features/auth/tests/recoveryConfirmation.test.ts`, `src/features/team/tests/inviteSubmission.test.ts`, and `src/features/sales-dashboard/tests/{dashboardNavigation,liveZooCam,metricsExport,salesInboxMetrics}.test.ts`.
- Documentation: `ai-context/FINAL_HANDOVER_AUDIT.md`, `ai-context/TECHNICAL_HANDOVER.md`, `ai-context/HUB_SUPPORT_GUIDE.md`, `README.md`, `ai-context/imports/sales-kpi-history/README.md`.

Existing administrator-reset work and unrelated worktree changes were preserved. `AGENTS.md` and `ai-context/SALES_AI_CONTEXT.md` already route maintenance sessions to the strict approval/verification workflow and were not changed in remediation. Documentation updates followed the successful code verification; no further code changes were made.

---

## Original audit snapshot

Audit completed: 22 November 2026, Africa/Johannesburg. Verification began before a session interruption; incomplete build/database commands were checked and rerun. This report separates local source evidence, authenticated live observations, and checks still requiring an owner or a human participant.

**Handling:** the GitHub repository is public. Keep this operational/security audit private until the business owner reviews its handling. Nothing was pushed, merged, deployed, rolled back, or changed in production. No reset emails were sent, jobs replayed, permissions changed, credentials rotated, or migrations executed. Existing application work was preserved.

## Executive summary

**NOT READY for independent handover to a non-technical employee.** This is a handover-readiness assessment, not a claim that the live Hub is unavailable. A recorded production deployment serves its login page; recent EPCC/Monday jobs succeeded; database connectivity and the production build passed. However:

1. The full test workflow fails in seven files before any audit changes.
2. GitHub currently has only one visible organisation administrator and repository collaborator: `DistortionZA` (Duncan). No successor access was demonstrated.
3. Supabase backup metadata reports `pitr_enabled: false` and `backups: null`. No usable current production recovery point or restore drill was established. The only local dump observed is dated 11 August 2026.
4. The Vercel credential is expired and API requests return 403. Current project ownership, production settings and rollback access remain unverified.
5. An existing recovery redirect validator accepts backslash paths that resolve to another origin. Authentication changes require technical security review, not an employee-approved cosmetic repair.
6. The administrator reset mechanism is compatible with the existing token-hash recovery path, but the actual recovery template, Site URL, redirect allowlist and email delivery still need live confirmation and a controlled browser/email exercise.
7. The working Monday token is tied to Duncan's account. Gmail, Google Cloud/GA4, domain and billing continuity are not established merely by working credentials.

No application code or tests were edited to conceal these findings. Small documentation improvements link the existing handover to this final evidence and clarify the known recovery risk.

## Verification results

The workflow comes from `package.json`, `AGENTS.md`, the test-loader scripts, ESLint/TypeScript configuration and the handover policy. No combined `verify` script or repository `.github` CI workflow was found. The configured `npm test` command is:

```text
node --experimental-strip-types --import ./scripts/register-test-alias.mjs --test "src/**/*.test.ts" "scripts/**/*.test.ts"
```

Runtime observed: Node `v22.23.1`, npm `10.9.8`.

| Exact check command | Result | Evidence / limitation |
| --- | --- | --- |
| `npm run lint` | PASS | Completed with exit 0. Repeated during the resumed audit without reported lint errors. |
| `npx --no-install tsc --noEmit` | PASS | Completed with exit 0 using the installed compiler. `--no-install` prevents fetching a different compiler. |
| `npm test` | FAIL | Exit 1, reproduced on the unchanged application: 88 file-level results, 81 passing and 7 failing. This count is not a count of every nested assertion. |
| `npm run build` | FAIL on sandbox attempt; PASS on network-enabled retry | Initial exit 1 was a Google Fonts/Geist fetch failure. The identical build with permitted network access completed with exit 0, including compilation, TypeScript and page generation. |
| `npm run db:test` | FAIL on sandbox attempt; PASS on network-enabled retry | Initial exit 4 was DNS resolution failure. The existing script then completed `SELECT 1` with exit 0 against the configured connection. This is not a restore test. |

The build warned that Next.js inferred the workspace root from a parent lockfile at `/home/duncan/package-lock.json`. The repository lockfile also exists. This did not prevent the successful build; no root/build configuration was changed to suppress the warning. Builds currently depend on reaching Google Fonts.

Local diagnostic logs were captured under `/tmp/pins-hub-final-audit-tests.log`, `/tmp/pins-hub-final-audit-build.log`, `/tmp/pins-hub-final-audit-build-network.log` and focused `/tmp/pins-hub-audit-*-test.log` files. These are temporary workstation artifacts, not retained release evidence. The command results above are recorded here because temporary logs may disappear.

### Failing baseline tests and diagnosis

Focused reproduction used the existing loader, for example:

```text
node --experimental-strip-types --import ./scripts/register-test-alias.mjs scripts/tests/salesKpiHistoryImport.test.ts
node --experimental-strip-types --import ./scripts/register-test-alias.mjs src/config/hubNavigation.test.ts
node --experimental-strip-types --import ./scripts/register-test-alias.mjs src/features/team/tests/inviteSubmission.test.ts
node --experimental-strip-types --import ./scripts/register-test-alias.mjs src/features/sales-dashboard/tests/salesInboxMetrics.test.ts
node --experimental-strip-types --import ./scripts/register-test-alias.mjs src/features/sales-dashboard/tests/dashboardNavigation.test.ts
node --experimental-strip-types --import ./scripts/register-test-alias.mjs src/features/sales-dashboard/tests/liveZooCam.test.ts
node --experimental-strip-types --import ./scripts/register-test-alias.mjs src/features/sales-dashboard/tests/metricsExport.test.ts
```

| Failing file | Observed cause | Disposition |
| --- | --- | --- |
| `scripts/tests/salesKpiHistoryImport.test.ts` | Reads `ai-context/Monthly Compare.xlsx`; the workbook is now under `ai-context/planning/Monthly Compare.xlsx`. The old path is not found. | Existing fixture/path drift. Review operational import defaults as well as the test before correcting it. |
| `src/config/hubNavigation.test.ts` | Exact expected navigation inventory omits current Sales Checklist and Quick Reference entries. | Existing expectation drift; confirm the approved navigation rather than remove working routes to satisfy a test. |
| `dashboardNavigation.test.ts` | Source-structure assertion does not match the current server query/initialisation wiring. | Existing source-contract mismatch. Confirm behavior before updating assertions. |
| `liveZooCam.test.ts` | Exact TV slide inventory differs from the current registry, which includes checklist-related changes. | Existing expectation drift, not evidence by itself that the stream is unavailable. |
| `metricsExport.test.ts` | Several source-shape assertions no longer match export controls, memoisation and EPCC report/route wiring. | Existing UI/report contract drift. Export behavior needs a focused browser check, not deletion of assertions. |
| `salesInboxMetrics.test.ts` | A test expects zero when decided enquiries is zero, while current code uses total Sales Inbox enquiries: the fixture produces 25, not 0. Other assertions in the file use the total-enquiries definition. A heading assertion also differs from the current component. | Business-definition/expectation conflict. Do not change financial/KPI behavior or silently redefine the test during non-technical maintenance. |
| `src/features/team/tests/inviteSubmission.test.ts` | `source.indexOf("createAdminClient")` matches its import before the action, making the validation-order assertion fail. Source inspection shows input validation at the start of the invite action. | Brittle static test, not proof that the invalid submission reached Auth. A technical maintainer should replace it with a meaningful invocation-boundary check. |

All these failures were present before any audit edits; no application changes were made during the audit, so no new application regression was introduced by an attempted fix. No checks were disabled, tests removed, expectations relaxed, or financial/authentication behavior altered. Technical support must resolve the intended contracts and rerun the entire configured workflow before release sign-off.

## Infrastructure and ownership

| Service | Verified read-only evidence | Remaining access / ownership risk |
| --- | --- | --- |
| GitHub | Existing account is `DistortionZA`, with repository ADMIN and active organisation-admin membership. Repository `pinsandknucklesmerch/pins-and-knuckles-merch` is public; default branch is `main`. The administrator list and collaborator list each returned only this account. | Sole visible administrator/collaborator is a succession blocker. Company-controlled organisation naming does not establish company recovery/MFA/billing custody or successor access. |
| GitHub safeguards | `main` protection endpoint explicitly returned “Branch not protected”; repository rulesets returned `[]`. | Organisation rulesets could not be inspected: the token lacks the required `admin:org` scope. Do not assume a mandatory CI/review gate exists. Do not expand token permissions automatically. Owner must review visibility, branch safeguards and publication of this audit. |
| Vercel | `.vercel/project.json` links project `pins-and-knuckles-merch` (`prj_tVCNHRhMaYzZQMHmPxDDaa8Ju0Rd`) to team `team_wjH8m9bFVkAl9qxox7Tq862e`. GitHub records Vercel deployments. | Existing Vercel token metadata expired on 27 October 2026; account/team/project/member/domain/environment/deployment API reads returned 403. Current team owners, plan, production configuration, deploy restrictions and rollback access are NOT VERIFIED. No credential refresh or configuration change was attempted. |
| Supabase | Authenticated CLI lists linked project `pins-merch-prod`, ref `vggajzzagwzgmddnytle`, in accessible organisation `PinsAndKnucklesMerch` (`levsjmnhybehdnxouavi`). Database connectivity succeeds. | Ability to list the project is not proof of organisation ownership, billing control, MFA recovery or successor permissions. Organisation-member roles and private Auth configuration were not obtainable through the available read-only CLI/config paths. A separate keyring-based management read could not obtain a usable credential; no new login/access grant was created. |
| Domain/DNS | The GitHub-recorded deployment URL resolved and its `/login` returned HTTP 200 over HTTPS. | The live custom domain, registrar, DNS account, renewal/billing owner and company recovery access remain unconfirmed. A working Vercel URL is not proof of registrar ownership. |
| Email | Existing Gmail OAuth refresh succeeded; the configured report mailbox profile was accessible and matched the configured address. Only its `gmail.com` domain was recorded. | Mailbox recovery, company custody and OAuth client ownership remain unverified. This Gmail ingestion check is separate from Supabase password-reset email delivery. |
| Monday | A read-only `me` query succeeded. Token principal is Duncan, a non-admin member of account `Pins & Knuckles Merch`. Snuggle Orders board metadata is accessible and active. | Confirmed developer-account dependency. Arrange continuity before deactivating that user. Token expiry and account/workspace ownership were not verified. |
| Google Cloud / GA4 | Source uses Vercel OIDC, Workload Identity Federation, service-account impersonation and GA4 read-only scope. | Local GCP/GA4 configuration names were absent and the local OIDC token expired in July. Production configuration and Cloud/GA4 owners were inaccessible, so this is NOT a finding that live Analytics is broken. |

### Production deployment candidate

The latest successful **Production deployment recorded in the inspected GitHub deployment history** is ID `7549246013`, created 4 November 2026 at 14:50 UTC, revision `78ce106704b59e60fd88be3674efc7c2d8242716`. Its recorded status is `success` (“Deployment has completed”). Remote `main` points to the same revision, committed at 14:49 UTC that day.

Recorded URL: `https://pins-and-knuckles-merch-57o0sb7lu-pins-and-knuckles-merchandise.vercel.app`. The login page returned HTTP 200. This is a rollback **candidate**, not a certified last-known-good application version: authenticated workflows were not exercised, and the expired Vercel credential prevents checking whether later manual deployments or alias changes exist. The latest local administrator reset work must not be assumed deployed simply because it exists in this checkout.

## Authentication

### Administrator reset source review

The source review confirms the following in `src/features/team/actions/users.ts` and its existing access helpers:

- `adminContext()` requires an authenticated user, administrator capability and an organisation membership. `requestUserPasswordReset()` additionally requires active membership.
- Target membership lookup uses both membership ID and the actor's organisation ID. A caller-supplied email is not used to choose the recipient.
- Owner/Developer targets require `canManageOrganisationUsers`; a normal Hub administrator cannot bypass that restriction merely by calling the server action directly.
- The registered address is fetched from Supabase Auth by user ID on the server. The isolated, server-only service-role client is reused; its key and response tokens are not returned to the browser.
- The action calls the shared `sendPasswordRecoveryEmail` helper. It does not set a temporary password, update privileges, or consume the recipient's recovery link in the sender's browser. Provider errors become generic user-facing messages.
- The existing menu uses a named confirmation dialog, pending state and success/failure feedback. Recipient password selection remains in the existing authenticated update-password form; recovery signs out afterward, while invite completion retains its separate mode.

These are source findings, not an end-to-end confirmation of deployed reset delivery. Existing auth/recovery tests pass within the overall failing suite, but there is no demonstrated dedicated live administrator-reset acceptance result.

### Live recovery configuration: partially verified

The public Supabase Auth settings endpoint returned email enabled, signup enabled (`disable_signup: false`) and email auto-confirm disabled. Signup does not itself prove that Hub membership/access is granted. The private recovery template, Site URL, redirect allowlist, SMTP setup, expiry/rate limits and production site-resolver environment remain **NOT VERIFIED**. The installed CLI exposes configuration push, not a safe configuration-read command; it was not used to change settings.

The isolated administrator sender requires a recovery link that works without a PKCE verifier in the administrator's browser. Existing `/auth/recovery-confirm` plus its POST verification route supports Supabase token-hash verification; the update-password page then allows the verified recipient to choose a password. Technical support must check that the actual email template uses the intended token-hash route and `type=recovery`, and that Site URL/redirects match the real Hub domain. See the template example in [TECHNICAL_HANDOVER.md](TECHNICAL_HANDOVER.md). Do not assume the default confirmation template is sufficient.

### Existing redirect-validation issue — escalate

`getSafeAuthNextPath()` in `src/features/auth/lib/recoveryConfirmation.ts` accepts paths starting with `/` except `//`. It does not reject backslashes. A local, network-free check confirmed that `/\example.com` passes this guard, while URL parsing relative to `https://hub.example` produces `https://example.com/`. Both confirmation routes use the resulting path for redirects.

This contradicts the intended local-only redirect boundary. It demonstrates an open-redirect risk, not proven recovery-token theft. No crafted link was sent to anyone and no live recovery session was created. Technical support should validate origin-safe redirect handling and add regression coverage before independently maintained production sign-off. No authentication code was changed during this audit.

### Human/browser acceptance still required

NOT RUN: controlled reset email delivery; opening the newest link in another browser; choosing a password; checking old-password rejection; expired/reused-link handling; administrator session preservation; non-admin/cross-organisation/privileged-target rejection; and existing invitation/self-service recovery regression checks. Use designated test accounts and obtain explicit approval before sending any email, especially to a real user. No connected authenticated browser was available during the audit.

## Backups and recovery

### Verified capabilities and limits

- A read-only database transaction compared migration metadata: 59 local versions and 59 remote versions, with no missing or extra versions. It observed 106 public policies and the required EPCC ingestion, Monday lock/release and checklist reset functions. Matching version IDs and function existence do not prove migration file checksums, every policy's correctness or every grant/signature.
- There is no `supabase/config.toml` in this checkout. Use source/migrations for intended behavior and owner-confirmed live settings for operational truth.
- `supabase backups list --project-ref vggajzzagwzgmddnytle --output json` returned `pitr_enabled: false`, `backups: null`, `physical_backup_data: {}`, region `eu-west-1`, and `walg_enabled: true`. No restorable backup entry or recovery window was established. WALG enabled is not proof of a usable current backup or retention entitlement.
- The only observed local dump was `backups/database/pins-hub-2026-08-11_12-44-27.dump` (739,296 bytes). Its contents/recoverability were not tested and no off-machine copy, encryption, retention or ownership was verified.
- `db:backup` uses `pg_dump` and writes a local custom-format dump. It does not schedule, encrypt or copy backups off the developer's machine.
- `db:restore` is destructive and guarded for a disposable local/test target. It resets public objects and required Auth user data, while excluding sessions, refresh tokens, MFA, other managed platform state, Storage objects and external configuration. It is not the production restoration procedure. No restore was attempted and no safeguard removed.

Supabase is hosted separately from the Vercel application, so database recovery and application rollback are different operations. Actual production restoration depends on Supabase access and a usable recovery source; neither a successful application build nor returning to an old deployment recreates missing records. Both Hub and the separate Pins Merch application share backend contracts, increasing the impact of a database incident.

### Plain-English incident recovery

| Incident | Employee action | Technical-support action |
| --- | --- | --- |
| Broken deployment | Stop retries, record when it started and the affected page, contact support/owner. Do not press deploy/rollback yourself. | Identify the actual live deployment and a tested compatible predecessor. Obtain approval, use Vercel's supported rollback/promotion, then check login, affected workflows and jobs. The GitHub candidate above needs validation first. |
| Accidental local code change | Stop editing. Ask Codex to list only its changes and proposed undo steps. Leave the live site alone. | Preserve unrelated work, review and undo only the accidental patch, then run all configured checks. Do not reset the whole working tree or push automatically. |
| Failed integration | Record the failing view, time and message. Do not manually replay a sync. | Compare last successful job, upstream availability and credential/board/mailbox access. Correct the actual cause through approved procedures; assess idempotency and missed periods before any separately approved replay. |
| Authentication issue | Use the ordinary recovery UI only as appropriate; check the newest email/spam and contact an authorised administrator. Never share passwords or reset links. | Check Auth service/email configuration, membership and permissions, token flow and the redirect issue. Use controlled accounts for regression testing; do not bypass login or create a shared temporary password. |
| Incorrect dashboard data | Record period, metric, source example and expected value. Do not overwrite Final Values to conceal the issue. | Determine whether source ingestion, a skipped row, history fallback, an override or calculation is responsible. Obtain business approval of the intended financial/KPI definition before changing anything. |
| Database incident | Notify owner/support immediately; preserve evidence and stop approving improvised repairs. | Assess shared-app impact; approve any necessary write pause; preserve current state; confirm backup/recovery point and data-loss window with Supabase. Validate in isolation where possible, restore only through the supported approved process, reconcile jobs and both applications, then reopen service. |

If support cannot identify a usable recovery point or obtain ownership access, escalate to the service provider and business owner. Do not improvise destructive SQL, edit migration history, remove restore guards or assume the old local dump is sufficient.

## Integrations

| Dependency | Source/configuration | Read-only live result / remaining risk |
| --- | --- | --- |
| Monday sales | `MONDAY_API_TOKEN`; board mappings/discovery in `scripts/lib/monday`; current-UTC-month job with organisation/period lock. Quotes, orders and sales-inbox values are kept separate from EPCC profit. | Token account query succeeded; principal is Duncan. Latest observed run succeeded on 22 Nov at 08:56:47–08:56:57 UTC for November. Source mappings and successor access still need stewardship. |
| EPCC Gmail | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GMAIL_REPORT_ADDRESS`; existing parser/reconciliation and `ingest_epcc_monthly_profit_and_members` RPC. | Normal OAuth access-token exchange and read-only mailbox profile succeeded. No refresh credential was replaced or persisted. Latest observed ingestion succeeded on 22 Nov at 08:42:14–08:42:18 UTC. Mailbox/client ownership and refresh-token expiry remain unknown. The returned short-lived access-token lifetime is not the refresh-token expiry. |
| Snuggle | `MONDAY_SNUGGLE_BOARD_ID`, the same Monday token, board/workspace checks and cached read path. | Configured `Snuggle Orders` board was active and accessible. No item data was modified. Correct profit values and full report rendering were not verified. |
| GA4 | `GA4_PROPERTY_ID`, `GCP_PROJECT_NUMBER`, workload identity pool/provider IDs, `GCP_SERVICE_ACCOUNT_EMAIL`, Vercel OIDC and Google permissions. | Local config incomplete and local OIDC expired; production not inspected because Vercel access failed. No credential fallback was introduced. Requires deployed diagnostics and owner access. |
| Live Zoo Cam | External embedded-player/fallback configuration in the TV slide. | Additional display dependency found; browser stream/embedding availability NOT RUN. It has no dedicated scheduled job or business-data ingestion. |

The source declares the following Vercel jobs; times are UTC, with South African time in parentheses:

| Route | Schedule | Purpose and failure indicators |
| --- | --- | --- |
| `/api/cron/epcc-profit` | `5 8 * * *`: daily 08:05 (10:05) | Applies report ingestion. Check failed/missing/overdue `cron_run_history`, Gmail/provider failures and report validation. |
| `/api/cron/monday-sales-sync` | `15 8 * * *`: daily 08:15 (10:15) | Syncs the current month. Rejected/overlapping runs are failures; recoverable skipped rows can coexist with a successful run and need review. |
| `/api/cron/sales-checklist-rollover` | `0 7 * * 1`: Monday 07:00 (09:00) | Calls `reset_all_sales_checklists`. It does not use the EPCC/Monday history wrapper; inspect authorised Vercel function logs and expected statuses. Live execution was not checked or triggered. |

All three use server-only bearer `CRON_SECRET`; they are mutating GET routes, not diagnostic URLs. `SUPABASE_SERVICE_ROLE_KEY` is required for privileged database operations and must remain server-only. Site URL resolution and all production environment targets must be checked in Vercel; local variable presence does not prove production configuration. The eight most recent EPCC/Monday history rows observed were successful, spanning 19–22 November. This confirms recorded outcomes, not every underlying business value or automatic alert delivery.

Credential expiry verified: stored Vercel API token expired; local OIDC expired. Monday and Google refresh-credential expiry were not discoverable from the read responses. No password, token, key, connection-string or raw report content is included in this report.

## Required manual actions

### Priority 0 — before the developer leaves

- [ ] **Business owner:** appoint a named technical support contact and backup. Store contact details, company account recovery and MFA arrangements in the company password manager; give the employee a simple incident contact route.
- [ ] **Owner + GitHub administrator:** demonstrate successor access. Resolve the single visible administrator/collaborator dependency; review public visibility and handling of this audit. Review branch/review/CI safeguards with an authorised technical person. Do not change them through an unsupervised maintenance session.
- [ ] **Owner + Vercel owner:** sign in normally, confirm the correct project/team, actual production domain/revision, owners, billing, runtime/environment targets, scheduled jobs and rollback permissions. Identify and manually validate a known working deployment. The stale local credential is not proof of current access.
- [ ] **Owner + Supabase support/technical support:** confirm company owner/successor access and an available current backup. Review why the backup list returned no entries and PITR is off. Agree acceptable data loss/downtime, protected off-machine retention, and an approved restore drill. Do not ask the sales employee to restore production.
- [ ] **Technical support:** resolve the existing failing test contracts without disabling checks or making unapproved financial changes. Rerun tests, lint, typecheck, build and the authorised database check, then retain their results.
- [ ] **Technical support:** review and repair the local-redirect validation issue with regression coverage and separately approved release. Do not send crafted links to staff to demonstrate it.

### Priority 1 — required operating sign-off

- [ ] **Auth owner + technical support:** inspect Supabase recovery template, Site URL, allowed redirects, SMTP provider/ownership and email limits. Verify the administrator sender's production site resolver. Authorise designated test-account emails and complete the browser acceptance list above; record who witnessed it.
- [ ] **Integration owners:** demonstrate company custody/recovery of Monday, report Gmail/OAuth, Google Cloud federation/service account and GA4 property. Address the Duncan-owned Monday token before deprovisioning his account. Record renewal responsibilities and verifiable expiries privately; do not paste secrets into Codex.
- [ ] **Business owner:** confirm domain registrar/DNS and renewal/billing access, not merely the website URL.
- [ ] **Technical support:** inspect actual deployed cron schedules, checklist execution and error logs. Assign someone to receive/review failure and overdue alerts; history rows alone are not an alerting process.
- [ ] **Maintainer + supervisor:** complete the exercise below and a safe manual smoke test of login/recovery, selected dashboard values, a trusted calculator example and relevant exports. A passing build is insufficient.

## Maintainer onboarding

Perform this exercise with technical support present. It is **NOT RUN** by this audit and requires a human sign-off; use no customer data and approve no production writes.

1. **Start Codex:** open it on the company support computer, select the PINS Hub repository folder, and confirm `AGENTS.md`, `ai-context/SALES_AI_CONTEXT.md` and `ai-context/HUB_SUPPORT_GUIDE.md` are visible. The current workstation path is `/home/duncan/Work/pins-and-knuckles-merch`; the successor's computer may use a different path.
2. **Request read-only diagnosis:** paste the guide's support prompt, identify yourself as the non-technical maintainer, and use a simulated report such as “A demonstration label appears wrong; do not edit files or touch production.” Supply expected/actual behavior and a safe screenshot/example. Clearly label it as an exercise.
3. **Review the response:** ask for evidence, uncertainty, affected files, exact checks and proposed undo steps. With a simulated/unreproducible symptom, the correct response is a diagnostic plan or a request for evidence—not an invented fix. Have the supervisor explain unfamiliar words.
4. **Verify the approval boundary:** explicitly withhold code approval. Ask Codex to state that it has not changed source and will wait for approval of a specific minor correction. If a real harmless local fix is later chosen by the supervisor, approve only that fix and require all five check results; release remains a separate technical task.
5. **Verify escalation:** ask whether it would change VAT, bypass login, edit database records or push a deployment to solve the example. It must stop that proposal and direct you to technical support. Ask it to prepare the concise incident summary instead.

Success means the employee can repeat these steps, distinguish PASS/FAIL/NOT RUN, explain why production safety needs more than a build, and identify a reachable technical contact. Record the supervisor/date privately. Familiarity with Git or programming is not required.

## Final readiness assessment

**NOT READY.** Current evidence supports a functioning deployed login page, recent ingestion activity, migration-version parity, database connectivity and a buildable local application. It does not close the failed verification suite, sole-developer ownership dependencies, unverified current backup/recovery source, inaccessible Vercel management, recovery-path security issue, or unverified reset-email configuration and browser acceptance.

Reassess after the priority actions have named owners and evidence. READY WITH RISKS is appropriate only when release checks and critical ownership/recovery/security needs are satisfied and remaining risks are explicitly accepted by the business owner. A sales employee with Codex is not a substitute for technical incident and recovery ownership.
