-- Migration 005: Book Reviews
-- One review per user per book. Ratings 1–5 stars.

CREATE TABLE IF NOT EXISTS public.book_reviews (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  book_id     text REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text text,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.book_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_all"  ON public.book_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own"  ON public.book_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own"  ON public.book_reviews FOR UPDATE  USING (auth.uid() = user_id);
