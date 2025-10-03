-- Direct product sales (outside service orders)

create table if not exists public.direct_sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  product_id uuid not null references public.products(id) on delete restrict,
  customer_id uuid null references public.customers(id) on delete set null,
  qty integer not null check (qty > 0),
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  method text check (method in ('CASH','CARD','PIX','TRANSFER')) not null,
  cash_session_id uuid null references public.cash_sessions(id) on delete set null,
  occurred_at timestamp not null default now(),
  notes text,
  created_at timestamp not null default now()
);

alter table public.direct_sales enable row level security;

-- Multitenancy policies
do $$ begin
  perform 1 from pg_policies where schemaname='public' and tablename='direct_sales' and policyname='direct_sales_company_select';
  if not found then
    create policy direct_sales_company_select on public.direct_sales for select using (company_id = public.current_company_id());
  end if;
  perform 1 from pg_policies where schemaname='public' and tablename='direct_sales' and policyname='direct_sales_company_mod';
  if not found then
    create policy direct_sales_company_mod on public.direct_sales for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
  end if;
end $$;

grant select on public.direct_sales to anon, authenticated;
