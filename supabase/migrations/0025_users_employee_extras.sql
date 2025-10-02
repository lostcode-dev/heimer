-- Extend users profile with active flag and extra employee fields
alter table public.users add column if not exists is_active boolean not null default true;
alter table public.users add column if not exists job_title text;
alter table public.users add column if not exists cpf text;
alter table public.users add column if not exists hire_date date;

-- Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
