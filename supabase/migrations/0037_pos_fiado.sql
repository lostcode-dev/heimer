-- Add FIADO payment method for POS direct sales and link receivables to sales

-- Allow FIADO on direct_sale_payments.method
alter table if exists public.direct_sale_payments drop constraint if exists direct_sale_payments_method_check;
alter table if exists public.direct_sale_payments add constraint direct_sale_payments_method_check check (method in ('CASH','CARD','PIX','TRANSFER','FIADO'));

-- Link receivables to originating entities (e.g., DIRECT_SALE)
alter table if exists public.receivables
  add column if not exists reference_type text check (reference_type in ('DIRECT_SALE','SERVICE_ORDER')),
  add column if not exists reference_id uuid;

create index if not exists idx_receivables_reference on public.receivables(reference_type, reference_id);
