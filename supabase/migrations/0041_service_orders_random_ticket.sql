-- Change service order ticket number to use random format with 'O-' prefix
-- This replaces the previous year-sequence based generator.

create or replace function public.generate_ticket_number()
returns text language plpgsql as $$
declare
  candidate text;
  exists_count int;
begin
  loop
    -- 6-digit random number, zero-padded
    candidate := 'O-' || lpad(floor(random()*1000000)::int::text, 6, '0');
    select count(*) into exists_count from public.service_orders where ticket_number = candidate;
    if exists_count = 0 then
      return candidate;
    end if;
  end loop;
end;$$;

-- Preview next ticket number (best-effort random preview)
create or replace function public.preview_next_ticket_number()
returns text language plpgsql as $$
declare
  candidate text;
  exists_count int;
  attempts int := 0;
begin
  loop
    attempts := attempts + 1;
    candidate := 'O-' || lpad(floor(random()*1000000)::int::text, 6, '0');
    select count(*) into exists_count from public.service_orders where ticket_number = candidate;
    if exists_count = 0 or attempts > 5 then
      return candidate;
    end if;
  end loop;
end;$$;
