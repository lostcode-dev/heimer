-- Add created_by and created_employee_id to service_orders and create an audit log table for service orders
begin;

-- Add creator columns
alter table if exists public.service_orders
  add column if not exists created_by uuid references public.users(id),
  add column if not exists created_employee_id uuid references public.users(id);

-- Service order audit log table
create table if not exists public.service_order_audit_logs (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid references public.service_orders(id) on delete cascade,
  actor_user_id uuid references public.users(id),
  action text not null,
  field text,
  old_value text,
  new_value text,
  created_at timestamp not null default now()
);

create index if not exists idx_so_audit_order on public.service_order_audit_logs(service_order_id, created_at);

commit;