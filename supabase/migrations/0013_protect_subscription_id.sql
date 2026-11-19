-- Protege também o stripe_subscription_id: só o servidor (service role), pelo
-- webhook do Stripe e pelas ações de cobrança, pode gravar ou trocar esse
-- campo. Antes, um usuário conseguia alterá-lo direto pela API e apontar o
-- "cancelar assinatura" para uma assinatura que não era dele.

create or replace function public.protect_profile_billing() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.stripe_account_id := null;
      new.stripe_subscription_id := null;
    elsif new.plan is distinct from old.plan
       or new.stripe_account_id is distinct from old.stripe_account_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id then
      raise exception 'plan, stripe_account_id and stripe_subscription_id are managed by the server';
    end if;
  end if;
  return new;
end;
$$;
