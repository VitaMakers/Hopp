-- Respostas de formulário: enviadas pelos blocos "form". Escritas só pelo
-- servidor (service role), pela rota pública /api/form; lidas pela conta que
-- gerencia o cliente (mesma regra de RLS dos contatos).
create table public.form_responses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  block_id text,
  answers jsonb not null,
  created_at timestamptz not null default now()
);
create index form_responses_owner_created_idx on public.form_responses (owner_id, created_at desc);

alter table public.form_responses enable row level security;

create policy "managed form responses read" on public.form_responses
  for select using (exists (
    select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()
  ));
create policy "managed form responses delete" on public.form_responses
  for delete using (exists (
    select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()
  ));
