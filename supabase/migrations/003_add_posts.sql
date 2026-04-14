-- Migration 003: Storage Bucket for Feed Images & Post Events

-- 1. Create Storage Bucket
insert into storage.buckets (id, name, public) 
values ('feed_images', 'feed_images', true)
on conflict (id) do nothing;

-- 2. Storage Security Policies
drop policy if exists "feed_images_public_read" on storage.objects;
create policy "feed_images_public_read" on storage.objects
  for select using ( bucket_id = 'feed_images' );

drop policy if exists "feed_images_auth_insert" on storage.objects;
create policy "feed_images_auth_insert" on storage.objects
  for insert with check ( bucket_id = 'feed_images' and auth.role() = 'authenticated' );

-- 3. Allow 'user_post' in global feed
alter table public.feed_events
  drop constraint if exists feed_events_event_type_check;

alter table public.feed_events
  add constraint feed_events_event_type_check 
  check (event_type in ('chapter_progress', 'room_joined', 'chapter_reaction', 'book_completed', 'user_post'));
