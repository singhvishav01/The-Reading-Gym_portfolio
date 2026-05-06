import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  interests: string[];
  xp: number;
  streak_days: number;
  last_read_at: string | null;
  created_at: string;
}

interface AuthState {
  session: Session | null;
  appUser: AppUser | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setAppUser: (user: AppUser | null) => void;
  fetchAppUser: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<AppUser, 'username' | 'avatar_url' | 'bio' | 'interests'>>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  appUser: null,
  loading: true,

  setSession: (session) => set({ session, loading: false }),

  setAppUser: (appUser) => set({ appUser }),

  fetchAppUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) set({ appUser: data as AppUser });
  },

  updateProfile: async (updates) => {
    const { session, appUser } = get();
    if (!session || !appUser) return;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', session.user.id);

    if (!error) {
      set({ appUser: { ...appUser, ...updates } });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, appUser: null });
  },
}));
