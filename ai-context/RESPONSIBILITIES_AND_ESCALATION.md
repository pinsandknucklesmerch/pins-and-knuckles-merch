# Responsibilities and escalation

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Confirmed final policy

1. Leave existing GitHub permissions/branch settings, Supabase permissions/configuration and Vercel permissions/configuration unchanged.
2. Introduce no mandatory CODEOWNERS, branch protections, role changes or new infrastructure safeguards.
3. Authorise only specifically approved minor text, label and styling changes within existing functionality. Codex must refuse prohibited work and refer to management/technical support.
4. These are procedural restrictions: actual account capabilities may be broader. Documentation does not technically prevent prohibited actions, enforce review or prove security/operational readiness.

See [RESTRICTED_MAINTENANCE_POLICY.md](RESTRICTED_MAINTENANCE_POLICY.md) for the authoritative scope. Documentation is ready locally; actual operational readiness and unverified infrastructure risks are not resolved by this agreement.

## Salesperson

1. Use existing approved accounts and ordinary business controls; check reporting periods and update assigned checklist duties.
2. Record safe symptoms and request eligible minor text/label/style changes. Ask for exact proposed files/diff, risks and unchanged behaviour; approve only that local scope.
3. Do not request new features, database/migrations/SQL/RLS changes, auth/security changes, pricing/calculations, API/integrations/jobs or infrastructure/environment changes. If prohibited work is needed, stop and refer to management/support.
4. Do not inspect credentials/providers, execute application/check commands, publish, merge, deploy, restore or rotate keys in the routine session, even if existing permissions permit it. Do not alter permissions to finish a task.
5. Hand review, validation, publication/release and technical incidents to management. You are not responsible for infrastructure diagnosis, technical maintenance, training others or recovery.

## Management

1. Arrange technical support when required, including technical incidents, review, validation and publication/release. Provide an escalation contact and suitable support coverage when needed; no contact is invented by these documents.
2. Deliver the final guides and confirm the normal Hub bookmark, project location and approved Codex/workstation arrangements using existing access.
3. Identify who approves local scope and who approves/performs any separate publication/production action under existing arrangements. Account privileges do not replace approval.
4. Review disclosed security, ownership, backup/recovery, credential and authentication risks and decide accept/defer/investigate or separately authorise remediation. No new infrastructure action or permission change is mandated by the final policy.
5. Record documentation receipt separately from any actual operational acceptance and evidence. Manage business fallback, disputed figures and recovery objectives where relevant.

## Technical support when arranged

1. Agree the specific technical scope with management and explain the diagnosis, uncertainty, proposed work, risks and approval needed.
2. Review candidate changes before execution, perform authorised checks/manual acceptance and report PASS/FAIL/NOT RUN honestly. Existing validation isolation and secret handling are not certified by this documentation.
3. Handle any separately approved branch/PR publication, release, integration investigation or recovery work. Leave permissions/infrastructure unchanged under the current agreement; any later change needs separate authorisation outside routine maintenance.
4. Maintain private incident/technical evidence. Do not ask the salesperson for secrets to overcome missing checks. Do not bypass existing failing checks or presume previews use test resources.

## Escalation

1. Collect the safe report from [EMERGENCY_PROCEDURES.md](EMERGENCY_PROCEDURES.md#report-the-incident).
2. Contact management and any arranged technical support for an outage, wrong figures, suspected exposure/loss or widespread login/integration problem.
3. If no support is available, management arranges it when required. Leave technical work/release pending rather than widening salesperson scope.
4. Confirm ordinary business workflows when requested. Technical closure and risk acceptance require actual evidence/decisions, not a Codex assurance.

## Information management still needs to provide privately

1. Management escalation contact and technical support contact/coverage when required.
2. Confirmed normal website, project location, approved Codex setup and any unresolved staff setup details.
3. Local approval and publication/release approval route, with authorised operator.
4. Risk owners, decisions and follow-up dates; location for private incident and receipt records. Keep secrets and signatures out of this public repository.

## Departing developer

No ongoing training, maintenance, troubleshooting, emergency cover or support obligation is assigned to the departing developer. Management is responsible for arranging technical support when required. Do not reuse the departing developer's personal credentials or treat an optional delivery signature as a support commitment.
