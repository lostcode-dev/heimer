-- Many-to-many association between services and technicians
create table if not exists public.service_technicians (
  service_id uuid not null references public.services(id) on delete cascade,
  technician_id uuid not null references public.technicians(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (service_id, technician_id)
);

create index if not exists service_technicians_service_idx on public.service_technicians (service_id);
create index if not exists service_technicians_technician_idx on public.service_technicians (technician_id);

alter table public.service_technicians enable row level security;

create policy if not exists "service_technicians_select" on public.service_technicians
  for select to authenticated using (true);
create policy if not exists "service_technicians_insert" on public.service_technicians
  for insert to authenticated with check (true);
create policy if not exists "service_technicians_delete" on public.service_technicians
  for delete to authenticated using (true);

-- If a single technician_id column was added previously, drop it to avoid confusion
alter table if exists public.services drop column if exists technician_id;
