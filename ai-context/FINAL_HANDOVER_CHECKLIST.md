# Final procedural handover checklist

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Confirmed policy decisions

1. Existing GitHub permissions and branch settings remain unchanged.
2. Existing Supabase and Vercel permissions/configuration remain unchanged.
3. No mandatory CODEOWNERS, branch protections, role changes or new infrastructure safeguards are introduced.
4. Salesperson/Codex edits are limited to specifically approved minor text, labels and styling within existing functionality. Codex refuses prohibited changes and refers to management/support.
5. Management arranges technical support when required; no ongoing training, troubleshooting or support obligation falls to the departing developer.

These are agreed decisions, not open activation requirements. Follow [RESTRICTED_MAINTENANCE_POLICY.md](RESTRICTED_MAINTENANCE_POLICY.md). Procedural restrictions do not technically prevent prohibited actions; actual permissions may be broader.

## Readiness

| Classification | Status |
| --- | --- |
| Documentation prepared | READY FOR DELIVERY; the final policy and guides are prepared locally. |
| Documentation received | NOT RECORDED; named receipt/read-through must be recorded separately in private records. |
| Access settings | UNCHANGED by agreement, not newly verified. No technical enforcement is claimed. |
| Actual operational/security readiness | NOT ESTABLISHED; working setup, review/release route, support availability and live acceptance require separate evidence. |
| Infrastructure/security risks | OPEN at their original evidence dates; no fix or blanket risk acceptance implied. |

## Remaining practical management actions

- [ ] Deliver the six guides and supporting documents; record receipt privately.
- [ ] Supply/confirm the normal Hub bookmark, correct project folder, approved Codex setup and a management escalation contact, using existing account arrangements. Do not infer missing access has been resolved.
- [ ] Arrange technical support when needed and specify contact/cover for technical incidents, review, validation and any release. If no support is available, leave technical work pending.
- [ ] Identify who may approve the exact local change and who may separately approve/perform publication or production release under the existing arrangements. A push/merge may trigger deployment.
- [ ] Review the disclosed infrastructure/security risks, record owners and choose accept/defer/investigate or separately authorise remediation. No permission/configuration changes are required to sign for document receipt.
- [ ] Record any actual operational acceptance with evidence, separately from documentation receipt. No verification or exercise is performed by this checklist.

## Infrastructure disclosures — not mandatory access-control activation

| Area | Current disclosed status | Management follow-up |
| --- | --- | --- |
| GitHub | Historical reads found unprotected `main`, empty repository rulesets and one visible administrator; successor/inherited rights unverified. Actions enabled; no demonstrated repository workflow/owner gate. | Existing permissions/branches remain unchanged. Acknowledge the absence of established technical barriers and decide separately how to handle continuity/publication risks. |
| Supabase | Company recovery custody, current usable backups/retention, restore entitlement and successful drill unverified; old local dump unvalidated. Shared backend with Merch. | Leave permissions/configuration unchanged. Record risk owner and decision on investigation, acceptance or separately approved recovery work. Existing [local/test runbook](operations/DATABASE_BACKUP_RESTORE.md) is not a production restore certification. |
| Vercel and domains | Last documented management read returned 403; production settings, live version, preview isolation, rollback rights and domain custody unverified. | Leave permissions/configuration unchanged. Record how management will address outages, renewal and release uncertainty; no new safeguards are prerequisites here. |
| Monday | Personal credential dependency confirmed; company-managed transfer and acceptance not verified. | Record continuity owner/decision. A future cutover requires separate approval; no credential rotation occurs in this policy update. |
| Password recovery | Local redirect repair documented; deployment, private settings and live email/cross-browser acceptance unverified. | Arrange technical support when investigation/acceptance is required; ordinary sign-in is not proof of full recovery readiness. |
| Google/report mailbox and monitoring | Custody/renewal, alert delivery and ongoing operational responsibility remain unverified. | Record business owner and follow-up decision without assuming historical successful jobs prove current control. |
| Local runtime/preview/CI | Safe execution, secret handling and isolation unverified; executable source may use existing credentials. | Do not claim technical isolation. Management/support decides suitable validation for a proposed release; no new infrastructure design is mandated by this agreement. |

The [infrastructure register](INFRASTRUCTURE_REMAINING_ACTIONS.md) and [audit](FINAL_HANDOVER_AUDIT.md) retain the detailed historical evidence. Earlier proposed controls are not mandatory final-policy activation items; see the [procedural checklist and disclosures](operations/RESTRICTED_MAINTENANCE_ACTIVATION.md).

## Documentation delivery

1. [DAILY_OPERATIONS_GUIDE.md](DAILY_OPERATIONS_GUIDE.md)
2. [MAKING_CHANGES_GUIDE.md](MAKING_CHANGES_GUIDE.md)
3. [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)
4. [EMERGENCY_PROCEDURES.md](EMERGENCY_PROCEDURES.md)
5. [RESPONSIBILITIES_AND_ESCALATION.md](RESPONSIBILITIES_AND_ESCALATION.md)
6. [FINAL_HANDOVER_CHECKLIST.md](FINAL_HANDOVER_CHECKLIST.md)

Also deliver [management handover](FINAL_MANAGEMENT_HANDOVER.md), [support guide](HUB_SUPPORT_GUIDE.md), [Codex instructions](SALES_AI_CONTEXT.md), [final maintenance policy](RESTRICTED_MAINTENANCE_POLICY.md), [technical handover](TECHNICAL_HANDOVER.md), [infrastructure register](INFRASTRUCTURE_REMAINING_ACTIONS.md) and [audit](FINAL_HANDOVER_AUDIT.md). Record named recipients privately; file existence is not receipt or training acceptance.

## Work boundaries

Documentation only. No application, infrastructure, database, credential, permission or branch settings changed. Verification commands, commits, pushes, merges and deployments were not performed. Documentation readiness does not certify technical or operational readiness.
