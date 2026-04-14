import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface FeedEvent {
  id: string;
  user_id: string;
  event_type: 'chapter_progress' | 'room_joined' | 'chapter_reaction' | 'book_completed' | 'user_post';
  book_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  users: {
    username: string;
    avatar_url: string | null;
  };
  books: {
    title: string;
    cover_url: string;
  } | null;
}

interface FeedState {
  events: FeedEvent[];
  loading: boolean;
  refreshing: boolean;
  fetchFeed: () => Promise<void>;
  prependEvent: (event: FeedEvent) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  events: [],
  loading: true,
  refreshing: false,

  fetchFeed: async () => {
    set((s) => ({ loading: s.events.length === 0, refreshing: s.events.length > 0 }));
    const { data, error } = await supabase
      .from('feed_events')
      .select(`*, users(username, avatar_url), books(title, cover_url)`)
      .order('created_at', { ascending: false })
      .limit(60);
    if (!error && data) set({ events: data as FeedEvent[] });
    set({ loading: false, refreshing: false });
  },

  prependEvent: (event) =>
    set((state) => ({ events: [event, ...state.events].slice(0, 60) })),
}));
