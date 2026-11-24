# Final procedural handover checklist and risk disclosures

## Role applicability

Read [ROLES.md](../../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

This file retains its path for existing links. The earlier eight-step infrastructure-safeguard activation plan is **superseded and not adopted as a mandatory handover condition**. The final [maintenance policy](../RESTRICTED_MAINTENANCE_POLICY.md) leaves GitHub permissions/branches, Supabase permissions/configuration and Vercel permissions/configuration unchanged. No CODEOWNERS, branch protection, role restrictions, mandatory isolation controls or other new infrastructure safeguards are required by this agreement.

Procedural restrictions do not technically prevent prohibited actions. Existing access may permit more than the salesperson is authorised to do. This document-writing task neither inspects nor changes those rights.

## Current procedural delivery and handoff checklist

1. **Management:** deliver the final policy and six guides, confirm the correct project/normal website and record receipt privately. The maintenance scope is minor text, labels and styling within existing functionality only; the scope decision is confirmed, not awaiting another policy approval.
2. **Salesperson/Codex:** read the policy, propose exact local files/diff and obtain specific approval before edits. Codex refuses prohibited work and refers it to management or technical support. No provider/permission change or technical activation test is needed to request or approve an eligible local diff.
3. **Management:** arrange technical support when required, including a contact/escalation route for technical incidents and for review, validation, publication or release. If support is not available, technical work/release stays pending; it does not become the salesperson's or departing developer's duty.
4. **Management/authorised operator:** identify the approval/review and validation route for any intended release. Existing automation may deploy on push/merge; routine local edit approval is not release approval. No new mandatory technical branch/PR/ownership gate is introduced.
5. **Management:** review the disclosed risks below, record who will handle them, and decide whether to accept, defer, investigate or separately authorise remediation. No item is verified or resolved merely because existing settings are retained.
6. **Management:** record documentation receipt separately from actual operational readiness. Staff setup, practical handoff, technical support availability and relevant business acceptance have not been demonstrated by this policy update. No new safeguards are required to sign for documentation receipt.

## Disclosed evidence and remaining gaps

The following are earlier observations from the 23 November handover work, not fresh checks in this update. They are retained as risks rather than instructions to change access controls.

| Area | Documented observation | Remaining risk / uncertainty |
| --- | --- | --- |
| GitHub branches/rules | `main` was unprotected; repository rulesets were empty; inspection operator had Admin. | No enforced independent-review or direct-push barrier is established. Organisation rules, successor privileges and recovery custody remain unverified. Settings remain unchanged by decision. |
| Actions/workflows | Actions enabled with all actions allowed; no active local CODEOWNERS/workflow found; remote workflow-path query returned 404. | No demonstrated automated review gate. Organisation workflows, installed Apps, runners, secrets, environments and OIDC trust are not fully inventoried. No new workflow/owner gate is required or installed. |
| Hooks and deployment integrations | Repository hooks query returned an empty list; Vercel deployments were recorded historically in GitHub. | Empty hooks do not exclude GitHub Apps or external triggers. Preview/branch/fork/tag deployment behaviour remains unverified. |
| Build/install/test | Repository scripts execute code; installation includes a style-generation script. | Candidate code may run with credentials, network or deployment identity in its execution environment. No isolation or secret protection is certified; no new infrastructure isolation is mandated here. |
| Local files/sessions | Ignore rules exclude selected environment files, Vercel state, dumps and generated outputs. | Ignore rules and prompts are not file-access controls; existing local files, credentials, cached sessions, artifacts and inherited privileges may still be available. None was inspected in this update. |
| Supabase and ordinary app access | Source has server-side service-role use, browser configuration, application permissions and privileged scheduled operations. | Effective membership, credentials, RLS and server/runtime permissions remain unverified. Ordinary Hub use communicates with Supabase. Permissions/configuration are unchanged; this policy does not technically remove access. |
| Vercel/preview and production | Last documented project-management read returned 403. | Current roles, secrets, effective configuration, preview isolation, rollback and domain custody remain unverified. Permissions/configuration remain unchanged. |
| Other infrastructure | Backup/recovery, personal Monday credentials, live recovery acceptance and monitoring have outstanding findings. | Risks remain open in the existing audit and infrastructure register. Keeping current settings does not resolve them. |

## Proposals not adopted as mandatory requirements

Earlier proposals for protected `main`, no direct pushes, mandatory independent/code-owner approvals, new CODEOWNERS, Read/Triage-only roles, provider-membership removal, secret-path exclusions, CLI restrictions, egress/filesystem isolation, CI/preview redesign and technical denial tests are **not mandatory activation items under the final agreement**. They have not been applied by this documentation work. Any future reconsideration requires a separate management decision and authorised technical task; none is implied by this checklist.

## Private management record

| Field | Record |
| --- | --- |
| Final policy | Confirmed: minor text/label/style only; existing access/settings unchanged |
| Documentation recipient and receipt date | To be completed privately |
| Management contact and technical support arrangement when required | To be completed privately |
| Local change approval and release-authorisation route | To be completed privately |
| Disclosed risks and decisions: accept/defer/investigate/separate remediation | To be completed privately; no blanket acceptance implied |
| Actual operational acceptance and evidence | Unverified; not established by documentation receipt |

## Work boundaries

This update changed documentation only. No application, database, infrastructure, credential, permission or branch setting was changed. No verification commands, provider inspection, commit, push, merge or deployment was performed. No ongoing training or support obligation is assigned to the departing developer.

## Separate readiness records

| Record | Status for this package |
| --- | --- |
| Documentation prepared | READY FOR DELIVERY; the final policy and guides are prepared locally. |
| Documentation received | NOT RECORDED; management may acknowledge receipt in a private signed copy without certifying operation. |
| Operational/security readiness | NOT ESTABLISHED; needs separate evidence and decision. No technical safeguard activation or deployment verification is claimed. |
| Outstanding infrastructure decisions | OPEN/PENDING where disclosed; no risk is fixed or accepted solely by document delivery. |

For the actual request-to-release sequence use the authoritative [six-step maintenance workflow](../RESTRICTED_MAINTENANCE_POLICY.md#routine-workflow--authoritative-sequence). The filename contains “ACTIVATION” for link continuity only; it does not restore the superseded technical-safeguard proposal.
