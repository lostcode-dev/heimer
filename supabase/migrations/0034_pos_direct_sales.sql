-- POS-style direct sales (multi-items and multi-payments)

create table if not exists public.direct_sale_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid null references public.customers(id) on delete set null,
  total numeric(12,2) not null default 0,
  occurred_at timestamp not null default now(),
  notes text
);

create index if not exists idx_direct_sale_orders_occurred_at on public.direct_sale_orders(occurred_at);

alter table if exists public.direct_sale_orders enable row level security;
do $$ begin
  create policy direct_sale_orders_tenant on public.direct_sale_orders for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
exception when others then null; end $$;

create table if not exists public.direct_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.direct_sale_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  qty integer not null,
  unit_price numeric(12,2) not null,
  total numeric(12,2) not null
);

create index if not exists idx_direct_sale_items_sale_id on public.direct_sale_items(sale_id);

alter table if exists public.direct_sale_items enable row level security;
do $$ begin
  create policy direct_sale_items_tenant on public.direct_sale_items for all
  using (exists (select 1 from public.direct_sale_orders o where o.id = sale_id and o.company_id = public.current_company_id()))
  with check (exists (select 1 from public.direct_sale_orders o where o.id = sale_id and o.company_id = public.current_company_id()));
exception when others then null; end $$;

create table if not exists public.direct_sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.direct_sale_orders(id) on delete cascade,
  method text check (method in ('CASH','CARD','PIX','TRANSFER')) not null,
  amount numeric(12,2) not null,
  cash_session_id uuid null references public.cash_sessions(id) on delete set null,
  notes text
);

create index if not exists idx_direct_sale_payments_sale_id on public.direct_sale_payments(sale_id);

alter table if exists public.direct_sale_payments enable row level security;
do $$ begin
  create policy direct_sale_payments_tenant on public.direct_sale_payments for all
  using (exists (select 1 from public.direct_sale_orders o where o.id = sale_id and o.company_id = public.current_company_id()))
  with check (exists (select 1 from public.direct_sale_orders o where o.id = sale_id and o.company_id = public.current_company_id()));
exception when others then null; end $$;
