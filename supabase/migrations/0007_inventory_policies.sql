-- Enable CRUD on inventory_movements for authenticated roles
-- TECHNICIAN, MANAGER, ADMIN can insert/update/delete manual movements

-- Read policy already exists in base schema; add write policies
create policy inventory_movements_insert_authenticated on public.inventory_movements
  for insert
  with check (public.jwt_role() in ('TECHNICIAN','MANAGER','ADMIN'));

create policy inventory_movements_update_authenticated on public.inventory_movements
  for update
  using (public.jwt_role() in ('TECHNICIAN','MANAGER','ADMIN'))
  with check (public.jwt_role() in ('TECHNICIAN','MANAGER','ADMIN'));

create policy inventory_movements_delete_authenticated on public.inventory_movements
  for delete
  using (public.jwt_role() in ('TECHNICIAN','MANAGER','ADMIN'));
