import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRoomStore } from '../stores/roomStore';
import { useAuthStore } from '../stores/authStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useReadingRoom(roomId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { upsertReader, upsertReaction } = useRoomStore();
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to reading_progress changes for this room
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_progress',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as any;
            // Fetch user info to enrich the record
            const { data: user } = await supabase
              .from('users')
              .select('username, avatar_url')
              .eq('id', row.user_id)
              .single();
            upsertReader({ ...row, users: user ?? { username: 'Unknown', avatar_url: null } });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chapter_reactions',
          filter: `book_id=eq.${roomId}`,
        },
        (payload) => {
          upsertReaction(payload.new as any);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, session]);
}
