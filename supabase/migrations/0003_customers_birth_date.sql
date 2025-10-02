-- Add birth_date to customers
alter table if exists public.customers
  add column if not exists birth_date date null;

-- Optional index if you plan to filter by birth_date (commented out)
-- create index if not exists idx_customers_birth_date on public.customers(birth_date);
