-- Fix RLS to allow listing employees (users) by company
-- Problem: users_select_by_company policy checks existence in public.user_companies,
-- but the existing user_companies select policy only permits rows where user_id = auth.uid(),
-- so the subquery cannot see other users' memberships. Result: only the current user appears.
--
-- Solution: Relax user_companies select policy to allow selecting rows for the current company,
-- so existence checks against other users' memberships in the same company succeed.

begin;

-- Ensure current_company_id runs with elevated privileges
create or replace function public.current_company_id() returns uuid
language sql stable security definer as $$
  select company_id from public.user_companies where user_id = auth.uid() limit 1
$$;

-- Adjust user_companies select policy
drop policy if exists user_companies_select on public.user_companies;
create policy user_companies_select on public.user_companies
  for select to authenticated using (company_id = public.current_company_id());

commit;
