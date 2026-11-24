Active Role: RESTRICTED

# Codex maintenance roles

## Selection and authority

Codex must read this file before undertaking any task. The company selects the role by manually changing only the first line to `Active Role: RESTRICTED` or `Active Role: DEVELOPER`. No other documentation needs to change when switching roles.

Use exactly one active-role setting, on the first line, with one of those two values. If this file is missing, unreadable, invalid or ambiguous (including conflicting or duplicate settings), default to RESTRICTED. An operator's job title or a request for broader work does not select DEVELOPER.

Codex must not change its own active role. If a request exceeds the selected role, explain the boundary and refer it to management or technical support; the company must make any role selection manually.

This file governs role selection and the applicability of maintenance restrictions throughout AGENTS.md and the AI-context, maintenance and handover documentation. Restricted salesperson workflows, refusal lists, command bans and mandatory technical handoffs apply when RESTRICTED is active. They do not prohibit authorised development when DEVELOPER is active. Historical audits, risk disclosures and evidence remain records of their stated dates, not new role restrictions or current verification.

Changing roles does not automatically authorise any particular operation. Follow the user's authorised task scope, existing engineering standards and normal development practices. Preserve unrelated work and protect credentials in either role.

## RESTRICTED

- Minor text, label and styling changes only.
- Preserve existing functionality and business logic.
- Follow [the restricted maintenance policy](ai-context/RESTRICTED_MAINTENANCE_POLICY.md), including proposing the exact eligible local files/diff and obtaining specific approval before editing.
- Refuse work outside the permitted scope and refer it to management or technical support.
- Do not inspect credentials/provider sessions, execute application/package/check commands, commit, push, merge or deploy in the restricted maintenance session. Management arranges technical review, validation and any separately authorised release.

## DEVELOPER

Within the authorised task scope, full application development is permitted, including:

- New features, pages and components.
- Changes to existing functionality and business logic.
- Calculator development and pricing logic.
- Database schema, migrations and RLS.
- Authentication and authorisation.
- APIs and integrations.
- Dependencies and configuration.
- Testing, debugging and verification.
- Infrastructure and deployment work when explicitly authorised.

Follow the engineering standards in [AGENTS.md](AGENTS.md) and [ENGINEERING_STANDARDS.md](ai-context/development/ENGINEERING_STANDARDS.md), plus applicable technical runbooks and review/release requirements. Restricted-only command bans and salesperson approval/handoff steps do not apply to authorised development. Report verification honestly; missing required results block release. Documentation-only changes need no application checks.

Destructive operations and production changes still require explicit authorisation. Role selection alone is not permission to change GitHub, Supabase or Vercel permissions/settings, credentials or infrastructure, or to commit, push, deploy, restore data or replay jobs. Obtain the authorisation appropriate to the particular operation and account for existing deployment automation.

## Procedural limits and responsibility

These roles are procedural AI instructions, not technically enforced security boundaries or application user roles. They do not grant or revoke access, restrict actual account capabilities, protect secrets, enforce review or prevent automatic deployment. Existing GitHub, Supabase and Vercel permissions/configuration remain unchanged by this documentation and by switching roles. No new infrastructure safeguard is required to activate either role.

Future changes remain at the company's own risk and responsibility. Management owns authorisation, risk decisions and arranging technical support when required. Historical audit evidence, outstanding infrastructure/security risks and unverified operational readiness remain disclosed until separately resolved with evidence; selecting DEVELOPER closes none of them.

The departing developer has no ongoing maintenance, troubleshooting, training, incident-response or support obligation.
