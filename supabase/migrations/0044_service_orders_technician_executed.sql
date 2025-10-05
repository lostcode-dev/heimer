-- Add technician_id and executed_service to service_orders to support UI details
alter table if exists public.service_orders
  add column if not exists technician_id uuid null references public.technicians(id) on delete set null,
  add column if not exists executed_service text null;

create index if not exists service_orders_technician_id_idx on public.service_orders (technician_id);
