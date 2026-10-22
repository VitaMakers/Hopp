-- Multi-client (agency) model.
--
-- Until now a profile *was* a login: `profiles.id` referenced `auth.users`, so
-- one account could own exactly one page. To let an agency manage several
-- clients from one login, we separate "who manages" from "which site":
--
--   * `profiles.id` stays the site identity (handle, plan, page, events,
--     contacts, short links all key on it, unchanged), but no longer has to be
--     an auth user.
--   * `profiles.account_id` is the login that manages the site. Existing rows
--     are self-managed (account_id = id). An agency's extra clients share the
--     agency's account_id and have no login of their own until they are
--     detached (account_id reassigned).
--
-- Everything downstream keeps keying on `owner_id` (= a profile id), so no other
-- table changes. Only the row-level-security policies move from "owner is me" to
-- "owner is one of the sites my account manages".

-- 1. Drop the hard link from profile identity to a login.
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();

-- 2. The managing account.
alter table public.profiles add column if not exists account_id uuid;
update public.profiles set account_id = id where account_id is null;
alter table public.profiles alter column account_id set not null;
alter table public.profiles
  add constraint profiles_account_id_fkey
  foreign key (account_id) references auth.users (id) on delete cascade;
create index if not exists profiles_account_idx on public.profiles (account_id, created_at);

-- 3. Row-level security: a login reaches a site when it manages that site's
--    account. Replace the old "= auth.uid()" policies accordingly.
drop policy if exists "own profile" on public.profiles;
create policy "managed profiles" on public.profiles
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Helper predicate reused by the owner-scoped tables below.
-- (Inlined as EXISTS so Postgres can use the profiles PK / account index.)
drop policy if exists "own page" on public.pages;
create policy "managed pages" on public.pages
  for all
  using (exists (select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()))
  with check (exists (select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()));

drop policy if exists "own revisions read" on public.page_revisions;
drop policy if exists "own revisions insert" on public.page_revisions;
create policy "managed revisions read" on public.page_revisions
  for select using (exists (
    select 1 from public.pages p
    join public.profiles pr on pr.id = p.owner_id
    where p.id = page_id and pr.account_id = auth.uid()
  ));
create policy "managed revisions insert" on public.page_revisions
  for insert with check (exists (
    select 1 from public.pages p
    join public.profiles pr on pr.id = p.owner_id
    where p.id = page_id and pr.account_id = auth.uid()
  ));

drop policy if exists "own short links" on public.short_links;
create policy "managed short links" on public.short_links
  for all
  using (exists (select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()))
  with check (exists (select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()));

drop policy if exists "own events read" on public.events;
create policy "managed events read" on public.events
  for select using (exists (
    select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()
  ));

drop policy if exists "own contacts read" on public.contacts;
drop policy if exists "own contacts delete" on public.contacts;
create policy "managed contacts read" on public.contacts
  for select using (exists (
    select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()
  ));
create policy "managed contacts delete" on public.contacts
  for delete using (exists (
    select 1 from public.profiles pr where pr.id = owner_id and pr.account_id = auth.uid()
  ));
