-- Companies & user_companies for multitenancy, plus helper RPC and basic RLS
begin;

-- companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  tax_id text,
  website text,
  notes text,
  cep text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

-- user_companies (membership)
create table if not exists public.user_companies (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null check (role in ('OWNER','ADMIN','STAFF')) default 'OWNER',
  created_at timestamp not null default now(),
  primary key (user_id, company_id)
);

-- trigger to update updated_at
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;$$;

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();

-- helper: current_company_id (first linked company)
create or replace function public.current_company_id() returns uuid language sql stable security definer as $$
  select company_id from public.user_companies where user_id = auth.uid() limit 1
$$;

-- RLS
alter table public.companies enable row level security;
alter table public.user_companies enable row level security;

-- Companies policies: members can select/update their company; any authenticated can insert a company
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies for select using (
  exists (select 1 from public.user_companies uc where uc.company_id = companies.id and uc.user_id = auth.uid())
);
drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies for update using (
  exists (select 1 from public.user_companies uc where uc.company_id = companies.id and uc.user_id = auth.uid())
);
drop policy if exists companies_insert on public.companies;
create policy companies_insert on public.companies for insert with check (auth.role() = 'authenticated');

-- user_companies policies: user can see own membership; can link self; updates restricted to self rows
drop policy if exists user_companies_select on public.user_companies;
create policy user_companies_select on public.user_companies for select using (user_id = auth.uid());
drop policy if exists user_companies_insert on public.user_companies;
create policy user_companies_insert on public.user_companies for insert with check (user_id = auth.uid());
drop policy if exists user_companies_update on public.user_companies;
create policy user_companies_update on public.user_companies for update using (user_id = auth.uid());

-- Ensure a profile row exists for each auth user
create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.users(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

commit;
