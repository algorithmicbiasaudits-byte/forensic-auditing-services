-- Fix 1: customers table had no tenant scoping on read at all -- any
-- authenticated user (any client) could read every customer's row,
-- including api_key_hash/webhook_signing_secret columns.
drop policy "Allow authenticated read" on public.customers;

create policy "Tenant-scoped read" on public.customers
  for select
  using (customer_id = get_my_customer_id() or is_platform_admin());

-- Fix 2: compliance_debt had zero tenant isolation -- any authenticated
-- user, any tenant, could read/write/delete any other tenant's rows.
drop policy "compliance_debt_authenticated" on public.compliance_debt;

create policy "Tenant-scoped access" on public.compliance_debt
  for all
  using (exists (
    select 1 from public.rejections r
    where r.rejection_id = compliance_debt.rejection_id
      and (r.customer_id = get_my_customer_id() or is_platform_admin())
  ))
  with check (exists (
    select 1 from public.rejections r
    where r.rejection_id = compliance_debt.rejection_id
      and (r.customer_id = get_my_customer_id() or is_platform_admin())
  ));

-- Fix 3: leads had an anon-writable policy with no legitimate caller --
-- real writes go via the service-role key in server.js, which bypasses
-- RLS entirely; no browser-side code queries leads directly.
drop policy "anon_update_leads" on public.leads;
