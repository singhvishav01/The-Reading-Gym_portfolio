-- Migration 002: Add Book Completion Status & OpenAI Quiz tracking

-- 1. Add completion column
alter table public.reading_progress 
  add column if not exists is_completed boolean default false not null;

-- 2. Update Feed Events constraint to support 'book_completed'
alter table public.feed_events
  drop constraint if exists feed_events_event_type_check;

alter table public.feed_events
  add constraint feed_events_event_type_check 
  check (event_type in ('chapter_progress', 'room_joined', 'chapter_reaction', 'book_completed'));

-- 3. Modify XP trigger to reward +50 XP upon quiz completion & marking as read
create or replace function public.handle_progress_xp()
returns trigger as $$
declare
  chapter_diff integer;
  xp_to_add integer := 0;
begin
  if (TG_OP = 'INSERT') then
    chapter_diff := new.current_chapter;
  else
    chapter_diff := new.current_chapter - old.current_chapter;
  end if;

  -- 10 XP per chapter read
  if (chapter_diff > 0) then
    xp_to_add := chapter_diff * 10;
  end if;

  -- 50 XP Bonus when completing the book (and passing the quiz)
  if (TG_OP = 'UPDATE' and new.is_completed = true and old.is_completed = false) then
    xp_to_add := xp_to_add + 50;
  end if;

  if (xp_to_add > 0) then
    update public.users
    set xp = xp + xp_to_add
    where id = new.user_id;
  end if;

  return new;
end;
$$ language plpgsql;
