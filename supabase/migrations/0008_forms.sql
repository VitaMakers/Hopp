-- Standalone forms (WhatsForm style): each form has its own short link and its
-- own responses, independent of the bio page. The form's whole configuration
-- (title, intro, WhatsApp, fields) is stored as JSON in `config`, matching the
-- form-block shape so the editor and renderer are shared.
create table public.forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  code text not null unique,
  config jsonb not null,
  created_at timestamptz not null default now()
);
create index forms_owner_idx on public.forms (owner_id, created_at desc);

alter table public.forms enable row level security;
create policy "managed forms all" on public.forms
  for all
  using (exists (select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()))
  with check (exists (select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()));

-- Tie responses to a standalone form (in addition to the existing block path).
alter table public.form_responses add column if not exists form_id uuid references public.forms (id) on delete cascade;
create index if not exists form_responses_form_idx on public.form_responses (form_id, created_at desc);
