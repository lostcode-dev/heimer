-- Create public users profile table linked to auth.users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  avatar_url text,
  cep text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  birth_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- In case table existed from previous migration runs, ensure new columns exist
-- Note: the initial schema may not include the `email` column; add it if absent
alter table public.users add column if not exists email text;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists cep text;
alter table public.users add column if not exists street text;
alter table public.users add column if not exists number text;
alter table public.users add column if not exists complement text;
alter table public.users add column if not exists neighborhood text;
alter table public.users add column if not exists city text;
alter table public.users add column if not exists state text;
alter table public.users add column if not exists birth_date date;
alter table public.users add column if not exists notes text;
alter table public.users add column if not exists updated_at timestamptz not null default now();

alter table public.users enable row level security;

-- Policies (idempotent via drop-then-create)
-- 1) Allow selecting users that belong to the same current company
drop policy if exists users_select_by_company on public.users;
create policy users_select_by_company on public.users
  for select to authenticated using (
    exists (
      select 1 from public.user_companies uc
      where uc.user_id = users.id and uc.company_id = current_company_id()
    )
  );

-- 2) Block inserts from client; only Edge Function/Service Role can insert
drop policy if exists users_block_insert on public.users;
create policy users_block_insert on public.users for insert to authenticated with check (false);

-- 3) Allow updates by OWNER/ADMIN in the same company as the target user
drop policy if exists users_update_company_admin on public.users;
create policy users_update_company_admin on public.users
  for update to authenticated using (
    exists (
      select 1
      from public.user_companies admin_uc
      where admin_uc.user_id = auth.uid()
        and admin_uc.role in ('OWNER','ADMIN')
        and admin_uc.company_id in (
          select uc.company_id from public.user_companies uc where uc.user_id = users.id
        )
    )
  ) with check (true);

-- 4) Allow deletes by OWNER/ADMIN in the same company
drop policy if exists users_delete_company_admin on public.users;
create policy users_delete_company_admin on public.users
  for delete to authenticated using (
    exists (
      select 1
      from public.user_companies admin_uc
      where admin_uc.user_id = auth.uid()
        and admin_uc.role in ('OWNER','ADMIN')
        and admin_uc.company_id in (
          select uc.company_id from public.user_companies uc where uc.user_id = users.id
        )
    )
  );
