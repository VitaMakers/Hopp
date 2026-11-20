-- Visitante recorrente e modelo do aparelho, para as estatísticas.
-- visitor_id é um código anônimo guardado no navegador do visitante: permite
-- saber que a mesma pessoa voltou, sem dizer quem ela é.
alter table public.events add column if not exists visitor_id uuid;
alter table public.events add column if not exists model text;

create index if not exists events_owner_visitor_idx on public.events (owner_id, visitor_id, created_at desc) where visitor_id is not null;
