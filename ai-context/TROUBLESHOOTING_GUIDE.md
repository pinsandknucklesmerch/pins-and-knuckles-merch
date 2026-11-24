# Troubleshooting

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Final procedural maintenance boundary

Use [RESTRICTED_MAINTENANCE_POLICY.md](RESTRICTED_MAINTENANCE_POLICY.md). Only minor text, label and styling changes within existing functionality may be proposed and specifically approved locally. Codex refuses prohibited requests and refers to management or technical support. Existing GitHub/Supabase/Vercel permissions/settings remain unchanged; no new safeguards or technical activation checks are required. These instructions do not technically prevent prohibited actions or prove account isolation. Do not inspect secrets/providers, execute application/check commands or publish as routine troubleshooting. Management arranges support when needed.

## Start safely

1. Note what you were doing, the exact message and the South African date/time. State whether the problem affects the company website, VS Code, Codex or a local copy.
2. Save any useful business notes before refreshing or closing. Calculator drafts are not saved.
3. Try only the safe steps below. Stop after one unsuccessful retry rather than repeating sign-ins, resets or synchronisation.
4. Use [Emergency procedures](EMERGENCY_PROCEDURES.md) if the live website or business figures are affected. Use [Responsibilities and escalation](RESPONSIBILITIES_AND_ESCALATION.md) to find who owns the next step.

## VS Code

| Problem | Safe steps | Stop and ask technical support when |
| --- | --- | --- |
| Wrong folder or missing project files | 1. Choose File → Open Folder. 2. Select the folder support supplied. 3. Look for `AGENTS.md`, `ai-context/HUB_SUPPORT_GUIDE.md` and `package.json`. | You cannot find that folder or the files. Do not create a replacement project or download an arbitrary copy. |
| A trust, extension or permission prompt appears | 1. Read the exact prompt. 2. Confirm the project and software with support. | It asks to trust unfamiliar code, install software or widen access. Do not select a broad “always allow” option to get past a problem. |
| VS Code is stuck | 1. If controls respond, stop Codex and preserve its summary. 2. Save only your own notes. 3. Close and reopen once if there is no active command or uncertain unsaved work. | It cannot close normally, a command may still be running or unsaved code is unclear. Do not force-kill processes or discard work. |
| Files show changed markers or an unsaved dot | 1. Leave them in place. 2. Ask Codex to explain the changed files without editing. 3. Send the summary privately to support. | You do not know why they changed. Do not use Discard All, Reset, Save All or Sync Changes as a repair. |

## GitHub and source control

| Problem | Safe steps | Stop and ask technical support when |
| --- | --- | --- |
| Sign-in or repository access fails | 1. Use your own company-approved account. 2. Confirm the repository with support. 3. Record the safe error text. | Access is denied, the repository is missing or someone suggests another person's token. Company access remains subject to confirmation. |
| Push/Sync is rejected, branches differ or a merge conflict appears | 1. Stop the operation. 2. Record the message and affected files. 3. Ask support to reconcile the work. | Always. Do not force push, pull blindly, delete branches or resolve code conflicts by guessing. |
| Git is missing or the project is not recognised | 1. Confirm the correct folder is open. 2. Ask support to inspect the installed setup. | It still fails. Do not initialise a new repository or clone over existing work. |

The documented default branch is `main`; protection and successor access are unresolved. Your existing GitHub permissions remain unchanged and are not certified by this guide. A permission denial must not be bypassed; technical ability to push is not authorisation to do so. Do not depend on GitHub to prevent a release. See [Making changes](MAKING_CHANGES_GUIDE.md).

## Node.js and the local website

Local runtime troubleshooting belongs to support. The routine procedure uses non-secret source inspection only; do not run the full local Hub, packages, tests/builds or version/installation commands as a workaround. This section identifies symptoms to report, not an executable setup procedure.

1. Record the safe message and which application showed it.
2. Ask support to inspect the runtime using an appropriate validation setup. Its isolation is unverified and no new infrastructure safeguards are required by this agreement. No approved successor runtime or secret-free presentation server has been demonstrated.
3. Use the table only to identify the report topic; do not copy commands from search results.

| Message or symptom | Safe next step |
| --- | --- |
| `node` or `npm` is not found | Ask support to install/configure the approved runtime. Do not change system settings or install a different version yourself. |
| `package.json` cannot be found | Reopen the support-supplied project folder. If it still fails, send the error to support. |
| Missing packages, unsupported runtime or TypeScript/module errors | Stop and send the message/version information. Do not run `npm install`, `npm ci`, `npm update`, `npm audit fix` or delete `node_modules`/the lockfile as troubleshooting. Installation runs project scripts and belongs to support. |
| A port is already in use | Do not kill processes or start several servers. Ask support whether a local server is already running and which displayed address to use. |
| Missing environment variable, database or integration error | Stop. Do not open, copy or send `.env.local`, tokens or connection strings. Ask support to confirm the private setup and target. |
| The browser cannot open the local page | Do not start or repair the local server. Record the safe error and ask support for a sanitised screenshot or a separately verified isolated presentation preview. Do not deploy to make a local page work. |

Do not use `npm start` or `npm run dev` in the restricted workspace. Build, test and database commands belong to the management-arranged technical validation workflow, not this first-aid sequence. A missing dependency, preview or check is a support handoff; do not supply production configuration to make it run.

## Codex

| Problem | Safe steps | Stop and escalate when |
| --- | --- | --- |
| No Codex panel or application | 1. Ask support which company-approved setup was installed. 2. Open that setup and select Pins Hub. | It is missing. Do not install an unverified extension or use another person's account. |
| Sign-in, subscription, quota or model access error | 1. Record the safe message. 2. Ask management/support to confirm your account and entitlement. | Payment, credentials, a new API key or wider access is requested. Do not keep retrying or share tokens. |
| Network error or response stops | 1. Record the message. 2. Check whether other ordinary company websites open. 3. If no operation is still running, retry the conversation once. | It persists or a command might already have run. Ask what completed before repeating any instruction. |
| Codex has the wrong project or ignores maintenance boundaries | 1. Stop the task. 2. Start a new conversation with the correct folder and the read-only prompt in [Daily operations](DAILY_OPERATIONS_GUIDE.md). | It proposes broad edits, weakened tests, production actions or access bypasses. Do not approve. |
| Command denied or tool unavailable | 1. Preserve the exact safe message. 2. Ask for an explanation and private handoff. | Extra privileges, installation, credentials or production access would be needed. A missing tool is not permission to bypass restrictions. |

## Collect an error report

1. Record the application/page, expected result, actual result, time, affected people and what you tried once.
2. Copy only the relevant error lines or take a cropped screenshot. Check for customer data, emails, tokens, passwords, reset links and connection strings before sharing.
3. If you cannot tell whether a log is safe, leave it on the company computer and ask support to inspect it privately. Do not attach the whole terminal output or environment file to a public issue.
4. Use the report template in [Emergency procedures](EMERGENCY_PROCEDURES.md#report-the-incident). Keep the issue open until support confirms the outcome.
