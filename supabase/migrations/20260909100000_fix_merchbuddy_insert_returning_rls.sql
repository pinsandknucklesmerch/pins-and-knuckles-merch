-- The mobile Band/Tour creation flows use INSERT ... RETURNING (PostgREST
-- insert().select()). RETURNING also checks the table's SELECT policy.
-- The existing can_access_* helpers are STABLE and look up the target row
-- in the same table. Their statement snapshot cannot see a newly inserted
-- row, so that SELECT check rejects otherwise authorised inserts.
--
-- Evaluate organisation access against the policy row itself. Reuse the
-- shared helper updated by 20260904000000: active membership, direct or
-- inherited access, and the access hierarchy remain enforced centrally.
-- Retain the existing helper branch for access through tour assignments.
-- INSERT policies remain unchanged: organisation write/admin/developer
-- access AND created_by = auth.uid(). Read-only access cannot insert.

begin;

alter policy "merchbuddy_customers_read"
on public.merchbuddy_customers
using (
  public.has_merchbuddy_access_for_organisation(organisation_id)
  or public.can_access_merchbuddy_customer(id)
);

alter policy "merchbuddy_tours_read"
on public.merchbuddy_tours
using (
  public.has_merchbuddy_access_for_organisation(organisation_id)
  or public.can_access_merchbuddy_tour(id)
);

commit;
