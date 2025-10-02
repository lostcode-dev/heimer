-- Update on_order_ready trigger function to only append inventory movements

create or replace function public.on_order_ready() returns trigger language plpgsql as $$
begin
  if new.status = 'READY' and old.status is distinct from 'READY' then
    insert into public.inventory_movements (product_id, type, qty, reason, reference_id, reference_type)
    select soi.product_id, 'OUT', soi.qty, 'SERVICE READY', new.id, 'SERVICE_ORDER'
    from public.service_order_items soi
    where soi.service_order_id = new.id and soi.product_id is not null;
  end if;
  return new;
end;$$;

drop trigger if exists trg_order_ready on public.service_orders;
create trigger trg_order_ready after update on public.service_orders
for each row when (new.status = 'READY') execute function public.on_order_ready();
