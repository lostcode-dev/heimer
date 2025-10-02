-- Extend companies with contact, tax id and address fields; secure with RLS

-- Columns (idempotent)
alter table if exists public.companies add column if not exists email text;
alter table if exists public.companies add column if not exists phone text;
alter table if exists public.companies add column if not exists tax_id text; -- CPF/CNPJ
alter table if exists public.companies add column if not exists website text;
alter table if exists public.companies add column if not exists notes text;
alter table if exists public.companies add column if not exists cep text;
alter table if exists public.companies add column if not exists street text;
alter table if exists public.companies add column if not exists number text;
alter table if exists public.companies add column if not exists complement text;
alter table if exists public.companies add column if not exists neighborhood text;
alter table if exists public.companies add column if not exists city text;
alter table if exists public.companies add column if not exists state text;

-- RLS
alter table public.companies enable row level security;

-- Policies
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies for select to authenticated using (id = public.current_company_id());

drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies for update to authenticated using (id = public.current_company_id()) with check (id = public.current_company_id());

-- Allow creating a company from the app when user has none (bootstrap flow also uses service role)
drop policy if exists companies_insert_any on public.companies;
create policy companies_insert_any on public.companies for insert to authenticated with check (true);
