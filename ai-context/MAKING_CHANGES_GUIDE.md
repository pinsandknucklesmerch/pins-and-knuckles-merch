# Requesting minor text, label and styling changes

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Check the scope

1. Read [RESTRICTED_MAINTENANCE_POLICY.md](RESTRICTED_MAINTENANCE_POLICY.md). Request only minor text/label corrections or styling changes within existing functionality, preserving behaviour, business meaning and accessibility.
2. Record the page, current appearance, intended appearance and a safe example. Existing components may be edited only for text/style purposes, not structural, interaction or feature changes.
3. Stop for new features, database/SQL/migration/RLS/schema work, authentication/authorisation/security, pricing/calculator/financial logic, API/server actions, integrations/jobs, dependencies/environment or infrastructure changes. Codex must refuse and refer you to management or technical support.
4. Leave GitHub permissions/branches, Supabase and Vercel permissions/configuration unchanged. No new CODEOWNERS, branch protections or access-control activation is required by the final agreement.

## Agreed six-step sequence

1. You request an eligible minor text, label or styling change.
2. Codex inspects relevant non-secret source and proposes the exact local diff.
3. You approve only that local scope.
4. Codex makes the approved local edit without running commands or accessing providers/credentials.
5. Management arranges technical review, validation and publication when required.
6. An authorised operator handles any separately approved release. Local edit approval is not production release approval.

This follows the authoritative [maintenance policy](RESTRICTED_MAINTENANCE_POLICY.md#routine-workflow--authoritative-sequence). No request or local approval authorises prohibited work.

## Approve an exact local change

1. Ask Codex to inspect non-secret source and propose exact files/diff, unchanged behaviour, shared-style/accessibility risks and undo steps. No edits yet.
2. If eligible and understandable, explicitly approve that local text/label/style scope. No separate technical-safeguard activation evidence is required.
3. Preserve unrelated work and stop if additional/prohibited changes are needed. Do not request extra access, keys or a test bypass.
4. Review the local diff in VS Code's Source Control view; do not stage, discard, commit or press Sync Changes as part of routine editing.

## Review, branch/PR and release handoff

1. Send a sanitised local diff and summary to management. Management arranges technical support when review, validation, branch/PR publication or release is needed; absence of support holds those technical steps pending.
2. Your existing permissions remain unchanged and are not certified by this guide. The routine procedure does not authorise you to push, merge, trigger workflows or deploy even if your account technically permits it.
3. An authorised operator can handle branches and PRs under the existing process. No mandatory CODEOWNERS, protected branch or new automated review gate is introduced. Do not assume GitHub will stop direct or unsafe changes.
4. Code checks/manual acceptance and management approval of the specific publication/release remain necessary. The [technical handover](TECHNICAL_HANDOVER.md#verification) lists existing check obligations; the routine session does not run them or obtain database credentials. Missing required results are NOT RUN and block release.
5. Existing builds/previews may use production resources; isolation is unverified. Management/support decides the validation route before execution without treating this policy as permission to change infrastructure.
6. A local diff is not live. Publication can trigger deployment under unchanged settings; obtain separate approval before any such action and ask the authorised operator to confirm the live result.

## Copy-and-paste prompts

### Propose only

```text
Read ROLES.md first, then AGENTS.md. For RESTRICTED, read ai-context/SALES_AI_CONTEXT.md and ai-context/RESTRICTED_MAINTENANCE_POLICY.md. The following prompt is for RESTRICTED only. Use the final procedural policy. Request: [minor text/label/style change]. Page: [page]. Expected appearance: [details]. Inspect relevant non-secret source only. Propose exact files/diff, unchanged functionality, accessibility/shared-style risks and undo steps. Do not edit or run commands, inspect credentials, access providers, publish or deploy. Refuse prohibited work and direct me to management/support. Leave existing permissions and infrastructure unchanged; no safeguard activation is required or claimed.
```

### Approve only the local scope

```text
I approve only this minor local text/label/style change: [exact files and scope]. Keep existing functionality, data flow, calculations, permissions and infrastructure unchanged. Preserve unrelated work. If anything prohibited is needed, refuse and refer to management/support. Do not execute commands/checks, inspect secrets, use providers, commit, push, merge or deploy. Report the local diff and validation NOT RUN — management/support review required. This is not release approval.
```

### Hand off or stop

```text
Stop further edits/actions and preserve the work. Prepare a sanitised summary for management: scope, local diff/files, uncertainty, visual/accessibility checks, risks and undo proposal. State why technical support is required and which steps are pending. Do not create a branch or remote PR, run commands, request credentials, change permissions or deploy. Management arranges support; the departing developer has no ongoing support obligation.
```

Procedural instructions do not technically prevent prohibited actions. Compliance relies on following the agreed process; actual rights and deployment behaviour are not reverified here.
