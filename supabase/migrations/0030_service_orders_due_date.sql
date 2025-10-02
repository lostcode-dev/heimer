-- Add optional due_date to service_orders for expected delivery tracking
alter table if exists public.service_orders
  add column if not exists due_date timestamp null;

create index if not exists idx_service_orders_due_date on public.service_orders(due_date);
