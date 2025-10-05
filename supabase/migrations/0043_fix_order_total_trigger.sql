-- Fix recursive trigger on service_orders total calculation to avoid stack overflow
begin;

-- Replace function to compute total_amount in a BEFORE trigger without updating the table again
create or replace function public.recalc_order_total_from_order()
returns trigger
language plpgsql
as $$
begin
  -- compute derived total_amount directly into NEW to avoid self-updating recursion
  new.total_amount := coalesce(new.labor_price,0) + coalesce(new.tax_amount,0) - coalesce(new.discount_amount,0) + (
    select coalesce(sum(total),0) from public.service_order_items soi where soi.service_order_id = new.id
  );
  return new;
end;$$;

-- Drop and recreate trigger as BEFORE to apply the computation without extra UPDATE
drop trigger if exists trg_order_total on public.service_orders;
create trigger trg_order_total before insert or update on public.service_orders
for each row execute function public.recalc_order_total_from_order();

commit;
