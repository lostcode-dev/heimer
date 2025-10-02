-- Allow multiple devices per service order
create table if not exists public.service_order_devices (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade
);
create index if not exists idx_so_devices_order on public.service_order_devices(service_order_id);

-- Optional: differentiate items (product vs service) with explicit type; keep existing table compatible
alter table public.service_order_items add column if not exists kind text check (kind in ('PRODUCT','SERVICE'));
-- If product_id is not null => kind default PRODUCT else SERVICE (can be enforced in app)
