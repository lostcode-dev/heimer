-- Add payment_method to service_orders to persist how the order was paid/selected
alter table if exists public.service_orders
  add column if not exists payment_method text null check (payment_method in ('CASH','CARD','PIX','TRANSFER','FIADO'));

create index if not exists service_orders_payment_method_idx on public.service_orders (payment_method);
