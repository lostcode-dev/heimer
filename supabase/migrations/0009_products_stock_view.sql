-- Remove stock_qty from products and compute stock via movements

alter table public.products drop column if exists stock_qty;

create or replace view public.product_stock as
select
  p.id as product_id,
  sum(case when im.type = 'IN' then im.qty when im.type = 'OUT' then -im.qty when im.type = 'ADJUSTMENT' then im.qty else 0 end) as stock_qty
from public.products p
left join public.inventory_movements im on im.product_id = p.id
group by p.id;

-- helpful combined view for listing products with stock and margin
create or replace view public.products_with_stock as
select
  p.*, coalesce(ps.stock_qty, 0) as stock_qty
from public.products p
left join public.product_stock ps on ps.product_id = p.id
where p.deleted_at is null;

grant select on public.product_stock to anon, authenticated;
grant select on public.products_with_stock to anon, authenticated;
