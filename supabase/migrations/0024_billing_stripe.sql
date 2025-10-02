-- Stripe Billing integration tables
-- Customers mapping (company -> stripe customer)
create table if not exists public.stripe_customers (
  company_id uuid primary key references public.companies(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Subscriptions (one active per company typical, but allow many for history)
create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status text check (status in (
    'trialing','active','incomplete','incomplete_expired','past_due','canceled','unpaid','paused'
  )) not null,
  cancel_at timestamp null,
  cancel_at_period_end boolean default false,
  current_period_start timestamp null,
  current_period_end timestamp null,
  trial_end timestamp null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Invoices/Payments (latest payments)
create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_subscription_id text,
  hosted_invoice_url text,
  status text,
  currency text,
  amount_due bigint,
  amount_paid bigint,
  amount_remaining bigint,
  created_at timestamp default now(),
  invoice_date timestamp null
);

-- Optional: store webhook events for debugging/auditing
create table if not exists public.stripe_events (
  id text primary key, -- stripe event id
  type text not null,
  created_at timestamp default now(),
  payload jsonb not null
);

-- Ensure updated_at helper exists and attach to tables
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists set_updated_at on public.stripe_customers;
create trigger set_updated_at before update on public.stripe_customers for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.billing_subscriptions;
create trigger set_updated_at before update on public.billing_subscriptions for each row execute function public.set_updated_at();

-- RLS: enable and scope to current company
alter table public.stripe_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.stripe_events enable row level security;

-- Policies (drop-if-exists then create)
drop policy if exists stripe_customers_company_select on public.stripe_customers;
create policy stripe_customers_company_select on public.stripe_customers for select using (company_id = public.current_company_id());
drop policy if exists stripe_customers_company_mod on public.stripe_customers;
create policy stripe_customers_company_mod on public.stripe_customers for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists subs_company_select on public.billing_subscriptions;
create policy subs_company_select on public.billing_subscriptions for select using (company_id = public.current_company_id());
drop policy if exists subs_company_mod on public.billing_subscriptions;
create policy subs_company_mod on public.billing_subscriptions for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

drop policy if exists invoices_company_select on public.billing_invoices;
create policy invoices_company_select on public.billing_invoices for select using (company_id = public.current_company_id());
drop policy if exists invoices_company_mod on public.billing_invoices;
create policy invoices_company_mod on public.billing_invoices for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

-- Events are readable by admins of the current company only if linked via payload; for simplicity block all except service role (no select policy)
drop policy if exists events_select on public.stripe_events;
-- Intentionally no select policy (service role bypasses RLS). Prevent inserts by clients as well.
drop policy if exists events_all on public.stripe_events;
create policy events_block_all on public.stripe_events for all using (false) with check (false);
