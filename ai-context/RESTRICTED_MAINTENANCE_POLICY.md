# Final agreed routine-maintenance policy

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Confirmed decisions

1. Leave existing GitHub permissions and branch settings unchanged.
2. Leave Supabase permissions and configuration unchanged.
3. Leave Vercel permissions and configuration unchanged.
4. Introduce no mandatory CODEOWNERS, branch protections, new access controls, isolated-runtime requirements or other infrastructure safeguards as handover activation conditions.
5. Limit salesperson/Codex maintenance to specifically approved minor text, label and styling changes within existing functionality. Technical ownership does not transfer to the salesperson.
6. Management arranges technical support when required. No ongoing maintenance, troubleshooting, training or support duty is assigned to the departing developer.

This final agreement supersedes the earlier technical-safeguard activation proposal. It is a **procedural restriction**, not a change to permissions. Existing account rights may permit more than this policy authorises. Codex instructions, approval prompts and documentation do not technically prevent prohibited actions, block access to secrets, enforce review or stop an automatic deployment. No such protection is asserted.

## Allowed work

1. Correct minor text and labels without changing business meaning, financial/legal statements, calculations, permissions or behaviour.
2. Adjust existing styling, such as spacing, alignment, colour or typography, while preserving accessibility, visible information, controls and existing functionality.
3. Make only the exact approved local diff. Existing component files may be edited solely for these text/label/style purposes; structural, interaction, data-flow and feature changes are not authorised.

Location under `components` and a small line count do not make an edit safe. Changes to financial/security screens or shared styles require care; if unchanged behaviour cannot be established, stop and escalate.

## Prohibited salesperson work

1. New features/modules/routes, redesigns, refactoring or dependency/execution configuration changes.
2. Supabase/database operations, SQL, migrations, schema/RLS/RPC changes, generated database types, direct data corrections, backup or restore operations.
3. Authentication, authorisation, security, account permissions or session changes.
4. Pricing logic, calculators, tax, financial/KPI calculations, targets, Final Values or other business-critical rules.
5. APIs, server actions, integrations, scheduled jobs, network/persistence behaviour, environment settings or infrastructure changes.
6. Altering policies, workflows, tests or scripts to bypass these limits, obtain access or make checks pass.
7. Reading, copying, printing, using or rotating privileged credentials, connection strings, service-role keys or production secrets as part of a routine UI request.
8. Independent commits, pushes, merges, workflow triggers, deployments, promotions, rollbacks or job replays in the salesperson maintenance session. Existing permissions remain unchanged; these are behavioural limits, not assertions that the controls are technically unavailable.

Codex must refuse prohibited requests, explain the boundary in plain language and direct the salesperson to management or technical support. General permission, urgency or salesperson approval cannot turn prohibited work into an allowed UI edit.

## Routine workflow — authoritative sequence

1. **Request:** the salesperson requests an eligible minor text, label or styling change within existing functionality.
2. **Proposal:** Codex inspects relevant non-secret source and proposes the exact local diff/files, risks, unchanged behaviour and undo approach. No commands or provider access are needed.
3. **Local approval:** the salesperson approves only that exact local scope. An investigation request or earlier unrelated approval is insufficient.
4. **Local edit:** Codex makes only the approved edit without running commands, accessing providers/credentials or changing unrelated work. If prohibited work is needed, Codex refuses, explains and refers to management or appointed technical support.
5. **Technical handoff:** management arranges technical review, validation and publication when required. The salesperson does not run builds, tests, migrations, deployments or database operations. Required review/release results remain pending until the authorised technical process completes; missing results are NOT RUN, not PASS. If support is unavailable, hold technical work/release and ask management to arrange it.
6. **Separate release:** an authorised operator handles any separately approved release. Local edit approval is not production release approval. Existing push/merge automation may deploy; no mandatory technical PR/code-owner gate or newly activated safeguard is assumed.

Use the correct company project and non-secret source, preserve unrelated work and provide a sanitised local diff/summary. Do not install dependencies, inspect environment files, use provider sessions, commit, push, merge or trigger workflows in the routine session. Existing code-check obligations are technical review/release obligations; they do not authorise the salesperson to execute commands or obtain database credentials. Documentation-only work needs no application checks.

## Readiness and risk disclosure

| Area | Status |
| --- | --- |
| Documentation prepared | READY FOR DELIVERY locally; the confirmed final policy is recorded. |
| Documentation received | NOT RECORDED; requires named recipient/date in private records. |
| Permissions and infrastructure | UNCHANGED by agreement. Effective permissions/security were not reverified for this update; no new safeguards are mandated or claimed. |
| Actual operational readiness | UNVERIFIED. Documentation alone does not establish staff setup, a working support/release route or successful end-to-end business operation. |
| Infrastructure/security risks | OPEN at their documented evidence dates. Retaining current settings does not fix or technically mitigate them. |

See [management handover](FINAL_MANAGEMENT_HANDOVER.md), [final checklist](FINAL_HANDOVER_CHECKLIST.md) and [procedural handover checklist](operations/RESTRICTED_MAINTENANCE_ACTIVATION.md). Ordinary Hub use remains subject to existing application permissions and uses Supabase-backed services; this policy neither removes nor grants provider membership or technical access. Any later infrastructure remediation requires a separate management decision outside this routine-maintenance policy.
