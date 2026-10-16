-- Core schema: profiles, pages (draft + published JSON), revisions,
-- short links, analytics events and captured contacts.

create extension if not exists citext;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle citext not null unique check (handle ~ '^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$'),
  display_name text not null default '',
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_account_id text unique,
  created_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  draft jsonb not null,
  published jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.page_revisions (
  id bigint generated always as identity primary key,
  page_id uuid not null references public.pages (id) on delete cascade,
  doc jsonb not null,
  created_at timestamptz not null default now()
);
create index page_revisions_page_idx on public.page_revisions (page_id, created_at desc);

create table public.short_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  code citext not null unique,
  title text not null default '',
  target_url text not null,
  created_at timestamptz not null default now()
);
create index short_links_owner_idx on public.short_links (owner_id);

-- Written only by the server (service role) from the public routes.
create table public.events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('page_view', 'block_click', 'social_click', 'short_link_click')),
  block_id text,
  short_link_id uuid references public.short_links (id) on delete set null,
  target text,
  referrer text,
  created_at timestamptz not null default now()
);
create index events_owner_created_idx on public.events (owner_id, created_at desc);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  block_id text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);
create index contacts_owner_created_idx on public.contacts (owner_id, created_at desc);

-- Row level security: owners manage their own rows. Public pages, redirects,
-- tracking and contact capture go through server routes with the service role.
alter table public.profiles enable row level security;
alter table public.pages enable row level security;
alter table public.page_revisions enable row level security;
alter table public.short_links enable row level security;
alter table public.events enable row level security;
alter table public.contacts enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own page" on public.pages
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own revisions read" on public.page_revisions
  for select using (exists (
    select 1 from public.pages p where p.id = page_id and p.owner_id = auth.uid()
  ));
create policy "own revisions insert" on public.page_revisions
  for insert with check (exists (
    select 1 from public.pages p where p.id = page_id and p.owner_id = auth.uid()
  ));

create policy "own short links" on public.short_links
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own events read" on public.events
  for select using (owner_id = auth.uid());

create policy "own contacts read" on public.contacts
  for select using (owner_id = auth.uid());
create policy "own contacts delete" on public.contacts
  for delete using (owner_id = auth.uid());

-- Owners cannot set their own plan or payment account from the client; only
-- the server (service role) may. A column REVOKE would not override the
-- table-wide grant Supabase gives to `authenticated`, hence the trigger.
create function public.protect_profile_billing() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.stripe_account_id := null;
    elsif new.plan is distinct from old.plan
       or new.stripe_account_id is distinct from old.stripe_account_id then
      raise exception 'plan and stripe_account_id are managed by the server';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_billing
  before insert or update on public.profiles
  for each row execute function public.protect_profile_billing();
