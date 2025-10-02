-- Add optional technician association to services
alter table if exists public.services
  add column if not exists technician_id uuid null references public.technicians(id) on delete set null;

create index if not exists services_technician_id_idx on public.services (technician_id);
