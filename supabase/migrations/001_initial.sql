-- ============================================================
-- THE READING GYM — Initial Database Schema
-- Run this in your Supabase SQL Editor (supabase.co → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  xp integer default 0 not null,
  streak_days integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Books (cached from Google Books API)
create table if not exists public.books (
  id text primary key,                    -- Google Books volume ID
  title text not null,
  author text,
  cover_url text,
  description text,
  created_at timestamptz default now() not null
);

-- Reading Rooms (one per book, created on demand)
create table if not exists public.reading_rooms (
  id uuid default uuid_generate_v4() primary key,
  book_id text references public.books(id) on delete cascade not null unique,
  created_at timestamptz default now() not null
);

-- Reading Progress (user × book → current chapter)
create table if not exists public.reading_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  room_id uuid references public.reading_rooms(id) on delete cascade not null,
  book_id text references public.books(id) on delete cascade not null,
  current_chapter integer default 1 not null,
  updated_at timestamptz default now() not null,
  unique(user_id, book_id)  -- upsert key: one progress row per user per book
);

-- Chapter Reactions
-- reaction_type: 'plot_twist' | 'mind_blown' | 'emotional' | 'suspicious' | 'favorite'
-- intensity: derived at query time (plot_twist/mind_blown=strong, emotional=moderate, suspicious/favorite=mild)
create table if not exists public.chapter_reactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  book_id text references public.books(id) on delete cascade not null,
  chapter_number integer not null,
  reaction_type text not null,
  check (reaction_type in ('plot_twist', 'mind_blown', 'emotional', 'suspicious', 'favorite')),
  created_at timestamptz default now() not null,
  unique(user_id, book_id, chapter_number, reaction_type)
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists reading_progress_updated_at on public.reading_progress;
create trigger reading_progress_updated_at
  before update on public.reading_progress
  for each row execute function public.set_updated_at();

-- Function to increment user XP when progress increases
create or replace function public.handle_progress_xp()
returns trigger as $$
declare
  chapter_diff integer;
begin
  -- Calculate how many chapters they moved forward
  if (TG_OP = 'INSERT') then
    chapter_diff := new.current_chapter;
  else
    chapter_diff := new.current_chapter - old.current_chapter;
  end if;

  -- Only add XP if they moved forward
  if (chapter_diff > 0) then
    update public.users
    set xp = xp + (chapter_diff * 10)
    where id = new.user_id;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_reading_progress_change on public.reading_progress;
create trigger on_reading_progress_change
  after insert or update on public.reading_progress
  for each row execute function public.handle_progress_xp();

-- Function to automatically create a public user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, avatar_url, xp, streak_days)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    null,
    0,
    0
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run handle_new_user on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Feed Events (activity log)
-- event_type: 'chapter_progress' | 'room_joined' | 'chapter_reaction'
create table if not exists public.feed_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text not null,
  check (event_type in ('chapter_progress', 'room_joined', 'chapter_reaction')),
  book_id text references public.books(id) on delete cascade,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.reading_rooms enable row level security;
alter table public.reading_progress enable row level security;
alter table public.chapter_reactions enable row level security;
alter table public.feed_events enable row level security;

-- Users
create policy "users_select_all" on public.users
  for select using (true);

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Books (public read, any authenticated user can cache a book)
create policy "books_select_all" on public.books
  for select using (true);

create policy "books_insert_authenticated" on public.books
  for insert with check (auth.role() = 'authenticated');

-- Reading Rooms (public read)
create policy "rooms_select_all" on public.reading_rooms
  for select using (true);

create policy "rooms_insert_authenticated" on public.reading_rooms
  for insert with check (auth.role() = 'authenticated');

-- Reading Progress (public read, own write)
create policy "progress_select_all" on public.reading_progress
  for select using (true);

create policy "progress_insert_own" on public.reading_progress
  for insert with check (auth.uid() = user_id);

create policy "progress_update_own" on public.reading_progress
  for update using (auth.uid() = user_id);

-- Chapter Reactions
create policy "reactions_select_all" on public.chapter_reactions
  for select using (true);

create policy "reactions_insert_own" on public.chapter_reactions
  for insert with check (auth.uid() = user_id);

create policy "reactions_delete_own" on public.chapter_reactions
  for delete using (auth.uid() = user_id);

-- Feed Events
create policy "feed_select_all" on public.feed_events
  for select using (true);

create policy "feed_insert_own" on public.feed_events
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- REALTIME
-- Enable realtime for reading_progress so Reading Rooms update live
-- ============================================================
alter publication supabase_realtime add table public.reading_progress;
alter publication supabase_realtime add table public.feed_events;
alter publication supabase_realtime add table public.chapter_reactions;

-- ============================================================
-- STORAGE BUCKET (run separately or via Supabase dashboard)
-- Create a bucket called 'avatars' with public access for avatar uploads
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
