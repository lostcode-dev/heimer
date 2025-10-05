-- Leads capture for marketing landing

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  meta jsonb,
  created_at timestamp not null default now()
);

alter table if exists public.leads enable row level security;
do $$ begin
  -- allow public insert/select minimal (optional select to validate).
  create policy leads_insert_any on public.leads for insert
  with check (true);
exception when others then null; end $$;

do $$ begin
  create policy leads_select_any on public.leads for select
  using (true);
exception when others then null; end $$;
