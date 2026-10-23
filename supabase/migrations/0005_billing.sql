-- Cobrança por cliente (Fase 2).
--
-- Cada cliente pago tem uma assinatura Stripe, guardada no próprio profile.
-- Quem paga (o cliente Stripe) é a conta/agência, guardada em account_billing —
-- um cliente Stripe por conta, para que todos os clientes pagos caiam numa
-- mesma fatura e num mesmo cartão.
--
-- O plano continua protegido contra escrita do cliente (trigger
-- protect_profile_billing): só o servidor (service role), pelo webhook do
-- Stripe, muda o plano quando o pagamento confirma.

alter table public.profiles add column if not exists stripe_subscription_id text;

create table if not exists public.account_billing (
  account_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

-- A conta vê o próprio registro; só o servidor escreve nele.
alter table public.account_billing enable row level security;
drop policy if exists "own billing read" on public.account_billing;
create policy "own billing read" on public.account_billing
  for select using (account_id = auth.uid());
