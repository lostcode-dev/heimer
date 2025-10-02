-- Add extra fields to customers: ativo, endereço e observações já existe (notes)
alter table if exists public.customers
  add column if not exists is_active boolean not null default true,
  add column if not exists cep text,
  add column if not exists street text,
  add column if not exists number text,
  add column if not exists complement text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists state text;

-- Optional: index for quick search by CEP or city
create index if not exists idx_customers_city on public.customers(city);
create index if not exists idx_customers_cep on public.customers(cep);