-- Preview next ticket number without inserting (best-effort, not concurrency-safe)
create or replace function public.preview_next_ticket_number()
returns text language plpgsql as $$
declare
  year_part text := to_char(now(), 'YYYY');
  seq int;
begin
  select coalesce(max(split_part(ticket_number, '-', 3)::int), 0) + 1 into seq
  from public.service_orders
  where split_part(ticket_number, '-', 2) = year_part;
  return 'SO-' || year_part || '-' || lpad(seq::text, 6, '0');
end;$$;
