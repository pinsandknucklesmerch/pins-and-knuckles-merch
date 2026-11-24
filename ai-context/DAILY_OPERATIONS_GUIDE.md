# Daily operations

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Use the normal Hub website

1. Open the company-confirmed Hub bookmark. Ask management for it if missing; do not guess from old deployment URLs.
2. Sign in with your own existing approved account. Routine maintenance does not change account rights or authorise administrative actions, even if your account technically permits them.
3. Check the reporting month/year and view before using figures. Report unexpected values; do not change Final Values, targets, pricing or calculations as a repair.
4. Update only your assigned checklist duties through normal controls. Status clicks save immediately. Do not use Clear All as troubleshooting. See [checklist reference](reference/SALES_WEEKLY_CHECKLIST.md).
5. Keep a useful calculator example before leaving/refreshing: drafts are not saved. UK Standard has no implemented pricing engine. See [calculator reference](reference/CALCULATORS.md) and [reporting reference](reference/SALES_DASHBOARD.md).

## Open VS Code and the project

1. Open Visual Studio Code from your application menu.
2. Choose File → Open Folder and select the company-provided Pins Hub project. Ask management if the location is unclear. Do not borrow another person's account or copy credentials; no new workspace-isolation safeguard is required or claimed by the final policy.
3. Confirm `AGENTS.md`, `ai-context/SALES_AI_CONTEXT.md` and `ai-context/RESTRICTED_MAINTENANCE_POLICY.md` are visible. If missing, ask support for the correct folder.
4. Read the [support guide](HUB_SUPPORT_GUIDE.md). Do not install extensions, copy production configuration, trust unfamiliar files or widen access to resolve setup issues.

## Start Codex

1. Open the company-approved Codex panel/application and select the same company project. Ask management to arrange help if the installed setup is unclear; no API keys or account purchases are needed from you without their arrangement.
2. Use your own approved account. Existing GitHub, Supabase and Vercel permissions/settings remain unchanged. Do not use provider access or another person's token for a routine text/style request.
3. Start a new conversation and paste:

   ```text
   Read ROLES.md first, then AGENTS.md. For RESTRICTED, read ai-context/SALES_AI_CONTEXT.md and ai-context/RESTRICTED_MAINTENANCE_POLICY.md. The following prompt is for RESTRICTED only. Use restricted routine maintenance. Inspect non-secret source only. Request: [minor text/label/style change within existing functionality]. Do not edit yet, execute commands/checks, inspect secrets, access Supabase/providers, call APIs, commit, push, merge or deploy. Propose the smallest allowlisted diff or escalate. Leave permissions and infrastructure unchanged; refuse prohibited work and refer me to management/support. No new technical-safeguard activation is required or claimed.
   ```

4. Ask for a plain-language proposal. Your allowed change list is in [MAKING_CHANGES_GUIDE.md](MAKING_CHANGES_GUIDE.md). Approve only an eligible exact local diff after reading the proposal. No new safeguard activation is required. Procedural limits do not technically prevent prohibited actions; actual operational readiness remains unverified.
5. For a live error rather than a routine UI request, use [EMERGENCY_PROCEDURES.md](EMERGENCY_PROCEDURES.md). Ordinary business actions in the normal browser are separate from maintenance; that browser necessarily uses Supabase-backed application services.

## View a proposed result safely

1. Review the local changed lines and a support-provided sanitised screenshot or isolated presentation preview, if available.
2. Do not start the full local Hub, run `npm run dev`, install packages, execute tests/builds or open arbitrary preview deployments in the salesperson workspace. No verified secret-free presentation runtime exists in this checkout.
3. Management arranges technical support when validation or preview help is required. Existing preview isolation is unverified; no new preview infrastructure is mandated here. A local URL or Vercel preview can otherwise use the production database or credentials. Missing visual preview is a support handoff, not a reason to request production environment files.

## Close safely

1. Save business notes/exports only in approved company storage; keep customer data and secrets out of the public repository.
2. Stop Codex if active and wait for its summary. Stopping does not undo edits; preserve uncertain work for support.
3. Close the normal website and sign out as required by company policy. Do not inspect or alter provider sessions or infrastructure as part of routine closing; existing permissions are unchanged.
4. Close VS Code. If code/configuration changes are unclear, cancel closing and ask support; do not Save All or Discard All blindly.
5. Do not Commit, Sync Changes, Push, Merge or Deploy. Give the local diff summary to management, which arranges technical review, validation and publication when required. Local edit approval is not production release approval.

Documentation is prepared for delivery; actual receipt is not recorded and operational/security readiness is not established by these instructions.
