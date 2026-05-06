-- Migration 006: Add status column to reading_progress + last_read_at to users
-- Run this in the Supabase SQL Editor.

-- 1. Status column on reading_progress (reading | want_to_read | completed | null)
ALTER TABLE public.reading_progress
  ADD COLUMN IF NOT EXISTS status text
  CHECK (status IN ('reading', 'want_to_read', 'completed'));

-- 2. last_read_at on users (needed for client-side streak tracking)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

-- 3. bio + interests columns (referenced in code but may be missing)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '' NOT NULL;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}' NOT NULL;

-- 4. Make sure feed_events allows all event types used in the app
ALTER TABLE public.feed_events
  DROP CONSTRAINT IF EXISTS feed_events_event_type_check;

ALTER TABLE public.feed_events
  ADD CONSTRAINT feed_events_event_type_check
  CHECK (event_type IN ('chapter_progress', 'room_joined', 'chapter_reaction', 'book_completed', 'user_post'));

-- 5. Storage bucket for feed images (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed_images', 'feed_images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "feed_images_public_read" ON storage.objects;
CREATE POLICY "feed_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'feed_images');

DROP POLICY IF EXISTS "feed_images_auth_insert" ON storage.objects;
CREATE POLICY "feed_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'feed_images' AND auth.role() = 'authenticated');
