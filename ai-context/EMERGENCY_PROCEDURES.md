# Emergency procedures

## Role applicability

Read [ROLES.md](../ROLES.md) before any task; it alone selects the active Codex role. Missing, invalid or ambiguous selection defaults to RESTRICTED. Codex must not change its own active role.

The salesperson/routine-maintenance limits, refusal lists, command bans, approval/handoff workflow and restricted sample prompts below apply only in RESTRICTED. In DEVELOPER, authorised full development follows AGENTS.md, engineering standards and applicable technical runbooks; those restricted-only limits do not prohibit it. Role selection grants no operation-specific approval. Destructive operations and production changes still require explicit authorisation; infrastructure/deployment work requires explicit authorisation.

Roles are procedural AI instructions, not technically enforced security boundaries. Switching roles changes no provider permissions or configuration. Historical evidence, readiness/receipt statements and open risks below retain their original dates and status; this update closes no risks. Future changes remain at the company's own risk and responsibility. The departing developer has no ongoing support obligation.

## Final procedural routine-maintenance role

Only specifically approved minor text, label and styling changes within existing functionality are allowed by the [final policy](RESTRICTED_MAINTENANCE_POLICY.md). Emergencies do not extend this scope. Codex must refuse database, authentication, pricing, integration, feature or infrastructure repairs and direct you to management/technical support. Management arranges support when required; no ongoing duty falls to the departing developer. Existing permissions/settings remain unchanged; no new safeguards are mandatory, and procedural limits do not technically prevent prohibited actions. Existing infrastructure risks and actual operational readiness remain unverified/open.

## Take these steps first

1. Stop repeating the failed action. Record when the problem started and what work is affected.
2. Contact the named technical support provider and management through the private company incident channel. Use the backup contact if the main contact is unavailable. Contacts and response arrangements still need management confirmation; see [Responsibilities and escalation](RESPONSIBILITIES_AND_ESCALATION.md).
3. If no support contact has been appointed, notify management immediately and leave the incident open. Do not take over infrastructure repairs.
4. Do not deploy, roll back, restore data, replay a job, rotate credentials or ask Codex to perform those operations.
5. If customer information or credentials may have been exposed, tell management/support immediately through the private channel. Do not post the suspected secret or affected data in GitHub.

## Website unavailable or showing errors

1. Open the normal company-confirmed bookmark and refresh once. Do not try old deployment URLs as substitutes.
2. Check whether an ordinary unrelated website opens and ask one colleague whether the Hub is also affected. Record the results; do not diagnose the infrastructure yourself.
3. Send the page, safe error message, start time and business impact to support and management.
4. Support determines whether this is an application, hosting, network, access or database incident. Management approves any production intervention.
5. Use only a management-approved business fallback. Do not start a local server or publish a new copy as an outage workaround.

## Login or password recovery fails

1. Confirm the normal website and your own sign-in email. Try signing in once; record the exact safe message.
2. If you need to reset your own password, use the normal Forgot Password option, check inbox/spam and use the newest email. Keep the link and chosen password private. Do not repeatedly request emails.
3. If the latest link fails, no email arrives or several people cannot log in, contact support. An authorised administrator may use the existing reset action if it is deployed and within their role; you do not gain that authority through this guide.
4. Do not ask Codex to bypass login, reactivate membership, invent a temporary password or change the email template.
5. Support checks the deployed flow, email delivery and permissions. Live recovery acceptance and private settings remain unverified in the [infrastructure checklist](INFRASTRUCTURE_REMAINING_ACTIONS.md).

## Sales figures look wrong or stale

1. Confirm the month, year and dashboard view. Refresh once and note any last-update time shown.
2. Record one affected metric, its displayed value and the trusted source/expected value. Keep confidential business details in the private support channel.
3. Notify management before relying on the disputed figure for a business decision or circulating it as confirmed.
4. Do not change Final Values, targets, source rows or saved history to hide the problem. Do not press sync repeatedly.
5. Support investigates the source, scheduled job and calculation. Monday and EPCC own different fields; the [dashboard reference](reference/SALES_DASHBOARD.md) explains this separation.

## Calculator pricing looks wrong

1. Keep the calculator name, garment, quantity, currency, decoration, VAT/delivery selections and current result before leaving the page. Drafts are not saved.
2. Record a trusted expected example, if available, and tell management before issuing or relying on the affected quote. Ask management how to handle quotes already sent.
3. Do not alter markups, tax rates, price lists, exchange assumptions, rounding or formulas, even if Codex offers a one-line fix.
4. Ask support to compare the example against approved business rules and current source data. Management must approve the intended pricing rule.
5. UK Standard has no implemented pricing engine; do not assume it can produce a priced quote. Refer to the [calculator reference](reference/CALCULATORS.md).

## Monday, EPCC/Gmail, Snuggle or Analytics fails

1. Record the affected view, reporting period, last successful update if shown and first observed failure.
2. Ask the responsible business owner whether the upstream board or report is available. View diagnostics only if your current account already permits it.
3. Send the evidence to support. Do not request tokens, change board mappings, reconnect mailboxes or repeatedly run imports.
4. Never open cron URLs as a health check. The scheduled endpoints can change data even when opened with a browser request.
5. Support checks provider access, job history, skipped rows and source availability, then seeks separate approval for any repair or replay. The personal Monday credential transfer remains open; a failure does not prove a code defect. See [ingestion operations](operations/INGESTIONS_AND_CRONS.md).

## A deployment or local change fails

1. If the live website failed after a release, record the time and affected workflow and contact support/management immediately. Do not click Rollback, Promote or Redeploy.
2. If only the local project changed, stop Codex and preserve the changed-file summary. Do not reset the project or discard unrelated work.
3. Support identifies the actual live version and a compatible known working version, then proposes the intervention for management approval. Current Vercel access and rollback capability remain unverified.
4. A website rollback does not restore deleted database records or reverse database changes. Only appointed support may plan provider-supported data recovery under separate approval.
5. Use the [technical recovery procedures](TECHNICAL_HANDOVER.md) and [remaining infrastructure actions](INFRASTRUCTURE_REMAINING_ACTIONS.md) for the support handoff; do not execute their operational commands yourself.

## Report the incident

1. Fill in this template without secrets or customer information:

   ```text
   Incident: [short description]
   First noticed: [date/time, South Africa]
   Environment: [normal website / local copy / preview / unknown]
   Affected page and people: [scope]
   Business impact: [work blocked or values in doubt]
   Expected result: [what should happen]
   Actual result and safe error: [what happened]
   Last known working time: [time or unknown]
   Steps tried once: [safe actions]
   Recent change/release: [known details or unknown]
   Codex/local changes: [none / safe file summary / unknown]
   Checks already reported: [results or not run; do not run them for this report]
   Contacted: [record privately]
   Requested next step: [technical assessment / management decision]
   ```

2. Send it through the management-approved private channel. Do not open a public GitHub issue containing private operational details.
3. Management confirms an owner and next update time. Support records diagnosis, any approved intervention and acceptance evidence.
4. Confirm that your normal workflow works when support asks. Close the incident only after support and the relevant business owner accept the result. An AI statement, success message or green build alone is insufficient.
