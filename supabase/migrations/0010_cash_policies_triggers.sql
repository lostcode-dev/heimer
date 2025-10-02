-- Policies for cash modules

-- Allow CASHIER, MANAGER, ADMIN to open/update cash sessions; only ADMIN can delete
create policy cash_sessions_insert on public.cash_sessions for insert with check (
  public.jwt_role() in ('CASHIER','MANAGER','ADMIN')
);
create policy cash_sessions_update on public.cash_sessions for update using (
  public.jwt_role() in ('CASHIER','MANAGER','ADMIN')
) with check (public.jwt_role() in ('CASHIER','MANAGER','ADMIN'));
create policy cash_sessions_delete_admin on public.cash_sessions for delete using (
  public.jwt_role() = 'ADMIN'
);

-- Allow movements insert/update for CASHIER, MANAGER, ADMIN; delete only ADMIN
create policy cash_movements_insert on public.cash_movements for insert with check (
  public.jwt_role() in ('CASHIER','MANAGER','ADMIN')
);
create policy cash_movements_update on public.cash_movements for update using (
  public.jwt_role() in ('CASHIER','MANAGER','ADMIN')
) with check (public.jwt_role() in ('CASHIER','MANAGER','ADMIN'));
create policy cash_movements_delete_admin on public.cash_movements for delete using (
  public.jwt_role() = 'ADMIN'
);

-- Allow updating payments.cash_session_id to attach/detach to a session
create policy payments_update_session on public.payments for update using (
  public.jwt_role() in ('CASHIER','MANAGER','ADMIN')
) with check (public.jwt_role() in ('CASHIER','MANAGER','ADMIN'));

-- Trigger: when payment with method CASH is attached to a session, create a movement SALE
create or replace function public.on_payment_session_attach() returns trigger language plpgsql as $$
begin
  if new.cash_session_id is not null and (old.cash_session_id is distinct from new.cash_session_id) then
    if new.method = 'CASH' then
      insert into public.cash_movements(cash_session_id, type, amount, reference_id, reference_type, occurred_at, notes)
      values (new.cash_session_id, 'SALE', new.amount, new.id, 'PAYMENT', new.received_at, 'Payment attached');
    end if;
  end if;
  return new;
end;$$;

drop trigger if exists trg_payment_session_attach on public.payments;
create trigger trg_payment_session_attach after update on public.payments
for each row execute function public.on_payment_session_attach();
