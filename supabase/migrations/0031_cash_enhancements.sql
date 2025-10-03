-- Cash enhancements: categories for expenses, method on movements, and reconciliation fields on sessions

-- cash_movements: optional category for withdrawals/expenses
alter table if exists public.cash_movements
  add column if not exists category text check (category in ('FORNECEDOR','OPERACIONAL','OUTROS'));

-- optional method on movements to report payment methods breakdown
alter table if exists public.cash_movements
  add column if not exists method text check (method in ('CASH','CARD','PIX','TRANSFER'));

-- cash_sessions: counted amount and difference for reconciliation at close
alter table if exists public.cash_sessions
  add column if not exists counted_amount numeric(12,2),
  add column if not exists difference numeric(12,2);
