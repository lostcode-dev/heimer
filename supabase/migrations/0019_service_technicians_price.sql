-- Add price charged by the technician for a given service
alter table if exists public.service_technicians
  add column if not exists technician_price numeric(12,2);

-- Optional: basic check to avoid negative prices
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conname = 'service_technicians_price_non_negative'
      and c.conrelid = 'public.service_technicians'::regclass
  ) then
    alter table public.service_technicians
      add constraint service_technicians_price_non_negative
      check (technician_price is null or technician_price >= 0);
  end if;
end
$$;


-- No RLS policy changes required; existing insert/delete policies still apply
