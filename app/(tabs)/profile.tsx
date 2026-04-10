import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { useAuthStore } from '../../stores/authStore';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

interface ReadingEntry {
  book_id: string;
  current_chapter: number;
  updated_at: string;
  books: {
    title: string;
    cover_url: string;
    author: string;
  } | null;
}

export default function ProfileScreen() {
  const { appUser, session, signOut } = useAuthStore();
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('reading_progress')
      .select('book_id, current_chapter, updated_at, books(title, cover_url, author)')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setEntries(data as unknown as ReadingEntry[]);
        setLoading(false);
      });
  }, [session]);

  if (!appUser || loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.book_id}
        ListHeaderComponent={
          <>
            <ProfileHeader
              user={appUser}
              booksReading={entries.length}
              onSignOut={signOut}
            />
            {entries.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Currently Reading</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          const book = item.books;
          return (
            <TouchableOpacity
              style={styles.bookRow}
              onPress={() => router.push(`/room/${item.book_id}`)}
              activeOpacity={0.8}
            >
              {book?.cover_url ? (
                <Image source={{ uri: book.cover_url }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, styles.coverFallback]}>
                  <Text style={styles.coverFallbackText}>📖</Text>
                </View>
              )}
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={1}>
                  {book?.title ?? item.book_id}
                </Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>
                  {book?.author ?? ''}
                </Text>
                <View style={styles.progressRow}>
                  <View style={styles.chapterBadge}>
                    <Text style={styles.chapterBadgeText}>Chapter {item.current_chapter}</Text>
                  </View>
                  <Text style={styles.lastRead}>
                    {new Date(item.updated_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBooks}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyText}>You haven't started any books yet.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/discover')} activeOpacity={0.7}>
              <Text style={styles.emptyLink}>Discover books →</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  cover: {
    width: 48,
    height: 68,
    borderRadius: Radii.sm,
  },
  coverFallback: {
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverFallbackText: { fontSize: 24 },
  bookInfo: {
    flex: 1,
    gap: 4,
  },
  bookTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  bookAuthor: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  chapterBadge: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  chapterBadgeText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  lastRead: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  arrow: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
  },
  emptyBooks: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  emptyLink: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
