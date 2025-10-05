-- Add seller (user who sold) to POS direct sales

alter table if exists public.direct_sale_orders
  add column if not exists seller_id uuid null references public.users(id) on delete set null;

-- Optional: index by seller for faster filtering
create index if not exists idx_direct_sale_orders_seller on public.direct_sale_orders(seller_id);

-- RLS remains based on company_id; no change needed to policies
