-- Add notes field to service_orders
alter table public.service_orders add column if not exists notes text;
