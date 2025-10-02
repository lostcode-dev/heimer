-- Add categories and tags to products and services
alter table if exists public.products
  add column if not exists categories text[],
  add column if not exists tags text[];

alter table if exists public.services
  add column if not exists categories text[],
  add column if not exists tags text[];

-- Optional indexes for array elements (GIN)
create index if not exists idx_products_categories_gin on public.products using gin (categories);
create index if not exists idx_products_tags_gin on public.products using gin (tags);
create index if not exists idx_services_categories_gin on public.services using gin (categories);
create index if not exists idx_services_tags_gin on public.services using gin (tags);
