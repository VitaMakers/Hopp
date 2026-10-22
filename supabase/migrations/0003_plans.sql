-- Three subscription tiers: free, essencial, profissional.
-- Migrates the legacy 'pro' value to 'profissional'.
alter table public.profiles drop constraint if exists profiles_plan_check;

update public.profiles set plan = 'profissional' where plan = 'pro';

alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'essencial', 'profissional'));
