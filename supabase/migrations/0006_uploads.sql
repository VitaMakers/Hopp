-- Image uploads: a public bucket so the page images load for everyone, with
-- writes limited to each signed-in account's own folder (uploads/<auth uid>/).

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "uploads public read" on storage.objects;
create policy "uploads public read" on storage.objects
  for select using (bucket_id = 'uploads');

drop policy if exists "uploads owner insert" on storage.objects;
create policy "uploads owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "uploads owner update" on storage.objects;
create policy "uploads owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "uploads owner delete" on storage.objects;
create policy "uploads owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
