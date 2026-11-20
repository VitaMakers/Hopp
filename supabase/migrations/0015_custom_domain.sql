-- Domínio próprio (plano Profissional): o endereço do cliente que abre a
-- página dele. Só o servidor grava esse campo, depois de conferir o plano.
alter table public.profiles add column if not exists custom_domain text;
create unique index if not exists profiles_custom_domain_key on public.profiles (lower(custom_domain)) where custom_domain is not null;

create or replace function public.protect_profile_domain() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.custom_domain := null;
    elsif new.custom_domain is distinct from old.custom_domain then
      raise exception 'custom_domain is managed by the server';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_domain on public.profiles;
create trigger protect_profile_domain
  before insert or update on public.profiles
  for each row execute function public.protect_profile_domain();
