-- Ties each click to the page view it came from, so the click rate can be
-- "share of visits with at least one click" (always 0–100%).
alter table public.events add column visit_id uuid;
