-- Add last_read_at to users so the client can determine streak continuity
-- without needing a server-side cron. The client compares this date to
-- "today" and "yesterday" each time a chapter is logged.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;
