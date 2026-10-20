-- Reassert the current-board read contract for application sessions and
-- server-side operational callers. The function retains its own access check,
-- so granting EXECUTE does not bypass organisation scoping.
grant execute on function public.read_sales_checklist(uuid)
to authenticated, service_role;
