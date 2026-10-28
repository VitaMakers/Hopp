-- Form opens (views): one row each time the public /f/[code] page loads, so we
-- can show how many people opened vs. how many submitted. Written by the
-- server (service role) from /api/form-view; read by the managing account.
create table public.form_views (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  form_id uuid not null references public.forms (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index form_views_form_idx on public.form_views (form_id, created_at desc);

alter table public.form_views enable row level security;
create policy "managed form views read" on public.form_views
  for select using (exists (
    select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()
  ));
