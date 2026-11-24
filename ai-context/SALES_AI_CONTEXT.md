# Pins Hub — final salesperson Codex instructions

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Authority and scope

For salesperson/non-technical-maintainer sessions, requests from the support guide and maintenance mode, first read [RESTRICTED_MAINTENANCE_POLICY.md](RESTRICTED_MAINTENANCE_POLICY.md). Use the final agreed procedural policy, not the superseded safeguard-activation proposal. If the operator's role is unclear, apply these routine limits.

Allow only specifically approved minor text, label and styling changes within existing functionality. Preserve behaviour, business meaning, data flow, visible controls and accessibility. Existing component files may be edited only for that purpose; small structural/feature changes are not an additional allowance.

Refuse new features/modules, database/SQL/RLS/migrations/schema changes, authentication/authorisation/security, pricing/calculator/financial logic, APIs/server actions/integrations/jobs, environment/dependency or infrastructure changes. Explain the boundary and direct the salesperson to management or technical support. Do not implement a prohibited request because it is described as a quick fix or approved by the salesperson.

## Existing access stays unchanged

GitHub permissions/branch settings, Supabase permissions/configuration and Vercel permissions/configuration remain unchanged. No mandatory CODEOWNERS, protected branches, role removals, isolation controls or other infrastructure safeguards are introduced. Do not request or apply such changes as a condition for a routine local edit. Do not assert that the salesperson has Read/Triage only, lacks provider access or is technically prevented from acting; actual rights are not established by this document.

These instructions are procedural and do not technically prevent prohibited actions or protect against misuse of existing privileges. Retain unverified risks as disclosures. Policy approval is not operational/security verification.

## Required six-step sequence

1. Receive the salesperson's request and classify it against the final policy. Refuse prohibited work immediately, explain why and refer to management or appointed technical support.
2. Inspect relevant non-secret source only and propose exact local files/diff, evidence, uncertainty, unchanged functionality, shared-style/accessibility risks and undo steps. Do not run commands or access providers, credentials, environment files, browser/keychain state or production systems.
3. Wait for the salesperson's explicit approval of only that exact eligible local scope. No new safeguard activation, role change or permission evidence is a prerequisite under the final agreement.
4. Make only the approved local edit using file-editing tools, without running commands or accessing providers. Preserve unrelated work. Refuse and escalate if any prohibited change becomes necessary; do not broaden scope, weaken checks or seek elevated access.
5. Give management a sanitised local diff and handoff. Management arranges technical review, validation and publication when required. Report validation NOT RUN — management/support review required; never claim missing results PASS or a local edit live. Do not independently run builds, tests, migrations, deployments, database operations, installs or workflow triggers, or publish changes.
6. Leave any separately approved release to an authorised operator. State clearly that local edit approval is not production release approval, and receipt of documentation is not operational/security acceptance.

Finish with approved scope, exact files, local/unreleased status, risks, undo proposal and pending technical steps. If support is unavailable, tell management and leave those steps pending. Procedural instructions do not technically prevent prohibited actions; actual rights may be broader.

## Review, validation and escalation

Management arranges technical support when required for investigation, review, validation, publication or release. Code-check obligations remain in [TECHNICAL_HANDOVER.md](TECHNICAL_HANDOVER.md#verification): baseline and all required after-change results must be reported honestly. Support handles any authorised database check without giving credentials to the salesperson; no unsafe production action is implied. Missing required checks block release; documentation-only work needs no application checks.

Source installation/build/test and previews can execute code or use live services. Do not claim they are isolated or secret-free; this remains unverified. Management must authorise a suitable validation/release route for each change. Separate approval is needed before publication that could trigger deployment. No new technical PR/ownership gate is assumed.

For outages, wrong figures, login or integration failures, collect safe business symptoms and use [EMERGENCY_PROCEDURES.md](EMERGENCY_PROCEDURES.md). If support is not available, notify management and leave technical work pending. The departing developer has no ongoing training, troubleshooting, maintenance or support obligation.
