-- RPC functions for inventory movements with stock adjustments
set check_function_bodies = off;

create or replace function public.apply_inventory_movement(
  p_product_id uuid,
  p_type text,
  p_qty integer,
  p_reason text default null,
  p_occurred_at timestamptz default now()
) returns public.inventory_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.inventory_movements;
  v_delta integer;
begin
  if p_type not in ('IN','OUT','ADJUSTMENT') then
    raise exception 'Invalid movement type %', p_type;
  end if;

  v_delta := case when p_type = 'IN' then p_qty when p_type = 'OUT' then -p_qty else p_qty end;

  insert into public.inventory_movements(product_id, type, qty, reason, reference_type, occurred_at)
  values (p_product_id, p_type, p_qty, p_reason, 'MANUAL', coalesce(p_occurred_at, now()))
  returning * into v_row;

  return v_row;
end;$$;

create or replace function public.delete_inventory_movement(
  p_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.inventory_movements;
  v_delta integer;
begin
  select * into v_old from public.inventory_movements where id = p_id;
  if not found then
    return;
  end if;

  delete from public.inventory_movements where id = p_id;
end;$$;

create or replace function public.update_inventory_movement(
  p_id uuid,
  p_product_id uuid default null,
  p_type text default null,
  p_qty integer default null,
  p_reason text default null,
  p_occurred_at timestamptz default null
) returns public.inventory_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.inventory_movements;
  v_new public.inventory_movements;
  v_delta_old integer;
  v_delta_new integer;
begin
  select * into v_old from public.inventory_movements where id = p_id for update;
  if not found then
    raise exception 'Movement % not found', p_id;
  end if;

  -- apply new values
  update public.inventory_movements
  set product_id = coalesce(p_product_id, v_old.product_id),
      type = coalesce(p_type, v_old.type),
      qty = coalesce(p_qty, v_old.qty),
      reason = coalesce(p_reason, v_old.reason),
      occurred_at = coalesce(p_occurred_at, v_old.occurred_at)
  where id = p_id
  returning * into v_new;

  return v_new;
end;$$;

-- Permissions: allow authenticated to execute
grant execute on function public.apply_inventory_movement(uuid,text,integer,text,timestamptz) to authenticated;
grant execute on function public.delete_inventory_movement(uuid) to authenticated;
grant execute on function public.update_inventory_movement(uuid,uuid,text,integer,text,timestamptz) to authenticated;
