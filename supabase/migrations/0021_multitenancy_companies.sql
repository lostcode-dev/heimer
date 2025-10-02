-- Companies and multitenancy wiring
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- user to company link (1 user -> 1 company for simplicity)
create table if not exists public.user_companies (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role text check (role in ('OWNER','ADMIN','MEMBER')) default 'MEMBER'
);

alter table if exists public.users enable row level security;
alter table public.user_companies enable row level security;
create policy user_companies_self on public.user_companies for select using (user_id = auth.uid());

-- helper to get current user's company id from user_companies
create or replace function public.current_company_id() returns uuid language sql stable as $$
  select company_id from public.user_companies where user_id = auth.uid() limit 1
$$;

-- Add company_id to core domain tables
alter table if exists public.customers add column if not exists company_id uuid references public.companies(id);
alter table if exists public.devices add column if not exists company_id uuid references public.companies(id);
alter table if exists public.products add column if not exists company_id uuid references public.companies(id);
alter table if exists public.services add column if not exists company_id uuid references public.companies(id);
alter table if exists public.technicians add column if not exists company_id uuid references public.companies(id);
alter table if exists public.suppliers add column if not exists company_id uuid references public.companies(id);
alter table if exists public.service_orders add column if not exists company_id uuid references public.companies(id);
alter table if exists public.service_order_items add column if not exists company_id uuid references public.companies(id);
alter table if exists public.inventory_movements add column if not exists company_id uuid references public.companies(id);
alter table if exists public.cash_sessions add column if not exists company_id uuid references public.companies(id);
alter table if exists public.cash_movements add column if not exists company_id uuid references public.companies(id);
alter table if exists public.payments add column if not exists company_id uuid references public.companies(id);

-- Backfill: set existing rows to the current user's company via a placeholder function call in app layer (cannot set at migration time generically)
-- You should run an admin script to create a default company and link existing users, then update rows setting company_id.

-- RLS: limit select/update/insert/delete to current_company_id()
-- First, enable RLS where not already
alter table public.customers enable row level security;
alter table public.devices enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.technicians enable row level security;
alter table public.suppliers enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;
alter table public.payments enable row level security;

-- Replace permissive policies with company-scoped ones (idempotent via drop-if-exists then create)
drop policy if exists customers_company_select on public.customers;
create policy customers_company_select on public.customers for select using (company_id = public.current_company_id());
drop policy if exists customers_company_mod on public.customers;
create policy customers_company_mod on public.customers for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists devices_company_select on public.devices;
create policy devices_company_select on public.devices for select using (company_id = public.current_company_id());
drop policy if exists devices_company_mod on public.devices;
create policy devices_company_mod on public.devices for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists products_company_select on public.products;
create policy products_company_select on public.products for select using (company_id = public.current_company_id());
drop policy if exists products_company_mod on public.products;
create policy products_company_mod on public.products for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists services_company_select on public.services;
create policy services_company_select on public.services for select using (company_id = public.current_company_id());
drop policy if exists services_company_mod on public.services;
create policy services_company_mod on public.services for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists technicians_company_select on public.technicians;
create policy technicians_company_select on public.technicians for select using (company_id = public.current_company_id());
drop policy if exists technicians_company_mod on public.technicians;
create policy technicians_company_mod on public.technicians for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists suppliers_company_select on public.suppliers;
create policy suppliers_company_select on public.suppliers for select using (company_id = public.current_company_id());
drop policy if exists suppliers_company_mod on public.suppliers;
create policy suppliers_company_mod on public.suppliers for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists orders_company_select on public.service_orders;
create policy orders_company_select on public.service_orders for select using (company_id = public.current_company_id());
drop policy if exists orders_company_mod on public.service_orders;
create policy orders_company_mod on public.service_orders for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists order_items_company_select on public.service_order_items;
create policy order_items_company_select on public.service_order_items for select using (company_id = public.current_company_id());
drop policy if exists order_items_company_mod on public.service_order_items;
create policy order_items_company_mod on public.service_order_items for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists inventory_company_select on public.inventory_movements;
create policy inventory_company_select on public.inventory_movements for select using (company_id = public.current_company_id());
drop policy if exists inventory_company_mod on public.inventory_movements;
create policy inventory_company_mod on public.inventory_movements for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists cash_sessions_company_select on public.cash_sessions;
create policy cash_sessions_company_select on public.cash_sessions for select using (company_id = public.current_company_id());
drop policy if exists cash_sessions_company_mod on public.cash_sessions;
create policy cash_sessions_company_mod on public.cash_sessions for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists cash_mov_company_select on public.cash_movements;
create policy cash_mov_company_select on public.cash_movements for select using (company_id = public.current_company_id());
drop policy if exists cash_mov_company_mod on public.cash_movements;
create policy cash_mov_company_mod on public.cash_movements for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists payments_company_select on public.payments;
create policy payments_company_select on public.payments for select using (company_id = public.current_company_id());
drop policy if exists payments_company_mod on public.payments;
create policy payments_company_mod on public.payments for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
