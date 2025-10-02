-- Services table for labor items not tied to products
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  category text,
  unit_price numeric(12,2) not null default 0,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

alter table public.services enable row level security;

-- Read policy: allow when not soft-deleted
create policy services_read on public.services for select using (deleted_at is null);

-- Write policies similar to products
create policy services_crud on public.services for all using (
  public.jwt_role() in ('TECHNICIAN','CASHIER','MANAGER','ADMIN')
) with check (public.jwt_role() in ('TECHNICIAN','CASHIER','MANAGER','ADMIN'));

-- Indexes
create index if not exists idx_services_sku on public.services(sku);
create index if not exists idx_services_name on public.services(name);
