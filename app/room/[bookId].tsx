import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { getBook } from '../../lib/googleBooks';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { useReadingRoom } from '../../hooks/useReadingRoom';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { ChapterTracker } from '../../components/room/ChapterTracker';
import { ChapterReactions } from '../../components/room/ChapterReactions';
import { ReaderProgressCard } from '../../components/room/ReaderProgressCard';

export default function ReadingRoomScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { session, appUser } = useAuthStore();
  const {
    roomId,
    book,
    readers,
    myProgress,
    loading,
    setRoom,
    setReaders,
    setMyProgress,
    setReactions,
    setLoading,
    reset,
  } = useRoomStore();

  // Subscribe to realtime updates
  useReadingRoom(roomId);

  useEffect(() => {
    if (!bookId || !session) return;
    reset();
    loadRoom();

    return () => {
      reset();
    };
  }, [bookId, session]);

  async function loadRoom() {
    setLoading(true);

    try {
      // 1. Fetch book from Google Books API
      const gbBook = await getBook(bookId!);
      if (!gbBook) throw new Error('Book not found');

      // 2. Insert book into DB if not exists
      const { data: existingBook } = await supabase.from('books').select('id').eq('id', gbBook.id).maybeSingle();
      if (!existingBook) {
        await supabase.from('books').insert({
          id: gbBook.id,
          title: gbBook.title,
          author: gbBook.author,
          cover_url: gbBook.cover,
          description: gbBook.description,
        });
      }

      // 3. Load or create reading room
      let roomData;
      const { data: existingRoom } = await supabase.from('reading_rooms').select('*').eq('book_id', gbBook.id).maybeSingle();
      
      if (existingRoom) {
        roomData = existingRoom;
      } else {
        const { data: newRoom, error: roomError } = await supabase
          .from('reading_rooms')
          .insert({ book_id: gbBook.id })
          .select()
          .single();
        if (roomError || !newRoom) throw new Error('Could not create room');
        roomData = newRoom;
      }
      setRoom(roomData.id, {
        id: gbBook.id,
        title: gbBook.title,
        author: gbBook.author,
        cover_url: gbBook.cover,
        description: gbBook.description,
      });

      // 4. Log room_joined feed event (only if first time)
      const { data: existingProgress } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('user_id', session!.user.id)
        .eq('book_id', gbBook.id)
        .maybeSingle();

      if (!existingProgress) {
        await supabase.from('feed_events').insert({
          user_id: session!.user.id,
          event_type: 'room_joined',
          book_id: gbBook.id,
          metadata: { book_title: gbBook.title },
        });
      }

      // 5. Fetch all readers in this room
      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('*, users(username, avatar_url)')
        .eq('room_id', roomData.id)
        .order('current_chapter', { ascending: false });

      if (progressData) {
        setReaders(progressData as any);
        const mine = progressData.find((r: any) => r.user_id === session!.user.id);
        if (mine) setMyProgress(mine as any);
      }

      // 6. Fetch reactions for this book
      const { data: reactionsData } = await supabase
        .from('chapter_reactions')
        .select('*')
        .eq('book_id', gbBook.id);

      if (reactionsData) setReactions(reactionsData as any);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not load reading room');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  if (loading || !book) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={styles.loadingText}>Loading room…</Text>
      </View>
    );
  }

  const sortedReaders = [...readers].sort(
    (a, b) => b.current_chapter - a.current_chapter
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          Reading Room
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Book hero */}
        <View style={styles.bookHero}>
          {book.cover_url ? (
            <Image
              source={{ uri: book.cover_url }}
              style={styles.cover}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cover, styles.coverFallback]}>
              <Text style={styles.coverFallbackText}>📖</Text>
            </View>
          )}
          <View style={styles.bookMeta}>
            <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
            <Text style={styles.bookAuthor}>{book.author}</Text>
            <View style={styles.readersCount}>
              <Ionicons name="people" size={14} color={Colors.accentLight} />
              <Text style={styles.readersCountText}>
                {readers.length} reader{readers.length !== 1 ? 's' : ''} in this room
              </Text>
            </View>
          </View>
        </View>

        {/* Chapter tracker */}
        <View style={styles.section}>
          <ChapterTracker roomId={roomId!} bookId={book.id} />
        </View>

        {/* Readers leaderboard */}
        {sortedReaders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Readers in this Room</Text>
            {sortedReaders.map((reader, index) => (
              <ReaderProgressCard
                key={reader.user_id}
                reader={reader}
                isMe={reader.user_id === session?.user.id}
                rank={index + 1}
              />
            ))}
          </View>
        )}

        {/* Chapter reactions */}
        <View style={styles.section}>
          <ChapterReactions bookId={book.id} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  bookHero: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cover: {
    width: 80,
    height: 116,
    borderRadius: Radii.sm,
    flexShrink: 0,
  },
  coverFallback: {
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverFallbackText: { fontSize: 36 },
  bookMeta: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  bookTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  },
  bookAuthor: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  readersCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  readersCountText: {
    color: Colors.accentLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
