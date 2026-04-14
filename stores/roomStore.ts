import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface ReaderProgress {
  id: string;
  user_id: string;
  room_id: string;
  book_id: string;
  current_chapter: number;
  is_completed: boolean;
  updated_at: string;
  users: {
    username: string;
    avatar_url: string | null;
  };
}

export interface ChapterReaction {
  id: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  reaction_type: string;
  created_at: string;
}

export interface RoomBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  description: string;
}

interface RoomState {
  roomId: string | null;
  book: RoomBook | null;
  readers: ReaderProgress[];
  myProgress: ReaderProgress | null;
  reactions: ChapterReaction[];
  loading: boolean;
  setRoom: (roomId: string, book: RoomBook) => void;
  setReaders: (readers: ReaderProgress[]) => void;
  upsertReader: (reader: ReaderProgress) => void;
  setMyProgress: (progress: ReaderProgress | null) => void;
  setReactions: (reactions: ChapterReaction[]) => void;
  upsertReaction: (reaction: ChapterReaction) => void;
  removeReaction: (id: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  book: null,
  readers: [],
  myProgress: null,
  reactions: [],
  loading: true,

  setRoom: (roomId, book) => set({ roomId, book }),

  setReaders: (readers) => set({ readers }),

  upsertReader: (reader) =>
    set((state) => {
      const existing = state.readers.findIndex((r) => r.user_id === reader.user_id);
      if (existing >= 0) {
        const updated = [...state.readers];
        updated[existing] = reader;
        return { readers: updated };
      }
      return { readers: [...state.readers, reader] };
    }),

  setMyProgress: (myProgress) => set({ myProgress }),

  setReactions: (reactions) => set({ reactions }),

  upsertReaction: (reaction) =>
    set((state) => {
      const existing = state.reactions.findIndex((r) => r.id === reaction.id);
      if (existing >= 0) {
        const updated = [...state.reactions];
        updated[existing] = reaction;
        return { reactions: updated };
      }
      return { reactions: [...state.reactions, reaction] };
    }),

  removeReaction: (id) =>
    set((state) => ({ reactions: state.reactions.filter((r) => r.id !== id) })),

  setLoading: (loading) => set({ loading }),

  reset: () =>
    set({ roomId: null, book: null, readers: [], myProgress: null, reactions: [], loading: true }),
}));
