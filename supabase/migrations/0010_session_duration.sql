-- Time on page: a "session" event is sent when the visitor leaves, carrying
-- how long they stayed (duration_ms), so the dashboard can show average time.
alter table public.events add column if not exists duration_ms integer;

alter table public.events drop constraint if exists events_kind_check;
alter table public.events add constraint events_kind_check
  check (kind in ('page_view', 'block_click', 'social_click', 'short_link_click', 'session'));
