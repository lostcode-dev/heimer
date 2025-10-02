-- Add address fields to technicians so we can pickup items at their shop
alter table if exists public.technicians
  add column if not exists cep text,
  add column if not exists street text,
  add column if not exists number text,
  add column if not exists complement text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists state text;
