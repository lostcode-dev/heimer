-- Suppliers table
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz,
  name text not null,
  email text,
  phone text,
  notes text,
  is_active boolean not null default true,
  cep text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text
);

-- basic index
create index if not exists suppliers_created_at_idx on public.suppliers (created_at desc);
create index if not exists suppliers_deleted_at_idx on public.suppliers (deleted_at);
create index if not exists suppliers_is_active_idx on public.suppliers (is_active);
create extension if not exists pg_trgm;
create index if not exists suppliers_name_trgm on public.suppliers using gin (name gin_trgm_ops);
