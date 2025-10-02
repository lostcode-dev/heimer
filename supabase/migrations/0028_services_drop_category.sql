-- Remove legacy single category column from services
alter table if exists public.services
  drop column if exists category;

-- Note: categories and tags arrays remain (added in 0005_categories_tags.sql)
