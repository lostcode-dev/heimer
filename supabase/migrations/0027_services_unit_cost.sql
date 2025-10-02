-- Add unit_cost to services
alter table if exists public.services
  add column if not exists unit_cost numeric(12,2) not null default 0;

-- Optional index if you plan to sort/filter by it often
create index if not exists idx_services_unit_cost on public.services(unit_cost);
