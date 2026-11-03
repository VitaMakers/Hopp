-- Visitor location for the "Sessões por local" analytics. Filled from the
-- edge/CDN geo headers at ingest (country ISO code + city name). Older rows
-- stay null; the dashboard tolerates the columns being absent too.
alter table public.events add column if not exists country text;
alter table public.events add column if not exists city text;

create index if not exists events_owner_country_idx
  on public.events (owner_id, country)
  where country is not null;
