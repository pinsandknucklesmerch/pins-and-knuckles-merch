# Pins Hub support guide

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Start here

1. Use [DAILY_OPERATIONS_GUIDE.md](DAILY_OPERATIONS_GUIDE.md) to open the normal Hub website and the approved VS Code/Codex project.
2. Read [RESTRICTED_MAINTENANCE_POLICY.md](RESTRICTED_MAINTENANCE_POLICY.md). Routine edits are minor text, labels and styling within existing functionality only, after exact local scope approval.
3. Existing GitHub, Supabase and Vercel permissions/settings stay unchanged. No new mandatory CODEOWNERS, protected branches or technical safeguards are prerequisites. These procedural instructions do not technically prevent prohibited actions or prove that provider access is absent.
4. For outages, login failures, disputed figures or integrations, use [EMERGENCY_PROCEDURES.md](EMERGENCY_PROCEDURES.md). Management arranges technical support when required. Do not attempt a technical repair through a UI request.
5. Documentation is prepared and ready for delivery. Named receipt is not recorded; actual operational/security readiness is not established and infrastructure risks remain open; see the [management handover](FINAL_MANAGEMENT_HANDOVER.md).

## Request a change or report a symptom

1. Open the company-provided Pins Hub folder. Confirm `AGENTS.md`, `ai-context/SALES_AI_CONTEXT.md` and this guide are visible; ask management if the project or access is unclear.
2. Use your own existing approved account. Do not change account roles/settings or borrow another person's credentials. Routine edits do not authorise production access or secret inspection even if existing tools permit it.
3. Paste:

   ```text
   Read ROLES.md first, then AGENTS.md. For RESTRICTED, read ai-context/SALES_AI_CONTEXT.md and ai-context/RESTRICTED_MAINTENANCE_POLICY.md. The following prompt is for RESTRICTED only. Apply the final procedural policy: minor text, label and styling changes within existing functionality only; leave permissions and infrastructure unchanged. Request/symptom: [safe details]. Expected: [result]. Actual: [result]. Page/environment: [details]. Inspect relevant non-secret source only and propose exact local files/diff. Do not edit yet, run commands/checks, access providers/secrets, commit, push, merge or deploy. Refuse prohibited work and direct me to management or technical support. No new safeguard activation is required or claimed.
   ```

4. Keep customer records, passwords, connection strings, keys, reset links and raw emails out of the conversation and public repository.
5. Ask for evidence, uncertainty and a plain-language explanation. If the proposal changes functionality, data, authentication, pricing, integration or infrastructure, stop and ask management for support.

## Six-step maintenance workflow

1. Request an eligible minor text, label or styling change within existing functionality.
2. Codex inspects relevant non-secret source and proposes an exact local diff.
3. Approve only that local scope after reading the proposal.
4. Codex makes only the approved edit, without running commands or accessing providers/credentials.
5. Management arranges technical review, validation and publication when required.
6. An authorised operator handles any separately approved release. Local edit approval is not production release approval.

The [final policy](RESTRICTED_MAINTENANCE_POLICY.md#routine-workflow--authoritative-sequence) governs this sequence. Codex must refuse prohibited work and refer to management/appointed support. Technical capability is not authority, and procedural limits are not technical enforcement.

## Approve only the local text/style scope

1. Read the exact proposed files/diff, unchanged behaviour, shared-style/accessibility risks and undo proposal. A component file is not automatically safe.
2. Explicitly approve only the eligible local change using [MAKING_CHANGES_GUIDE.md](MAKING_CHANGES_GUIDE.md). No new branch protections, role changes or technical activation evidence is required by the final agreement.
3. Preserve unrelated work. A local approval does not approve publication, a production change, credentials or a prohibited request.
4. Give the local diff/summary to management when review, validation or release is required. Management arranges technical support; if unavailable, leave technical work and release pending.

## Recognise successful verification

1. Your local-edit session reports NOT RUN — management/support review required. Do not execute the application/check commands or obtain credentials just to obtain a pass.
2. Code checks and appropriate manual acceptance remain in the [technical handover](TECHNICAL_HANDOVER.md#verification). Required missing results block release; documentation-only work needs no application checks.
3. Build/install/test and previews can execute code or use live services. Their isolation and secret handling are not verified by these documents. Management/support must decide on a suitable validation route before execution; existing infrastructure remains unchanged by this policy.
4. Management approves any specific publication/release through the authorised operator. A push or merge may trigger deployment under existing settings. No mandatory automated PR/ownership gate or enforced denial is asserted.

## If something goes wrong

1. Stop further edits and preserve the local diff. Do not reset/discard unrelated work, sync, deploy, restore or rotate credentials.
2. Notify management and any appointed technical support through the approved private channel. If there is no technical contact, management must arrange one when required.
3. Use the incident template in [EMERGENCY_PROCEDURES.md](EMERGENCY_PROCEDURES.md#report-the-incident). State whether the change is local and what is known about the normal website.
4. The departing developer has no ongoing maintenance, troubleshooting, training or support obligation.

## Practise once with a supervisor

1. If management arranges a familiarisation exercise, use a harmless text/style example without customer data. Ask Codex for a proposal and withhold edit approval to confirm it waits.
2. Ask a labelled hypothetical question about SQL, a new feature, authentication or pricing logic. Codex must refuse and refer to management/support.
3. This exercise checks understanding of the procedure, not technical enforcement. No provider changes, denial tests, new infrastructure or live release are required for documentation receipt.
4. Record any actual exercise outcome privately; it is not performed by writing these guides and creates no training obligation for the departing developer.
