-- Regras de plano e de endereço também no banco. O painel já aplica essas
-- regras, mas as tabelas aceitavam gravação direta pela API com o login do
-- próprio usuário, o que permitia contorná-las. Estas travas valem para
-- qualquer gravação que não venha do servidor (service role).

-- 1) Endereços reservados não podem virar página de ninguém.
create or replace function public.protect_reserved_handles() returns trigger
language plpgsql as $$
begin
  if lower(new.handle::text) in (
    'admin', 'api', 'app', 'auth', 'dashboard', 'templates', 'entrar', 'f', 'help',
    'planos', 'precos', 'preços', 'recuperar-senha', 'redefinir-senha', 'l', 'login',
    'logout', 'onboarding', 'privacidade', 'settings', 'signup', 'suporte', 'termos', '_next'
  ) then
    raise exception 'Este endereço é reservado.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_reserved_handles on public.profiles;
create trigger protect_reserved_handles
  before insert or update of handle on public.profiles
  for each row execute function public.protect_reserved_handles();

-- 2) Links curtos são de planos pagos.
create or replace function public.require_paid_plan_for_short_links() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not exists (
       select 1 from public.profiles p
       where p.id = new.owner_id and p.plan in ('essencial', 'profissional', 'pro')
     ) then
    raise exception 'Links curtos estão disponíveis nos planos pagos.';
  end if;
  return new;
end;
$$;

drop trigger if exists require_paid_plan_for_short_links on public.short_links;
create trigger require_paid_plan_for_short_links
  before insert on public.short_links
  for each row execute function public.require_paid_plan_for_short_links();

-- 3) Formulários próprios são do plano Profissional.
create or replace function public.require_profissional_for_forms() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not exists (
       select 1 from public.profiles p
       where p.id = new.owner_id and p.plan in ('profissional', 'pro')
     ) then
    raise exception 'Formulários estão disponíveis no plano Profissional.';
  end if;
  return new;
end;
$$;

drop trigger if exists require_profissional_for_forms on public.forms;
create trigger require_profissional_for_forms
  before insert on public.forms
  for each row execute function public.require_profissional_for_forms();
