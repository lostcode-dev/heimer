-- Fix total_amount to avoid double counting service items.
-- Services are represented both as items (kind = 'SERVICE') and in labor_price.
-- The correct total is: labor_price + sum(PRODUCT items) + tax_amount - discount_amount.

begin;

-- Update function called by items trigger to only sum product items
create or replace function public.recalc_order_total() returns trigger language plpgsql as $$
begin
  update public.service_orders so
  set total_amount = coalesce(labor_price,0) + coalesce(tax_amount,0) - coalesce(discount_amount,0) + (
    select coalesce(sum(total),0)
    from public.service_order_items soi
    where soi.service_order_id = so.id
      and (soi.kind = 'PRODUCT' or soi.product_id is not null)
  )
  where so.id = new.service_order_id;
  return new;
end;$$;

-- Update function used by service_orders BEFORE trigger likewise
create or replace function public.recalc_order_total_from_order()
returns trigger
language plpgsql
as $$
begin
  new.total_amount := coalesce(new.labor_price,0) + coalesce(new.tax_amount,0) - coalesce(new.discount_amount,0) + (
    select coalesce(sum(total),0)
    from public.service_order_items soi
    where soi.service_order_id = new.id
      and (soi.kind = 'PRODUCT' or soi.product_id is not null)
  );
  return new;
end;$$;

commit;

-- Backfill: force recalc totals for existing orders using the new logic
-- A no-op update will fire the BEFORE trigger to recompute total_amount
update public.service_orders set labor_price = labor_price;
