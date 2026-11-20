-- Posição aproximada da visita (centro da cidade, vinda da rede de
-- distribuição), para desenhar os pontos no mapa das estatísticas.
alter table public.events add column if not exists lat real;
alter table public.events add column if not exists lon real;

-- As estatísticas filtram sempre por tipo de evento e período.
create index if not exists events_owner_kind_created_idx on public.events (owner_id, kind, created_at desc);
