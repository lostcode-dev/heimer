-- Allow receivables to have no due date (support FIADO without a set due date)

alter table if exists public.receivables
  alter column due_date drop not null;

-- Optional: keep existing index; no changes needed as indexes allow NULLs
