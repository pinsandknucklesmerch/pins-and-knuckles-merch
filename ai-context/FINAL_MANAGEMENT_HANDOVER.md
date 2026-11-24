# Pins Hub — Final Management Handover and Acknowledgement

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

Prepared for management delivery: 23 November 2026  
Evidence reviewed: repository handover records dated 19, 22 and 23 November 2026.  
Receipt: **not recorded**. Operational and security readiness: **not established**.

## Executive summary

Pins Hub is the internal Pins & Knuckles operations application. Its documented functionality includes sales dashboards and reporting, regional calculators, reference data, sales checklists, commercial invoices and tax tools, profiles, user access, analytics and diagnostics. Supabase supplies the shared Hub/Merch backend; Vercel hosts the application; Monday, report email and Google services support integrations.

The documentation is **prepared and ready for delivery to management**. This statement concerns the document package, not confirmed receipt, a completed account transfer, production release, live business acceptance or technical protection. The existing records do not establish operational readiness or closure of the infrastructure risks below.

The final maintenance policy authorises specifically approved minor text, label and styling changes within existing functionality. Codex must refuse prohibited work and refer it to management or appointed technical support. Existing GitHub, Supabase and Vercel permissions and configuration remain unchanged. No mandatory CODEOWNERS, branch protections or new infrastructure safeguards are introduced.

These are **procedural restrictions, not technically enforced security boundaries**. Actual account privileges may permit more than the policy authorises. The policy does not make Supabase inaccessible, remove credentials, enforce review or prevent an automatic deployment. Management arranges technical support when required. The departing developer has no ongoing maintenance, troubleshooting, training or support obligation.

## 1. Evidence and document authority

1. [RESTRICTED_MAINTENANCE_POLICY.md](RESTRICTED_MAINTENANCE_POLICY.md) is authoritative for current salesperson maintenance scope and workflow, read with root [AGENTS.md](../AGENTS.md).
2. [SALES_AI_CONTEXT.md](SALES_AI_CONTEXT.md) implements those limits for Codex; the six operating guides explain them for daily use.
3. [FINAL_HANDOVER_AUDIT.md](FINAL_HANDOVER_AUDIT.md) retains dated evidence and original conclusions. Its earlier safeguard proposals are historical and superseded as current maintenance instructions. Its original failed-test/redirect findings must be read with the 22 November local-remediation update.
4. The technical handover and infrastructure register are support references and risk disclosures. They are not approval to alter accounts or infrastructure or mandatory conditions for signing documentation receipt.
5. This cleanup used the existing documents only. No code, provider, deployment or account state was reverified, and no new operational acceptance is claimed.

## 2. Completed development and documentation supported by records

| Work recorded | Supporting evidence | Qualification |
| --- | --- | --- |
| Existing application functionality and architecture documented | Technical handover and feature references describe the modules, data/access boundaries, reporting, integrations and schedules. | Repository-documented functionality is not a fresh live acceptance result. UK Standard remains documented as a scaffold without a pricing engine; calculator drafts are not saved. |
| Local remediation of seven baseline test-file failures | Audit remediation update, 22 November 2026: workbook-path and test-contract/expectation corrections, with existing behaviour preserved as described there. | Local changes were recorded, not an approved production release. |
| Local password-recovery redirect repair | The same update records rejection of unsafe redirect paths and regression coverage. | A local repair does not establish deployment, email delivery or complete live recovery acceptance. |
| Additional test subprocess module-mode correction | Audit remediation update records the correction while retaining assertions. | No current execution or release certification is inferred. |
| Infrastructure assessment and open-action documentation | Audit and infrastructure records dated 22–23 November 2026. | Observations and access limits remain dated. No backup/restore, rollback, ownership transfer, credential cutover or safeguard activation is certified. |
| Salesperson and management documentation prepared | Six guides, final policy, Codex instructions, support guide, technical references, risk register and this acknowledgement. | Files are available in the working copy. Named recipient delivery/read-through and operational acceptance are not recorded. |

### Recorded verification results

The audit's **22 November 2026 final remediation update** records the following completed results:

| Recorded command | Recorded result | Limit |
| --- | --- | --- |
| `npm test` | PASS — 496 tests passed; zero failed and zero skipped. | Historical local result for the audited files. |
| `npm run lint` | PASS — exit 0. | Not rerun for this cleanup. |
| `npx --no-install tsc --noEmit` | PASS — exit 0. | Not certification of later code or a different deployed revision. |
| `npm run build` | PASS — exit 0. | A build is not a deployment. |
| `npm run db:test` | PASS — authorised connectivity query only. | Not a backup, restoration, permissions or business-correctness test. |

The original audit also records earlier failures and environmental retries. Those records remain valid historical evidence; the later local remediation supersedes the earlier open code/test conclusion for that audited attempt. Temporary workstation logs are not durable release evidence. No lint, tests, typecheck, build or routine verification was run for this documentation cleanup.

## 3. Final maintenance policy and workflow

Allowed work is limited to minor text/label corrections and styling adjustments within existing functionality, preserving behaviour, data flow, business meaning and accessibility. A component filename or small diff does not make an otherwise prohibited change eligible.

Prohibited work includes new features/modules; databases, SQL, migrations, schema and RLS; authentication, authorisation and security; pricing, calculations and financial logic; APIs, integrations and scheduled jobs; dependencies, environment configuration and infrastructure changes. Codex must refuse these requests and direct the salesperson to management or appointed technical support. Approval of a local UI change cannot expand that scope.

The agreed sequence is:

1. The salesperson requests an eligible minor text, label or styling change.
2. Codex inspects relevant non-secret source and proposes the exact local diff, files, risks and undo approach.
3. The salesperson approves only that local scope.
4. Codex makes only the approved local edit, without running commands or accessing providers, credentials or production systems.
5. Management arranges technical review, validation and publication when required. Missing support leaves those technical steps pending; it does not expand salesperson responsibilities.
6. An authorised operator handles any separately approved release. **Local edit approval is not production release approval.**

The salesperson must not independently run builds, tests, migrations, deployments or database operations in this workflow. Existing review/release check obligations remain with management-arranged technical support; missing required results are reported as NOT RUN and cannot be called a release pass. The documented validation route is not evidence of technical isolation. Existing automation may deploy after publication; no new technical branch or ownership gate is assumed.

## 4. Outstanding infrastructure and security disclosures

All statuses below derive from earlier documents, not fresh service checks. “Unverified” does not mean unavailable or broken; it means sufficient confirmation is absent. Keeping existing settings unchanged is not a fix or blanket risk acceptance. Follow-up options require a separate management decision; they are not new mandatory safeguard activation requirements.

| Risk | Dated evidence and present documentary status | Business risk | Management decision / follow-up | Responsible party |
| --- | --- | --- | --- | --- |
| R1 — Supabase backups/restoration | The 22 November metadata response did not establish a usable recovery point; PITR was recorded as disabled. An August local dump was observed but not validated. The 23 November record did not obtain fresh private management configuration. Local/test restore tooling exists; a successful drill and provider-supported production recovery remain unverified. | Data may be unrecoverable within acceptable loss/downtime limits; shared Hub/Merch impact. | Record recovery objectives and decide on investigation, acceptance/deferment or separately approved recovery work. Do not use the guarded local/test restore script as a production procedure. | Management owns risk/cost decisions; technical support when arranged handles provider-supported assessment/recovery. |
| R2 — Vercel, release/rollback and domains | Last documented project-management read returned 403. GitHub recorded successful production status on 4 November, but that is only a candidate, not proof of the current live version or a tested recovery target. Effective settings, preview isolation, roles, domain/DNS/renewal custody and rollback remain unverified. | Delayed outage response, unsafe release/recovery assumptions or domain continuity failure. | Identify the authorised release/incident route under existing arrangements; record decisions on the unresolved custody/configuration risks. Any later technical action needs separate approval. | Management; authorised operator/technical support when required. |
| R3 — Monday credentials | The 23 November metadata record identifies the departing developer's personal credential dependency for sales synchronisation and Snuggle. Company-managed succession and acceptance remain unverified. | Account/permission/token changes can interrupt reporting and leave values stale. | Decide continuity responsibility and whether to separately authorise a planned transfer. No credential change is performed or approved by this receipt. | Management owns continuity decisions; technical support when arranged plans any authorised cutover. |
| R4 — Authentication/recovery | A local redirect repair is recorded on 22 November. Deployment, private recovery settings, email delivery, separate-browser recipient flow and permission-boundary acceptance remain unverified. | Staff may not regain access reliably; unresolved security/configuration risk affecting both Hub and Merch. | Arrange technical assessment and authorised controlled-account acceptance when required; retain safe evidence privately. | Management; appointed technical support/authentication owner when arranged. |
| R5 — GitHub/control continuity | Earlier records show unprotected `main`, empty repository rulesets, one visible administrator, Actions enabled and no demonstrated repository workflow/owner gate. Inherited rules, successor roles and company recovery custody remain unverified. | Direct/unreviewed changes, single-account dependency and indirect deployment/secret-execution routes. | Existing permissions/branches remain unchanged. Record the risk owner and accept/defer/investigate decision. Historical protection/CODEOWNERS proposals are not current instructions or activation conditions. | Management; technical support when required. |
| R6 — Other operating dependencies | Report mailbox/OAuth and Google custody, alert delivery, renewal ownership, workstation/Codex setup, manual business/export checks and support arrangements have no recorded closure evidence. | Missed incidents, stale reporting and unavailable technical assistance. | Confirm practical contacts and setup; assign decisions/owners for outstanding dependencies. | Management; business owners and technical support as arranged. |

The detailed [infrastructure register](INFRASTRUCTURE_REMAINING_ACTIONS.md) and dated audit retain the original findings. No claim is made that Supabase is inaccessible, production deployment is verified or safeguards are activated. A website rollback does not restore lost database records.

## 5. Responsibilities after handover

| Party | Responsibilities | Limits |
| --- | --- | --- |
| Salesperson | Use ordinary approved business controls, request eligible minor edits, approve only exact local scope, preserve safe evidence and refer technical needs to management. | No independent commands/checks, providers, secrets, publishing, database work or prohibited changes in the maintenance workflow, regardless of actual existing privileges. |
| Management | Arrange support when required; identify escalation and approval routes; deliver documents; manage business/risk decisions and any separately authorised technical work. | Documentation receipt does not prove operational readiness. Missing support does not transfer technical duties to the salesperson or departing developer. |
| Technical support when appointed | Agree scope with management; investigate, review, validate, publish or operate an authorised release/recovery process as required; explain risks and preserve private evidence. | No permission, configuration, credential or production changes are implied by this routine policy or receipt. Separate authorisation is required. |

**The departing developer has no ongoing maintenance, troubleshooting, training or support obligation.** An optional delivery signature below creates no such obligation and does not appoint the departing developer as the support contact.

## 6. Management decisions and outstanding actions

The final scope and unchanged-settings decisions are confirmed. The following practical items remain for management; none is completed automatically:

- [ ] Deliver the documents, confirm named recipients and record actual receipt/read-through privately.
- [ ] Confirm the normal Hub bookmark, project location and approved Codex/workstation arrangements; record unresolved setup needs without assuming account transfer or readiness.
- [ ] Identify a management escalation contact and arrange technical support/contact coverage when required.
- [ ] Identify the local scope approver and the authorised technical review, validation, publication and release route. Require separate approval of the specific release; account capability is not authority.
- [ ] Record decisions for R1–R6: accept, defer, investigate or separately authorise remediation, with owner, conditions and follow-up date. No blanket risk acceptance is inferred from unchanged settings.
- [ ] Decide business fallback, acceptable data loss/downtime and handling of disputed figures/quotes where relevant.
- [ ] Record a later operational-readiness decision only against actual evidence, separately from document receipt.

No new CODEOWNERS, branch protection, permission changes or infrastructure safeguards are mandatory handover conditions. Historical proposals remain historical; any reconsideration requires a new separate management decision.

## 7. Readiness and acceptance

| Matter | Classification |
| --- | --- |
| Documentation prepared | **READY FOR DELIVERY** — final policy and handover package prepared locally. |
| Documentation received | **NOT RECORDED** — requires named recipient/date in a private receipt record. |
| Operational/security readiness | **NOT ESTABLISHED** — requires separate evidence and a management decision; not inferred from document preparation or receipt. |
| Infrastructure risks/decisions | **OPEN / PENDING where stated** — earlier observations retain their dates; no remediation or risk acceptance is fabricated. |

## 8. Formal receipt and acknowledgement

Keep the repository copy unsigned and free of private account identifiers, credentials and personal contact details. Complete and retain the signed copy and named contacts in approved private company records.

| Receipt field | Complete in private copy |
| --- | --- |
| Handover delivered by | ________________________________________ |
| Date delivered / document version | ________________________________________ |
| Received by | ________________________________________ |
| Position | ________________________________________ |
| Date received | ________________________________________ |
| Outstanding risks acknowledged — R1–R6 and any exceptions | ________________________________________ |
| Responsible technical support contact, or “not appointed” | ________________________________________ |
| Support/contact coverage reference | ________________________________________ |
| Management signature / date | ________________________________________ |
| Departing developer signature / date — optional, delivery only | ________________________________________ |

**Receipt statement:** Management acknowledges receipt of the listed documentation and the disclosed outstanding risks, subject to any recorded exceptions. Signing does not certify operational or security readiness, confirm that risks are fixed, verify production deployment, activate safeguards, transfer accounts or approve a release. Receipt may be acknowledged while technical support or risk decisions remain pending. It assigns no ongoing maintenance, troubleshooting, training or support obligation to the departing developer.

| Separate private decision record | Complete only when decided/evidenced |
| --- | --- |
| Risk decision(s), accountable owner(s), conditions and review date(s) | ________________________________________ |
| Operational evidence reviewed / assessor / date | ________________________________________ |
| Remaining limitations and management operational decision | ________________________________________ |

A blank field is not approval or acceptance. A risk acknowledgement is not necessarily risk acceptance, and risk acceptance is not evidence of remediation.

## 9. Documentation index

Paths are repository-relative; links resolve from this document. Technical references are for management/support, not additional salesperson authority.

| Document | Repository path |
| --- | --- |
| Project instructions | [AGENTS.md](../AGENTS.md) |
| This report | [ai-context/FINAL_MANAGEMENT_HANDOVER.md](FINAL_MANAGEMENT_HANDOVER.md) |
| Authoritative final policy | [ai-context/RESTRICTED_MAINTENANCE_POLICY.md](RESTRICTED_MAINTENANCE_POLICY.md) |
| Codex instructions | [ai-context/SALES_AI_CONTEXT.md](SALES_AI_CONTEXT.md) |
| Procedural checklist and superseded-proposal disclosure | [ai-context/operations/RESTRICTED_MAINTENANCE_ACTIVATION.md](operations/RESTRICTED_MAINTENANCE_ACTIVATION.md) |
| Historical audit evidence | [ai-context/FINAL_HANDOVER_AUDIT.md](FINAL_HANDOVER_AUDIT.md) |
| Support technical reference | [ai-context/TECHNICAL_HANDOVER.md](TECHNICAL_HANDOVER.md) |
| Infrastructure risk register | [ai-context/INFRASTRUCTURE_REMAINING_ACTIONS.md](INFRASTRUCTURE_REMAINING_ACTIONS.md) |
| Support entry point | [ai-context/HUB_SUPPORT_GUIDE.md](HUB_SUPPORT_GUIDE.md) |
| Daily operations | [ai-context/DAILY_OPERATIONS_GUIDE.md](DAILY_OPERATIONS_GUIDE.md) |
| Requesting changes | [ai-context/MAKING_CHANGES_GUIDE.md](MAKING_CHANGES_GUIDE.md) |
| Troubleshooting | [ai-context/TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) |
| Emergencies | [ai-context/EMERGENCY_PROCEDURES.md](EMERGENCY_PROCEDURES.md) |
| Responsibilities | [ai-context/RESPONSIBILITIES_AND_ESCALATION.md](RESPONSIBILITIES_AND_ESCALATION.md) |
| Final handover checklist | [ai-context/FINAL_HANDOVER_CHECKLIST.md](FINAL_HANDOVER_CHECKLIST.md) |
| Local/test restore reference | [ai-context/operations/DATABASE_BACKUP_RESTORE.md](operations/DATABASE_BACKUP_RESTORE.md) |
| Ingestion reference | [ai-context/operations/INGESTIONS_AND_CRONS.md](operations/INGESTIONS_AND_CRONS.md) |
| Feature references | [ai-context/reference/SALES_DASHBOARD.md](reference/SALES_DASHBOARD.md), [ai-context/reference/CALCULATORS.md](reference/CALCULATORS.md), [ai-context/reference/SALES_WEEKLY_CHECKLIST.md](reference/SALES_WEEKLY_CHECKLIST.md) |

## Editorial cleanup record

This is a documentation-only reconciliation. The audit's existing evidence, dates, historical findings and recorded verification results were retained; a reading notice distinguishes history from current policy. Earlier mandatory technical-safeguard proposals are superseded as instructions, not rewritten as if they had never been proposed. No provider inspection, routine verification, application/database/migration/configuration/credential/permission change, commit, push, merge or deployment was performed for this cleanup.
