-- Device and campaign attribution for analytics. Device/os/browser come from
-- the User-Agent at ingest; utm_* from the page URL's query string. Older rows
-- stay null and the dashboard tolerates the columns being absent.
alter table public.events add column if not exists device text;
alter table public.events add column if not exists os text;
alter table public.events add column if not exists browser text;
alter table public.events add column if not exists utm_source text;
alter table public.events add column if not exists utm_medium text;
alter table public.events add column if not exists utm_campaign text;
