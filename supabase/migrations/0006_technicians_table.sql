-- Technicians table for assigning responsible staff
create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  notes text,
  is_active boolean not null default true,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

alter table public.technicians enable row level security;

create policy technicians_read on public.technicians for select using (deleted_at is null);
create policy technicians_crud on public.technicians for all using (
  public.jwt_role() in ('TECHNICIAN','MANAGER','ADMIN')
) with check (public.jwt_role() in ('TECHNICIAN','MANAGER','ADMIN'));

create index if not exists idx_technicians_name on public.technicians(full_name);
