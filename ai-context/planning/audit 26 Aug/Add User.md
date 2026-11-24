# Add User

**Route:** `/hub/team/add`

## Purpose

Provision or invite a user into the current organisation’s Pins Hub access model.

## Current state

* Renders `AddUserForm` only for users permitted by `canManageOrganisationUsers`; other users receive not-found.
* Server-side provisioning creates or updates canonical profile, membership, and `pins_hub` app access using the Admin API; existing accounts are updated rather than duplicated.
* Invitation/resend uses Supabase Auth and configured site URLs.

## Issues / unfinished work

* Actual email delivery and production redirect configuration require remote Auth verification.

## Decisions already made

* Preserve server-only Admin API use; never move provisioning credentials/client capability to the browser.
* Keep known Monday member ID unique, preserve existing accounts, and prevent unsafe owner changes.
* Do not weaken owner/developer restrictions on privileged access management.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — privileged provisioning is deliberately server-side; delivery remains operationally unverified.

