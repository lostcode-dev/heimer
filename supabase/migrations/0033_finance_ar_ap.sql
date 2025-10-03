-- Finance: Accounts Receivable (AR) and Accounts Payable (AP)

-- RECEIVABLES
create table if not exists public.receivables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid null references public.customers(id) on delete set null,
  description text not null,
  issue_date date null,
  due_date date not null,
  amount numeric(12,2) not null,
  received_total numeric(12,2) not null default 0,
  status text not null check (status in ('OPEN','PARTIAL','PAID','CANCELLED')) default 'OPEN',
  notes text,
  created_at timestamp not null default now()
);

create index if not exists idx_receivables_due_date on public.receivables(due_date);
create index if not exists idx_receivables_status on public.receivables(status);

alter table if exists public.receivables enable row level security;
do $$ begin
  create policy receivables_tenant_isolation on public.receivables for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
exception when others then null; end $$;

-- RECEIVABLE PAYMENTS
create table if not exists public.receivable_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  receivable_id uuid not null references public.receivables(id) on delete cascade,
  amount numeric(12,2) not null,
  method text check (method in ('CASH','CARD','PIX','TRANSFER')) not null,
  received_at timestamp not null default now(),
  cash_session_id uuid null references public.cash_sessions(id) on delete set null,
  notes text
);

create index if not exists idx_receivable_payments_received_at on public.receivable_payments(received_at);
create index if not exists idx_receivable_payments_receivable_id on public.receivable_payments(receivable_id);

alter table if exists public.receivable_payments enable row level security;
do $$ begin
  create policy receivable_payments_tenant_isolation on public.receivable_payments for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
exception when others then null; end $$;

-- PAYABLES
create table if not exists public.payables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_id uuid null references public.suppliers(id) on delete set null,
  description text not null,
  issue_date date null,
  due_date date not null,
  amount numeric(12,2) not null,
  paid_total numeric(12,2) not null default 0,
  status text not null check (status in ('OPEN','PARTIAL','PAID','CANCELLED')) default 'OPEN',
  notes text,
  created_at timestamp not null default now()
);

create index if not exists idx_payables_due_date on public.payables(due_date);
create index if not exists idx_payables_status on public.payables(status);

alter table if exists public.payables enable row level security;
do $$ begin
  create policy payables_tenant_isolation on public.payables for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
exception when others then null; end $$;

-- PAYABLE PAYMENTS
create table if not exists public.payable_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payable_id uuid not null references public.payables(id) on delete cascade,
  amount numeric(12,2) not null,
  method text check (method in ('CASH','CARD','PIX','TRANSFER')) not null,
  paid_at timestamp not null default now(),
  cash_session_id uuid null references public.cash_sessions(id) on delete set null,
  notes text
);

create index if not exists idx_payable_payments_paid_at on public.payable_payments(paid_at);
create index if not exists idx_payable_payments_payable_id on public.payable_payments(payable_id);

alter table if exists public.payable_payments enable row level security;
do $$ begin
  create policy payable_payments_tenant_isolation on public.payable_payments for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
exception when others then null; end $$;
