-- Fix recursive RLS leading to "stack depth limit exceeded"
-- Context: user_companies SELECT policy was changed to depend on current_company_id(),
-- and current_company_id() queries user_companies. That creates a recursive dependency
-- when evaluating policies for requests (e.g., /rest/v1/service_orders), causing stack overflow.
--
-- Strategy:
-- 1) Introduce a SECURITY DEFINER helper function company_id_for_user(uuid) that can read
--    user_companies without hitting RLS recursion.
-- 2) Recreate users_select_by_company policy to use that helper, enabling listing users in the
--    same company without loosening user_companies RLS.
-- 3) Restore user_companies select policy to a non-recursive rule (user_id = auth.uid()).
-- 4) Refactor current_company_id() to delegate to company_id_for_user(auth.uid()).

begin;

-- 1) Helper: company_id_for_user(uuid)
create or replace function public.company_id_for_user(p_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.user_companies
  where user_id = p_user_id
  limit 1
$$;

-- Allow execution from app role
do $$ begin
  grant execute on function public.company_id_for_user(uuid) to authenticated;
exception when undefined_object then null; end $$;

-- 4) Refactor current_company_id() to use the helper (also SECURITY DEFINER)
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.company_id_for_user(auth.uid())
$$;

-- 2) Users policy: select users that belong to the same company as the caller
drop policy if exists users_select_by_company on public.users;
create policy users_select_by_company on public.users
  for select to authenticated using (
    public.company_id_for_user(users.id) = public.company_id_for_user(auth.uid())
  );

-- 3) Break recursion on user_companies: keep select scoped by caller user_id only
drop policy if exists user_companies_select on public.user_companies;
create policy user_companies_select on public.user_companies
  for select to authenticated using (user_id = auth.uid());

commit;
