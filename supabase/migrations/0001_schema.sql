-- Schema and core tables
create extension if not exists pgcrypto;
create extension if not exists pg_stat_statements;

-- users profile
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('ADMIN','MANAGER','TECHNICIAN','CASHIER')) default 'TECHNICIAN',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

-- devices
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  brand text not null,
  model text not null,
  imei text,
  color text,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text,
  unit_cost numeric(12,2) not null default 0,
  unit_price numeric(12,2) not null default 0,
  stock_qty integer not null default 0,
  reorder_level integer not null default 0,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

-- service_orders
create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  device_id uuid references public.devices(id),
  ticket_number text unique not null,
  status text check (status in ('OPEN','IN_PROGRESS','AWAITING_PARTS','READY','DELIVERED','CANCELLED')) default 'OPEN',
  problem_description text not null,
  diagnostics text,
  labor_price numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  assigned_to uuid references public.users(id),
  created_at timestamp default now(),
  updated_at timestamp default now(),
  delivered_at timestamp
);

-- service_order_items
create table if not exists public.service_order_items (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid references public.service_orders(id) on delete cascade,
  product_id uuid null references public.products(id),
  description text not null,
  qty integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0
);

-- cash_sessions
create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid references public.users(id),
  closed_by uuid null references public.users(id),
  opened_at timestamp not null default now(),
  closed_at timestamp null,
  opening_amount numeric(12,2) not null default 0,
  closing_amount numeric(12,2),
  notes text
);

-- payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid null references public.service_orders(id) on delete set null,
  method text check (method in ('CASH','CARD','PIX','TRANSFER')) not null,
  amount numeric(12,2) not null,
  received_at timestamp not null default now(),
  notes text,
  cash_session_id uuid null references public.cash_sessions(id) on delete set null
);

-- cash_movements
create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid references public.cash_sessions(id) on delete cascade,
  type text check (type in ('SALE','REFUND','WITHDRAWAL','DEPOSIT','ADJUSTMENT')) not null,
  amount numeric(12,2) not null,
  reference_id uuid null,
  reference_type text check (reference_type in ('PAYMENT','MANUAL')) not null,
  occurred_at timestamp not null default now(),
  notes text
);

-- inventory_movements
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  type text check (type in ('IN','OUT','ADJUSTMENT')) not null,
  qty integer not null,
  reason text,
  reference_id uuid null,
  reference_type text check (reference_type in ('SERVICE_ORDER','MANUAL')) not null,
  occurred_at timestamp not null default now()
);

-- audit_logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamp default now()
);

-- Indexes
create index if not exists idx_service_orders_status on public.service_orders(status);
create index if not exists idx_payments_received_at on public.payments(received_at);
create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_cash_sessions_opened_at on public.cash_sessions(opened_at);

-- Storage buckets (requires supabase/storage)
do $$ begin
  perform storage.create_bucket('tickets', public := true);
exception when others then null; end $$;
do $$ begin
  perform storage.create_bucket('reports', public := false);
exception when others then null; end $$;

-- Ticket number generator function
create or replace function public.generate_ticket_number()
returns text language plpgsql as $$
declare
  year_part text := to_char(now(), 'YYYY');
  seq int;
begin
  select coalesce(max(split_part(ticket_number, '-', 3)::int), 0) + 1 into seq
  from public.service_orders
  where split_part(ticket_number, '-', 2) = year_part;
  return 'SO-' || year_part || '-' || lpad(seq::text, 6, '0');
end;$$;

-- Maintain total_amount via trigger
create or replace function public.recalc_order_total() returns trigger language plpgsql as $$
begin
  update public.service_orders so
  set total_amount = coalesce(labor_price,0) + coalesce(tax_amount,0) - coalesce(discount_amount,0) + (
    select coalesce(sum(total),0) from public.service_order_items soi where soi.service_order_id = so.id
  )
  where so.id = new.service_order_id;
  return new;
end;$$;

create or replace trigger trg_items_total after insert or update or delete on public.service_order_items
for each row execute function public.recalc_order_total();

-- Recalculate total also when updating fields on service_orders
create or replace function public.recalc_order_total_from_order() returns trigger language plpgsql as $$
begin
  update public.service_orders so
  set total_amount = coalesce(new.labor_price,0) + coalesce(new.tax_amount,0) - coalesce(new.discount_amount,0) + (
    select coalesce(sum(total),0) from public.service_order_items soi where soi.service_order_id = new.id
  )
  where so.id = new.id;
  return new;
end;$$;

create or replace trigger trg_order_total after insert or update on public.service_orders
for each row execute function public.recalc_order_total_from_order();

-- On status READY: decrement stock for product items
create or replace function public.on_order_ready() returns trigger language plpgsql as $$
begin
  if new.status = 'READY' and old.status is distinct from 'READY' then
    insert into public.inventory_movements (product_id, type, qty, reason, reference_id, reference_type)
    select soi.product_id, 'OUT', soi.qty, 'SERVICE READY', new.id, 'SERVICE_ORDER'
    from public.service_order_items soi
    where soi.service_order_id = new.id and soi.product_id is not null;

    update public.products p set stock_qty = stock_qty - (
      select coalesce(sum(qty),0) from public.service_order_items soi where soi.service_order_id = new.id and soi.product_id = p.id
    ) where p.id in (select product_id from public.service_order_items soi where soi.service_order_id = new.id and product_id is not null);
  end if;
  return new;
end;$$;

create or replace trigger trg_order_ready after update on public.service_orders
for each row when (new.status = 'READY') execute function public.on_order_ready();

-- RLS and policies
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.devices enable row level security;
alter table public.products enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_items enable row level security;
alter table public.payments enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.audit_logs enable row level security;

-- Helper to extract role from JWT
create or replace function public.jwt_role() returns text language sql stable as $$
select coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', 'TECHNICIAN')
$$;

-- Generic read policy: deleted_at is null when column exists
create policy customers_read on public.customers for select using (deleted_at is null);
create policy products_read on public.products for select using (deleted_at is null);
create policy service_orders_read on public.service_orders for select using (true);
create policy devices_read on public.devices for select using (true);
create policy payments_read on public.payments for select using (true);
create policy cash_sessions_read on public.cash_sessions for select using (true);
create policy cash_movements_read on public.cash_movements for select using (true);
create policy inventory_movements_read on public.inventory_movements for select using (true);
create policy audit_logs_read on public.audit_logs for select using (false);

-- Role-based write policies (simplified)
create policy technician_update_orders on public.service_orders for update using (
  public.jwt_role() in ('TECHNICIAN','MANAGER','ADMIN') and (assigned_to = auth.uid() or public.jwt_role() in ('MANAGER','ADMIN'))
);
create policy orders_insert_any_authenticated on public.service_orders for insert with check (
  public.jwt_role() in ('TECHNICIAN','CASHIER','MANAGER','ADMIN')
);
create policy cashier_insert_payments on public.payments for insert with check (
  public.jwt_role() in ('CASHIER','MANAGER','ADMIN')
);
create policy admin_full_customers on public.customers for all using (
  public.jwt_role() in ('MANAGER','ADMIN')
) with check (public.jwt_role() in ('MANAGER','ADMIN'));

create policy devices_crud_authenticated on public.devices for all using (
  public.jwt_role() in ('TECHNICIAN','CASHIER','MANAGER','ADMIN')
) with check (public.jwt_role() in ('TECHNICIAN','CASHIER','MANAGER','ADMIN'));
create policy customers_insert_authenticated on public.customers for insert with check (
  public.jwt_role() in ('TECHNICIAN','CASHIER','MANAGER','ADMIN')
);
create policy items_crud_authenticated on public.service_order_items for all using (
  public.jwt_role() in ('TECHNICIAN','MANAGER','ADMIN')
) with check (public.jwt_role() in ('TECHNICIAN','MANAGER','ADMIN'));

-- Prevent closing cash session with unreconciled cash payments (enforced in edge function as well)
-- Placeholder invariant check view/rpc could be added here.

-- Defaults for ticket number
create or replace function public.set_ticket_number() returns trigger language plpgsql as $$
begin
  if new.ticket_number is null then
    new.ticket_number := public.generate_ticket_number();
  end if;
  return new;
end;$$;

create or replace trigger trg_set_ticket before insert on public.service_orders
for each row execute function public.set_ticket_number();
