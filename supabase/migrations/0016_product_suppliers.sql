-- Product-Supplier association table
create table if not exists public.product_suppliers (
  product_id uuid not null references public.products(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_sku text,
  supplier_price numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, supplier_id)
);

-- Update trigger for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_product_suppliers_updated_at on public.product_suppliers;
create trigger set_product_suppliers_updated_at
before update on public.product_suppliers
for each row execute function public.set_updated_at();

-- Basic indices
create index if not exists product_suppliers_product_idx on public.product_suppliers (product_id);
create index if not exists product_suppliers_supplier_idx on public.product_suppliers (supplier_id);

-- RLS
alter table public.product_suppliers enable row level security;

-- Policies (read for all auth, write for auth)
create policy if not exists "product_suppliers_select" on public.product_suppliers
  for select to authenticated using (true);
create policy if not exists "product_suppliers_insert" on public.product_suppliers
  for insert to authenticated with check (true);
create policy if not exists "product_suppliers_update" on public.product_suppliers
  for update to authenticated using (true) with check (true);
create policy if not exists "product_suppliers_delete" on public.product_suppliers
  for delete to authenticated using (true);
