-- Add DIRECT_SALE as allowed reference_type for inventory_movements and index for quick reversal lookups
alter table if exists public.inventory_movements
  drop constraint if exists inventory_movements_reference_type_check;

alter table if exists public.inventory_movements
  add constraint inventory_movements_reference_type_check
  check (reference_type in ('SERVICE_ORDER','MANUAL','DIRECT_SALE'));

create index if not exists idx_inventory_reference on public.inventory_movements(reference_type, reference_id);