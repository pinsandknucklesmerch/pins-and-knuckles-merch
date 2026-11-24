# Pins Merch App — Band-first schema foundation

## Batch 2C-2C: lifecycle and legacy compatibility completion

`20260911170000_finalize_merchbuddy_band_lifecycle.sql` completes the prepared Band-first backend lifecycle slice. It adds direct-owner-only soft revocation for a single existing legacy Tour-user grant and minimal `active`/`revoked` metadata to `merchbuddy_tour_users`. New legacy grants remain frozen. The internal legacy resolver ignores revoked rows, so legacy access remains exact-Tour compatibility only, never creates a Band-wide role, and remains subject to the inactive-Band operational-write lock.

Lifecycle is exposed through restricted status-only RPCs: a direct owner may deactivate a Band; an effective active manager or direct owner may reactivate it. These transitions preserve all data and access records, introduce no hard delete, and do not weaken the existing guard that requires a separate status-only reactivation before changing an inactive Band definition. Inactive Bands remain historically readable to authorized users while normal operational writes stay blocked.

Account-manager associations remain non-authorizing business metadata. Their authenticated mutation remains intentionally deferred: Batch 2B removed the old Organisation-admin mutation paths, and this batch adds none. The prepared migration sequence now covers the Band-first schema, permission helpers, operational RLS cutover, transactional creation, direct ownership/member administration, Organisation relationship/assignment administration, lifecycle controls, and frozen/revocable legacy Tour compatibility. Migrations remain unapplied; the mobile client remains Organisation-first.

## Remaining Band-first rollout after Batch 2C-2C

The authorization and lifecycle slices are complete in prepared migrations only. Remaining work is the scoped account-manager administration decision if a product requirement emerges, a later/manual legacy Tour-user conversion or sunset decision, shared migration application and consumer type regeneration, production/runtime verification, and the separate mobile Band-first selection/gating/provider cutover.

## Batch 2C-2B: Organisation relationship and assignment administration

`20260911160000_manage_merchbuddy_band_organisations.sql` adds explicit Organisation-to-Band relationship lifecycle and per-Band Organisation-member assignment RPCs. A direct Band owner initiates an attachment request; an active member of that exact Organisation with effective Pins Hub or Pins Merch `admin`/ `developer` entitlement must accept it. A relationship alone never grants access, and neither Organisation membership nor Organisation role bypasses the acceptance workflow.

Only a direct Band owner can attach or remove an Organisation, assign a member, change an assignment role, or revoke an assignment. An Organisation representative with the same admin/developer entitlement may only accept a pending request or relinquish that Organisation's own active relationship. Organisation-derived managers cannot administer direct members, ownership, relationships, or assignments.

Assignments are explicit, one Organisation membership to one active relationship at a time, with only `viewer`, `staff`, or `manager` roles. The membership must be active and entitled through Pins Hub or Pins Merch: read caps at viewer; write, admin, and developer cap at manager. No wildcard or future-Band access exists, and owner is direct-membership-only. The resolver continues to require active membership, entitlement, relationship, and assignment, so entitlement/membership loss dynamically removes the Organisation-derived path.

Removal or Organisation relinquishment soft-revokes the relationship and all active assignments beneath it without touching direct Band memberships, ownership, or operational data. A later attachment of the same Organisation is a new pending request requiring acceptance; prior revoked assignments remain revoked until a direct owner explicitly reassigns them. A direct-owner-only lookup returns only minimal active, entitled identity fields for one active attached Organisation; it exposes neither unrelated Organisations nor raw app-access rows.

## Batch 2C-2A: direct membership and ownership administration

`20260911150000_manage_merchbuddy_band_members.sql` adds private direct-member invitations and owner-authorized membership RPCs. Only an active direct Band owner can invite an existing profile, change direct roles, revoke another direct member, or transfer ownership. Organisation-derived managers, Organisation owners, and app administrators do not receive this authority. Pending invitations grant no Band visibility and acceptance is restricted to the invited authenticated profile.

Invitations expire after seven days and are accepted only once. Acceptance revalidates the Band, the invitation target, expiry, and the inviter's current active direct-owner status. Existing active memberships are never silently changed; a revoked membership is reactivated deterministically at the higher of its previous role and the invited role. Role changes are explicit and preserve event provenance in `source` and `metadata`.

Membership revocation is soft (`status = 'revoked'`, `revoked_at`, and `revoked_by`). Members who are not owners may self-leave; owner self-leave and all owner demotions/revocations use the same last-owner protection. Each mutation locks the Band row before checking or changing membership, serializing all RPC ownership changes. The database rejects any operation that would leave zero active direct owners. Ownership transfer requires an existing active direct member, promotes that target first, and optionally demotes the caller to manager (`p_demote_caller` defaults to `true`).

The invitation table and direct membership table remain unavailable for direct authenticated mutation. RPCs use fixed search paths, derive actors from `auth.uid()`, and are executable only by `authenticated`. Organisation relationship/assignment administration remains Batch 2C-2B work.

## Batch 2C-1: transactional Band creation

`20260911140000_create_merchbuddy_bands.sql` adds `create_merchbuddy_standalone_band(p_name text)` and `create_merchbuddy_organisation_band(p_organisation_id uuid, p_name text)`. Both authenticated SECURITY DEFINER RPCs trim and validate the name, require a valid profile, derive actor fields from `auth.uid()`, record fixed `band_creation_rpc` provenance, and return the Band only after its direct active owner exists. Standalone creation uses `organisation_id = NULL`. Managed creation requires active target-Organisation membership plus effective Pins Hub or Pins Merch admin/developer entitlement, then atomically creates the compatibility Organisation relationship, creator's active manager assignment, and independent direct owner membership. No other Organisation member receives access automatically. Raw authenticated Band INSERT remains blocked, and the access tables remain protected from direct client mutation.

Batch 2C-2 still covers invitations/acceptance, role changes/revocation, ownership transfer and last-owner protection, Organisation relationship and assignment administration, scoped lifecycle/legacy-grant operations, and the later mobile client cutover. It does not include those operations in this batch.

## Status and authority

Prepared forward-only migrations, in dependency order:

1. `supabase/migrations/20260911100000_add_merchbuddy_band_first_foundation.sql`:
   schema/integrity foundation.
2. `supabase/migrations/20260911110000_add_merchbuddy_band_permission_helpers.sql`:
   Batch 2A canonical permission helpers and accessible-Bands resolver.
3. `supabase/migrations/20260911120000_cut_over_merchbuddy_band_authorization.sql`:
   Batch 2B atomic operational helper/RLS/grant cutover.

These migrations were not applied or runtime-verified in these implementation
batches. They must be applied in order; later batches do not skip missing
dependencies. Pins Hub remains the shared Supabase migration owner; Pins Merch
App is a consumer. Generated database types have not been regenerated here.

**Band-first operational authorization is defined by Batch 2B.** Foundation and
Batch 2A alone leave the old Organisation-wide policies in place. Batch 2B
atomically replaces them across Bands, Tours, Products, variants, Shows,
inventory, contacts, account-manager associations, and Tour-user grants. After a
successful application of that migration, Organisation entitlement alone no
longer authorizes those records. This describes the prepared migration, not a
claim about the deployed database.

The mobile app remains Organisation-first until its later client cutover. Band
creation and access-administration mutation RPCs remain Batch 2C. In particular,
raw authenticated Band creation is blocked by Batch 2B, so the old Create Band
flow cannot continue after applying it. Direct-only users still require the later
mobile gate/provider changes even though database authorization supports them.

The implementation scope supersedes the earlier production-backfill proposal:
there are no real Bands and only one disposable/test Band. No broad assignment
backfill or manual production owner roster is required.

## Target model

- Band is the workspace, physically retained as `merchbuddy_customers`.
- A Band does not require an Organisation.
- Direct Band roles are `viewer`, `staff`, `manager`, and `owner`.
- Organisation assignment roles are `viewer`, `staff`, and `manager`; owner is
  direct-only.
- An Organisation path will require active membership, eligible Pins Hub/Merch
  entitlement, an active Band-management relationship, and an explicit active
  assignment. Organisation owner/developer status must not bypass assignment.
- Existing one-way Pins Hub to Pins Merch inheritance remains an entitlement
  source. It is unchanged in this foundation batch.
- Band -> Tour -> Products/Shows -> Inventory remains the operational hierarchy.
- Direct and Organisation paths will combine at their highest applicable
  capability. Existing Tour-user scope must not become full Band membership.

The schema below is the foundation. Batch 2A implements role resolution and
read/operate/manage/administer predicates. Batch 2B wires those capabilities into
operational policies. Transactional Band creation and access-administration
mutations remain Batch 2C work.

## Schema contract

All three new tables have UUID `id` primary keys generated with
`gen_random_uuid()`. Their `created_at` and `updated_at` are required
`timestamptz` values defaulting to `now()`. Each reuses the existing
`set_updated_at()` trigger function.

All three also have required `source text default 'manual'` and
`metadata jsonb default '{}'::jsonb`. Named checks require a nonblank source and
an object-valued metadata document. These fields are provenance only, not
permission inputs. No human actor is fabricated for migration-generated rows.

### `merchbuddy_band_members`

| Column | Contract |
| --- | --- |
| `customer_id` | Required Band FK to `merchbuddy_customers.id`; delete restricted |
| `profile_id` | Required direct-member FK to `profiles.id`; delete restricted |
| `role` | Required; `viewer`, `staff`, `manager`, or `owner` |
| `status` | Required; `active` (default) or `revoked` |
| `created_by` | Nullable actor FK to `profiles.id`; set null on profile deletion |
| `revoked_at` | Nullable `timestamptz`; required for revoked rows |
| `revoked_by` | Nullable actor FK to `profiles.id`; set null on profile deletion |

`(customer_id, profile_id)` is unique, including revoked rows. Revocation keeps
the relationship identity. Active rows must have null `revoked_at` and
`revoked_by`; revoked rows require `revoked_at` but may have a null actor for a
system operation or deleted actor.

Explicit authorization indexes:

- `merchbuddy_band_members_profile_status_customer_idx`:
  `(profile_id, status, customer_id)`.
- `merchbuddy_band_members_customer_status_idx`: `(customer_id, status)`.

### `merchbuddy_band_organisations`

| Column | Contract |
| --- | --- |
| `customer_id` | Required Band FK; delete restricted |
| `organisation_id` | Required FK to `organisations.id`; delete restricted |
| `status` | Required; `pending` (default), `active`, or `revoked` |
| `requested_at` | Required `timestamptz`, default `now()` |
| `requested_by` | Nullable profile actor FK; set null on deletion |
| `accepted_at` | Nullable `timestamptz`; required for active relationships |
| `accepted_by` | Nullable profile actor FK; set null on deletion |
| `revoked_at` | Nullable `timestamptz`; required for revoked relationships |
| `revoked_by` | Nullable profile actor FK; set null on deletion |

Unique keys:

- `(customer_id, organisation_id)` preserves one relationship identity.
- `(id, organisation_id)` supports the assignment's composite FK.

State checks require pending relationships to have no acceptance or revocation
metadata, active relationships to have an acceptance timestamp and no revocation
metadata, and revoked relationships to have a revocation timestamp. An acceptance
actor requires an acceptance timestamp. Acceptance actors may be null for
migration/system provenance; this is not a claim of human consent.

Explicit authorization indexes:

- `merchbuddy_band_organisations_org_status_customer_idx`:
  `(organisation_id, status, customer_id)`.
- `merchbuddy_band_organisations_customer_status_idx`: `(customer_id, status)`.

### `merchbuddy_band_organisation_assignments`

| Column | Contract |
| --- | --- |
| `band_organisation_id` | Required relationship identity, part of composite FK |
| `organisation_member_id` | Required membership identity, part of composite FK |
| `organisation_id` | Required shared integrity discriminator for both FKs |
| `role` | Required; `viewer`, `staff`, or `manager`; `owner` is invalid |
| `status` | Required; `active` (default) or `revoked` |
| `created_by` | Nullable profile actor FK; set null on deletion |
| `revoked_at` | Nullable `timestamptz`; required for revoked rows |
| `revoked_by` | Nullable profile actor FK; set null on deletion |

`(band_organisation_id, organisation_member_id)` is unique, including revoked
rows. Active/revoked metadata checks match direct Band memberships.

Same-Organisation integrity is enforced declaratively:

1. Add `organisation_members_id_organisation_key`, unique on the existing
   `organisation_members(id, organisation_id)` columns.
2. Assignment `(band_organisation_id, organisation_id)` references
   `merchbuddy_band_organisations(id, organisation_id)`.
3. Assignment `(organisation_member_id, organisation_id)` references
   `organisation_members(id, organisation_id)`.
4. Both composite FKs use `ON UPDATE RESTRICT ON DELETE RESTRICT`.

The same required `organisation_id` must satisfy both references. A mismatch,
null discriminator, or referenced parent Organisation change is rejected. This
does not depend on unrelated FKs or an application-side validation query.

Explicit authorization/FK indexes:

- `merchbuddy_band_org_assignments_relationship_org_status_idx`:
  `(band_organisation_id, organisation_id, status)`.
- `merchbuddy_band_org_assignments_member_org_status_idx`:
  `(organisation_member_id, organisation_id, status)`.

Primary and unique constraints also create their supporting unique indexes.
Assignments do not copy the Band ID: it resolves through the relationship.
The foundation does not enforce entitlement or active-parent checks on privileged
inserts. Batch 2A permission resolution evaluates those conditions from current
database state; privileged inserts alone do not make an invalid path authorized.

## Band/Tour decoupling and retained data

The migration first adds the fully validated, unconditional
`merchbuddy_tours_customer_fkey` from `merchbuddy_tours.customer_id` to
`merchbuddy_customers.id`, with deletion restricted. It then drops
`merchbuddy_tours_customer_organisation_fkey` and makes both Band and Tour
`organisation_id` columns nullable.

`customer_id` remains required. The individual Organisation FKs and existing
`merchbuddy_customers_id_organisation_key` remain for compatibility. Existing
Organisation values are not cleared or rewritten, but matching Band/Tour
Organisation metadata is no longer a required ownership invariant. Future
authorization must use the canonical Band relationship instead.

No Band or descendant IDs change. Products, variants, Shows, inventory rows,
existing inventory checks/triggers, and direct Tour-user records are untouched.
In particular, the same-Tour Show/variant inventory validator remains intact.

Band `status IN ('active', 'inactive')` remains unchanged. Batch 2B enforces
historical reads and inactive operational-write blocking through the Batch 2A
predicates and the replaced Tour helpers. Direct owners can perform a narrowly
restricted status update; manager reactivation and richer administration remain
Batch 2C decisions/operations. There is no hard-delete or new Tour lifecycle
workflow.

## Narrow test-Band handling

All DDL/backfill is in one transaction. A `SHARE ROW EXCLUSIVE` lock on
`merchbuddy_customers` prevents concurrent Band writes from racing the
precondition and backfill.

- **Zero Bands:** create the schema; no seed access rows.
- **One Band, valid creator profile:** insert one active direct `owner` member
  for `created_by`, preserving the Band ID and descendants. If its existing
  `organisation_id` is populated, insert one active management relationship.
- **One Band, missing/invalid creator:** raise an exception identifying the Band
  ID and `created_by`. The entire migration rolls back. Explicitly determine and
  repair the test creator before retrying; no guessed/ownerless backfill commits.
- **More than one Band:** raise an exception with the count and roll back; review
  the changed data assumptions before approving a revised migration plan.

Seed rows use `source = 'test_band_backfill'` and record the migration identity
plus legacy creator/Organisation IDs in metadata. The active compatibility
relationship has an acceptance timestamp set by the migration and null human
actors. This does not grant Organisation members access in the target model.

**No Organisation-member assignment rows are generated.** No Tour-user rows are
promoted. This is a one-time versioned migration, not a recurring provisioning
routine. The migration has not been applied in this batch, so no live test Band
ID or creator outcome is asserted here.

## RLS and grants

Each new table has RLS enabled and **no policies**. All table privileges are
explicitly revoked from `PUBLIC`, `anon`, `authenticated`, and `service_role` to
neutralize default grants. Only `SELECT`, `INSERT`, and `UPDATE` are then granted
to `service_role`, with schema usage explicitly granted.

- Authenticated and anonymous clients cannot SELECT or mutate these tables.
- No client can self-create or promote a membership or assignment.
- Service-role/database-owner migration work can populate initial rows.
- No service-role DELETE/TRUNCATE grant is added; use soft revocation.
- The foundation adds no helpers or creation RPCs. Batch 2A adds read-only
  SECURITY DEFINER functions described below, without an ownership bypass.

Zero direct client SELECT exposure remains intentional in Batch 2A: the safe
resolver exposes only caller-authorized workspace data and limited provenance.
Last-owner protection, accepted invitations, actor stamping for human operations,
and transactional lifecycle administration remain future authorized-operation
responsibilities.

## Batch 2A: canonical permission helpers and Band resolver

### Authenticated function API

All Band arguments are UUIDs named `target_customer_id`. No function accepts a
caller profile/user ID.

| Function | Return | Meaning |
| --- | --- | --- |
| `get_merchbuddy_band_role(uuid)` | Nullable text | Highest valid Band-wide role, independent of active/inactive Band status |
| `can_access_merchbuddy_band(uuid)` | Boolean | Viewer or greater, including inactive historical workspaces |
| `can_operate_merchbuddy_band(uuid)` | Boolean | Staff, manager, or owner AND active Band; inventory-operation capability |
| `can_manage_merchbuddy_band(uuid)` | Boolean | Manager or owner AND active Band; Tour/Product/Show management capability |
| `can_administer_merchbuddy_band(uuid)` | Boolean | Owner only; includes access administration on inactive Bands |
| `get_accessible_merchbuddy_bands()` | Set of workspace rows | Deduplicated direct, assigned, and legacy Tour-limited workspaces |

Unknown/unauthorized/null Band IDs yield a null role and false predicates.
Active status alone never authorizes access. Reactivation cannot use
`can_manage_merchbuddy_band` as its sole gate because that helper intentionally
rejects inactive Bands: a future status-only operation must check the retained
manager/owner role and restrict the mutation explicitly. Administration capability
does not imply permission to write operational data on an inactive Band.

### Shared role resolution

`merchbuddy_band_access_summary(target_customer_id uuid default null)` is the
internal implementation. It returns one row per Band with `customer_id`,
`effective_band_role`, `has_direct_access`, and `has_organisation_access`.
Its optional null target means all authorized Bands internally. The public scalar
role function additionally filters to the supplied non-null Band ID, so a null
scalar argument cannot become an all-Bands permission check.

Role ranks are `viewer = 1`, `staff = 2`, `manager = 3`, `owner = 4`.

- Direct paths require active Band membership with `profile_id = auth.uid()`.
  Organisation membership and app entitlement are not required.
- Organisation paths join the assignment to its exact membership ID and exact
  management relationship ID, requiring matching Organisation IDs throughout.
  The membership must belong to `auth.uid()` and be active; both the assignment
  and relationship must be active.
- Eligible entitlement is required at read or greater. The existing
  `has_merchbuddy_access_for_organisation(organisation_id, 'read'/'write')`
  helper supplies the ceiling without duplicating Hub/Merch inheritance logic:
  read yields rank 1; write/admin/developer yields rank 3.
- Each Organisation path grants `min(assignment rank, entitlement ceiling)`.
  No Organisation path can reach owner.
- The effective role is the maximum rank over currently valid direct and
  Organisation paths. Provenance booleans describe the presence of valid paths,
  not just the winning path.
- Revoking one path removes only that path. Surviving paths continue to supply
  their current role; if none remain, the Band-wide role is null.
- No role is persisted, and no creator/account-manager/Organisation-owner
  exception creates authorization.

**Same-membership entitlement reuse:** the foundation identity migration already
enforces `UNIQUE (organisation_id, user_id)` on `organisation_members`. After
binding the assignment to the active caller membership, an existing entitlement
check for that Organisation/caller can only find that same membership. It cannot
borrow another user's entitlement or the caller's entitlement in another
Organisation. This uniqueness constraint is part of the reuse contract; if it
ever changes, introduce membership-scoped entitlement resolution before relying
on the Organisation helper. The new functions do not use the historical
`has_merchbuddy_admin_access_for_organisation` owner exception.

### Accessible-Bands response

`get_accessible_merchbuddy_bands()` returns:

| Column | Type | Meaning |
| --- | --- | --- |
| `customer_id` | UUID | Canonical Band ID |
| `name` | Text | Band name |
| `status` | Text | `active` or `inactive` |
| `effective_band_role` | Nullable text | Highest Band-wide role; null for Tour-only workspace |
| `has_direct_access` | Boolean | At least one valid direct path |
| `has_organisation_access` | Boolean | At least one valid Organisation-assignment path |
| `has_legacy_tour_access` | Boolean | At least one existing caller Tour grant in this Band |
| `is_tour_limited` | Boolean | No Band-wide path; entry exists solely through legacy Tour grants |
| `legacy_tour_ids` | UUID array | Only the caller's existing assigned Tour IDs in this Band; empty array if none |

Results have one row per Band ID, including access through multiple Organisations.
They sort active Bands first, then case-insensitive name and Band ID. Both active
and inactive Bands are returned. No access returns an empty set. No raw membership
IDs, permission rows, Organisation directory, or unrelated profile data is exposed.

A direct-only user works without any Organisation or entitlement. An assigned
user requires the complete path above. A user with both receives one row with
both flags and the higher role. Multiple Organisation paths similarly collapse
to one row after each path is independently clamped to its own entitlement.

### Legacy Tour compatibility and staged Tour context

`merchbuddy_legacy_tour_access(target_customer_id uuid default null)` is internal
and returns only caller-matching `merchbuddy_tour_users` grants joined to their
Tours: `customer_id`, `tour_id`, and `legacy_tour_role`. The current legacy table
has no active/revoked state; presence of the existing grant is its validity rule.
No Organisation membership is required for this path.

The workspace RPC aggregates these grants by parent Band. A Tour-only user gets
minimal Band identity, a null Band-wide role, `is_tour_limited = true`, and only
their assigned Tour IDs. All Band-wide predicates remain false for that path.
No sibling Tour IDs or names are returned. When a Band-wide path also exists,
the row retains legacy provenance but is not Tour-limited. If that Band-wide
path is later revoked, the row can fall back to limited Tour access.

`merchbuddy_tour_access_context(target_tour_id uuid)` is internal preparation for
Batch 2B. It resolves Tour -> `customer_id` -> Band and returns:

- `tour_id`, `customer_id`, and `band_status`;
- `effective_band_role`, separately from `legacy_tour_role`.

It returns no row for an unauthorized/null Tour ID. It grants no action by
itself. Future Tour helpers can use it to combine Band authorization and specific
legacy Tour exceptions while enforcing inactive-Band write blocking. Legacy Tour
staff currently has Product/Show writes, whereas new Band staff only has the
inventory-operation capability; preserve or explicitly resolve that distinction
in Batch 2B rather than promoting the legacy role to a Band role.

Batch 2A alone does not replace `can_access_merchbuddy_tour`,
`can_manage_merchbuddy_tour`, or `can_manage_merchbuddy_tour_definition`. Batch 2B
replaces them using this internal context. Listing a limited workspace never
grants access to sibling Tours.

### Execution and RLS security

All nine new functions are `LANGUAGE sql STABLE SECURITY DEFINER` with fixed
`search_path = pg_catalog, public, pg_temp`. Tables and nested domain functions
are schema-qualified. Caller identity comes from `auth.uid()` in the path queries;
missing identity returns no paths, no workspaces, a null role, or false predicates.

The migration revokes execution on all nine functions from `PUBLIC`, `anon`,
`authenticated`, and `service_role`, then grants authenticated execution only on
the six public API functions listed above. The three internal functions have no
client execution grant. Nested calls execute as the migration/function owner,
while `auth.uid()` remains the request user's identity.

Definer-owned reads access the private tables directly without depending on
client SELECT policies or recursively invoking Band/Tour operational RLS. No
access-table grants/policies, mutations, creation RPCs, or existing operational
policies change. Use the trusted migration owner, consistent with existing
definer-helper conventions; these functions must not be owned by an untrusted
client role.

## Batch 2B: atomic operational authorization cutover

### Atomicity and permissive-policy coverage

`20260911120000_cut_over_merchbuddy_band_authorization.sql` uses one transaction
and takes `ACCESS EXCLUSIVE` locks on all nine affected tables before replacing
helpers, policies, grants, and the Band definition guard. It drops all 29 known
policies from the Phase 1/inventory migrations, including the September 9 altered
SELECT policies, before creating the 22 Band-first policies.

After the known-policy drops, an in-transaction catalog guard rejects any
remaining policy on these tables, regardless of its role or command. Unexpected
policy drift raises an exception naming the policy/table and rolls back the
entire transaction. The migration does not silently delete unfamiliar policies or
commit with an OR-combined permissive fallback. This guard is migration logic;
it has not been executed as a verification command in this implementation batch.

### Helpers replaced/added

| Helper | Batch 2B behavior |
| --- | --- |
| `can_access_merchbuddy_tour(uuid)` | Band-wide viewer or greater, OR existing grant for that exact Tour; inactive reads allowed |
| `can_manage_merchbuddy_tour(uuid)` | Active Band manager/owner, OR legacy Tour staff/manager/owner on that Tour |
| `can_manage_merchbuddy_tour_definition(uuid)` | Active Band manager/owner, OR legacy Tour manager/owner on that Tour |
| `can_access_merchbuddy_customer(uuid)` | Band-wide read, OR parent-Band identity visibility from the caller's existing Tour grant |
| `can_operate_merchbuddy_tour(uuid)` (new) | Active Band staff/manager/owner, OR legacy Tour staff/manager/owner on that Tour; used for inventory |

Tour helpers use `merchbuddy_tour_access_context`: canonical
`Tour.customer_id -> Band`, with Band and legacy Tour roles kept separate. Every
operational write helper requires active Band status for both paths. No generic
Organisation role, app entitlement, account-manager association, or creator
shortcut is used as final authorization.

The five caller-safe helpers are SQL/STABLE/SECURITY DEFINER with fixed
`search_path = pg_catalog, public, pg_temp`; execution is revoked from PUBLIC,
anon, authenticated, and service_role, then granted only to authenticated. The
existing private context remains owner-executable, avoiding recursive policy
evaluation through caller-visible Tour tables. No user/profile identity argument
is introduced.

### Policy replacement inventory

Every policy below is authenticated-only. There are no DELETE policies.

| Table | Removed old policy suffixes | New policy names/authority |
| --- | --- | --- |
| `merchbuddy_customers` | `read`, `insert_write`, `update_write` | `merchbuddy_customers_read`: Band read or narrow legacy parent visibility; `merchbuddy_customers_update_owner`: direct owner only; no INSERT |
| `merchbuddy_tours` | `read`, `insert_write`, `update_manage` | `merchbuddy_tours_read`: Band read or exact Tour read; `merchbuddy_tours_insert_manage_band`: active Band manager/owner and caller creator; `merchbuddy_tours_update_manage`: Tour-definition helper |
| `merchbuddy_products` | `read`, `insert_manage`, `update_manage` | Same policy names recreated: Tour read; active Tour-management capability for insert/update |
| `merchbuddy_product_variants` | `read`, `insert_manage`, `update_manage` | Same policy names recreated: through parent Product's Tour; Tour management for insert/update |
| `merchbuddy_shows` | `read`, `insert_manage`, `update_manage` | Same policy names recreated: Tour read; Tour management for insert/update |
| `merchbuddy_show_inventory_counts` | `read`, `insert_manage`, `update_manage` | `merchbuddy_show_inventory_counts_read`: Show's Tour read; `merchbuddy_show_inventory_counts_insert_operate` and `merchbuddy_show_inventory_counts_update_operate`: Show's Tour inventory capability |
| `merchbuddy_customer_contacts` | `read`, `insert_write`, `update_write` | `merchbuddy_customer_contacts_read`: full Band-wide read only; `merchbuddy_customer_contacts_insert_manage_band` and `merchbuddy_customer_contacts_update_manage_band`: active Band manager/owner |
| `merchbuddy_customer_account_managers` | `read`, `insert_admin`, `update_admin`, `delete_admin` | `merchbuddy_customer_account_managers_read_owner`: direct Band owner only; no mutations |
| `merchbuddy_tour_users` | `read`, `insert_admin`, `update_admin`, `delete_admin` | `merchbuddy_tour_users_read_self_or_owner`: grant subject or direct parent-Band owner; no mutations |

The three new Band access tables remain private, with no direct authenticated
SELECT/mutation grants or policies. The Batch 2A accessible-Bands RPC remains the
workspace API.

### Role enforcement and legacy compatibility

For a full Band path on an active Band:

| Capability | Viewer | Staff | Manager | Owner |
| --- | --- | --- | --- | --- |
| Read Band/Tours/Products/Shows/Inventory/report source data | Yes | Yes | Yes | Yes |
| Insert/update Count In/Count Out | No | Yes | Yes | Yes |
| Create/update Tours, Products, variants, Shows | No | No | Yes | Yes |
| Maintain operational Band contacts | No | No | Yes | Yes |
| Update Band name/status | No | No | No | Yes, restricted |
| Create Band or mutate access/legacy-association rows | No | No | No | No; Batch 2C |
| Hard-delete | No | No | No | No |

Organisation-derived roles still cap at manager. Reports inherit authorization
from their Tour/Product/Show/inventory source queries; no privileged aggregate
endpoint or broad report read is added.

Legacy viewer grants read only the assigned Tour and its descendants, plus its
parent Band identity. Legacy staff retains Product/variant/Show and inventory
writes on that Tour only, while legacy manager/owner additionally retains Tour
definition updates. None may create a sibling Tour or administer the Band based
on that legacy grant. New Band staff does not inherit legacy staff's broader
write set unless that user separately holds a qualifying legacy grant on the
specific Tour.

No Tour users are promoted or deleted. Authenticated INSERT/UPDATE/DELETE on
`merchbuddy_tour_users` is frozen, including Organisation admins and Band owners.
Trusted migration/service-role maintenance remains distinct from client grants;
future revocation/conversion must use authorized Batch 2C operations.

### Inactive Bands and definition updates

All operational Tour/Product/variant/Show/inventory/contact writes are denied on
inactive Bands, including legacy paths. Reads remain available at their existing
scope. Band owners can still read associations and their visible access data.

Ordinary Band UPDATE is owner-only and grants only `name` and `status` columns.
The new `merchbuddy_guard_inactive_band_definition()` BEFORE UPDATE trigger
rejects name changes when the old Band status is inactive, even if the same
statement also tries to reactivate it. Owners must first perform a status-only
reactivation, then edit the definition in a separate operation. An active owner
can update the name or archive the Band. Managers do not gain raw reactivation
permission; any future manager status-only workflow belongs to Batch 2C.

The guard is SECURITY INVOKER with a fixed search path, reads only OLD/NEW, and
has no client EXECUTE grant. Existing `set_updated_at()` handling remains intact.

### Column grants and hierarchy protection

The migration clears table-level privileges and any column-level grants from
PUBLIC, anon, and authenticated on the nine operational tables. It then grants
row-policy-scoped SELECT and explicit INSERT/UPDATE column allowlists. There is
no authenticated table-level INSERT/UPDATE, DELETE, TRUNCATE, or REFERENCES grant.

Mutable fields through ordinary authenticated UPDATE are exactly:

| Table | Allowed UPDATE columns |
| --- | --- |
| Bands | `name`, `status` |
| Tours | `name`, `start_date`, `end_date`, `status`, `currency` |
| Products | `name`, `sku`, `sale_price`, `image_path`, `sort_order`, `is_active` |
| Variants | `name`, `starting_quantity`, `sort_order` |
| Shows | `venue_name`, `show_date`, `street_address`, `city`, `postal_code`, `country`, `set_type`, `sell_type`, `notes` |
| Inventory counts | `count_in_quantity`, `count_out_quantity` |
| Contacts | `profile_id`, `name`, `email`, `phone`, `position`, `is_primary` |
| Account-manager associations / Tour-user grants | None |

INSERT allowlists add the required immutable parent references and, for Tours,
`created_by`; Tour INSERT policy requires `created_by = auth.uid()`. Existing
`organisation_id` is accepted on Tour INSERT for older clients as FK-validated
legacy metadata only; it never authorizes the target Band and cannot be updated.
Caller-supplied row IDs and creation/update timestamps are not insertable.

Thus authenticated generic updates cannot change Band/Tour Organisation metadata,
Tour `customer_id`, Product/Show `tour_id`, Variant `product_id`, contact
`customer_id`, or inventory `show_id`/`variant_id`. IDs, creator identities, and
creation timestamps are also protected. Automatically maintained timestamps and
inventory `updated_by` still come from existing defaults/triggers. Parent-setting
upserts must not attempt UPDATE of immutable columns, even to the same value.

Column grants constrain ordinary authenticated SQL/PostgREST mutations. Future
SECURITY DEFINER administration RPCs bypass those grants and must explicitly
enforce their own allowed transitions, identity/parent immutability, and audit
requirements. No such mutation RPC exists in this batch.

Existing same-Tour Show/variant validation, unique Show/variant rows, nonnegative
counts, Count Out prerequisites/upper bound, FKs, and inventory actor/timestamp
triggers are preserved. Preventing generic parent updates also stops clients
from invalidating inventory's previously checked hierarchy via a parent move.

### INSERT RETURNING without broad SELECT

- **Bands:** raw authenticated INSERT is blocked by both grants and absence of a
  policy. Transactional Band-plus-owner creation belongs to Batch 2C.
- **Tours:** SELECT uses the policy row's `customer_id` with
  `can_access_merchbuddy_band(customer_id)`, OR the scoped Tour-read helper for
  existing legacy grants. A newly inserted Tour passes through the existing
  parent Band's permission rows; no lookup of that new Tour in a STABLE helper is
  required. INSERT independently requires management of that same Band.
- **Products/Shows:** SELECT and INSERT authorize their existing `tour_id` parent.
- **Variants:** authorize the existing Product's Tour.
- **Inventory:** authorize the existing Show's Tour; the unchanged integrity
  trigger also requires the variant to belong to that Tour.
- **Contacts:** authorize the existing Band, not the newly inserted contact.

These patterns support ordinary `.insert(...).select()` against existing parents.
They do not promise visibility of a parent itself first created in another CTE of
the same statement; future multi-entity RPCs must sequence writes appropriately.
No Organisation-wide or creator-only SELECT fallback is retained.

### Auxiliary-table decisions

Contacts are full Band-wide operational data; Tour-only parent visibility does
not expose contacts. Managers/owners may mutate contacts only while active.
Account-manager associations remain non-authorizing metadata, readable only by
direct Band owners, with all authenticated mutations deferred to Batch 2C.
Tour-grant rows are readable only by their subject or a direct Band owner; all
authenticated mutations are frozen. These changes prevent directory exposure and
remove the old Organisation-admin grant-management bypass.

### Authorization invariants after successful application

- No policy on any of the nine tables retains an Organisation entitlement or
  Organisation-admin/owner/developer fallback.
- Entitlement is still inherited one way from Pins Hub to Merch through the
  exact assigned membership, within the Batch 2A ceiling. The existing
  `has_merchbuddy_access*` and admin helpers remain callable but are not sufficient
  operational authorization and are not referenced directly by these policies.
- Direct Band members work without an Organisation; legacy grants remain scoped
  to their Tour; unrelated/sibling Tours do not inherit legacy access.
- Every operational write path requires active Band status; new Band staff has
  inventory-count writes only; manager/owner management and legacy exceptions
  are separated explicitly.
- Ordinary authenticated updates cannot reparent records, fabricate actor fields,
  or hard-delete data.

The disposable Band's previously broad Organisation users lose access unless
they have an explicit Band path or an existing scoped Tour grant. No automatic
assignment backfill is added to preserve the old broad model.

## Required Batch 2C and later client work

1. Add transactional standalone/Organisation-managed Band creation with direct
   owner bootstrap, explicit relationship/assignment where appropriate, caller
   eligibility, and safe return visibility. Keep raw Band INSERT blocked.
2. Add authorized direct-member invitations/acceptance, role changes, revocation,
   ownership transfer, and concurrency-safe last-owner protection.
3. Add Organisation relationship request/acceptance/removal and explicit member
   assignment/change/revocation operations. Prevent self-escalation, cross-path
   entitlement mixing, and revival of revoked assignments on reattachment.
4. Provide scoped account-manager administration if needed; keep associations
   non-authorizing. Provide legacy Tour-grant revocation/conversion and the
   compatibility sunset workflow without reopening raw legacy-grant creation.
5. Add the approved lifecycle administration, including any manager status-only
   reactivation, with field restrictions and audit provenance. Privileged RPCs
   must preserve parent identity and inactive operational-write protections.
6. Later, cut over mobile access gating, Band selection, provider scoping, and
   action-specific UI permissions to the Band resolver. Remove reliance on legacy
   Organisation metadata for navigation. Keep this client work separate from the
   database RPC batch.

## Application and types follow-up

Apply the foundation, Batch 2A, and atomic Batch 2B migrations in order through the
shared migration-owning repository after review. Regenerate the authoritative
`src/types/database.types.ts` from the applied schema, then refresh the Pins Merch
consumer snapshot through its normal schema/type workflow. Regeneration must
include the new tables, nullable Band/Tour Organisation IDs, replacement FK
relationships, and function/RPC signatures. Generated signatures do not imply
EXECUTE grants on internal functions. Do not hand-edit generated snapshots or run
an independent consumer `db push`.

Only static source review was performed for this batch. No migration execution,
database runtime checks, lint, tests, typecheck, build, or Git operations were
performed.
