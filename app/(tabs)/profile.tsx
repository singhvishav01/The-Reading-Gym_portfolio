import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { useAuthStore } from '../../stores/authStore';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

interface ReadingEntry {
  book_id: string;
  current_chapter: number;
  status: string;
  is_completed?: boolean;
  updated_at: string;
  books: {
    title: string;
    cover_url: string;
    author: string;
  } | null;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  status: string;
  created_at: string;
  requester?: {
    username: string;
    avatar_url: string | null;
  };
}

type Shelf = 'reading' | 'want_to_read' | 'completed';

export default function ProfileScreen() {
  const { appUser, session, signOut } = useAuthStore();
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [activeShelf, setActiveShelf] = useState<Shelf>('reading');
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    loadData();
  }, [session]);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadBooks(), loadFriendRequests(), loadFriendCount()]);
    setLoading(false);
  }

  async function loadBooks() {
    if (!session) return;
    const { data, error } = await supabase
      .from('reading_progress')
      .select('book_id, current_chapter, status, is_completed, updated_at, books(title, cover_url, author)')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('[Profile] loadBooks error:', error.message);
      Alert.alert('Error loading books', error.message);
      return;
    }
    if (data) setEntries(data as unknown as ReadingEntry[]);
  }

  async function loadFriendRequests() {
    if (!session) return;
    try {
      const { data } = await supabase
        .from('friendships')
        .select('id, requester_id, status, created_at')
        .eq('addressee_id', session.user.id)
        .eq('status', 'pending');

      if (data && data.length > 0) {
        // Fetch requester info
        const requesterIds = data.map((r: any) => r.requester_id);
        const { data: users } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', requesterIds);

        const enriched = data.map((r: any) => ({
          ...r,
          requester: users?.find((u: any) => u.id === r.requester_id),
        }));
        setFriendRequests(enriched);
      } else {
        setFriendRequests([]);
      }
    } catch {
      setFriendRequests([]);
    }
  }

  async function loadFriendCount() {
    if (!session) return;
    try {
      const { count } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`);
      setFriendCount(count ?? 0);
    } catch {
      setFriendCount(0);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
      setFriendCount((c) => c + 1);
    }
  }

  async function handleDeclineRequest(requestId: string) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'declined' })
      .eq('id', requestId);
    if (!error) {
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  }

  // Filter entries by shelf
  // Note: existing rows may have status=NULL, treat that as 'reading'
  const filteredEntries = entries.filter((e) => {
    if (activeShelf === 'completed') return e.is_completed || e.status === 'completed';
    if (activeShelf === 'want_to_read') return e.status === 'want_to_read';
    // 'reading' shelf: NULL, undefined, 'reading', or anything not want_to_read/completed
    return !e.is_completed && e.status !== 'completed' && e.status !== 'want_to_read';
  });

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
        data={filteredEntries}
        keyExtractor={(item) => item.book_id}
        ListHeaderComponent={
          <>
            <ProfileHeader
              user={appUser}
              booksReading={entries.filter((e) => !e.is_completed && e.status !== 'completed' && e.status !== 'want_to_read').length}
              friendCount={friendCount}
              onSignOut={signOut}
              onEditProfile={() => setEditVisible(true)}
            />

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <View style={styles.requestsSection}>
                <Text style={styles.requestsTitle}>Friend Requests</Text>
                {friendRequests.map((req) => (
                  <View key={req.id} style={styles.requestRow}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestInitials}>
                        {(req.requester?.username ?? '??').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.requestUsername}>{req.requester?.username ?? 'Unknown'}</Text>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptRequest(req.id)}
                    >
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => handleDeclineRequest(req.id)}
                    >
                      <Text style={styles.declineBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Shelf Tabs */}
            <View style={styles.shelfTabs}>
              {(['reading', 'want_to_read', 'completed'] as Shelf[]).map((shelf) => {
                const labels: Record<Shelf, string> = {
                  reading: 'Reading',
                  want_to_read: 'Want to Read',
                  completed: 'Finished',
                };
                const count = entries.filter((e) => {
                  if (shelf === 'completed') return e.is_completed || e.status === 'completed';
                  if (shelf === 'want_to_read') return e.status === 'want_to_read';
                  return !e.is_completed && e.status !== 'completed' && e.status !== 'want_to_read';
                }).length;
                const isActive = activeShelf === shelf;
                return (
                  <TouchableOpacity
                    key={shelf}
                    style={[styles.shelfTab, isActive && styles.shelfTabActive]}
                    onPress={() => setActiveShelf(shelf)}
                  >
                    <Text style={[styles.shelfTabText, isActive && styles.shelfTabTextActive]}>
                      {labels[shelf]} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
                    <Text style={styles.chapterBadgeText}>
                      {item.is_completed ? '✅ Done' : `Chapter ${item.current_chapter}`}
                    </Text>
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
            <Text style={styles.emptyEmoji}>
              {activeShelf === 'reading' ? '📚' : activeShelf === 'want_to_read' ? '📋' : '🏆'}
            </Text>
            <Text style={styles.emptyText}>
              {activeShelf === 'reading'
                ? "You haven't started any books yet."
                : activeShelf === 'want_to_read'
                  ? "No books on your wishlist yet."
                  : "No finished books yet. Keep reading!"}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/discover')} activeOpacity={0.7}>
              <Text style={styles.emptyLink}>Discover books →</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <EditProfileModal
        visible={editVisible}
        onClose={() => {
          setEditVisible(false);
          loadData(); // Refresh after editing
        }}
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
  // Friend Requests
  requestsSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  requestsTitle: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  requestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  requestInitials: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  requestUsername: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  acceptBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  declineBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dangerDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  // Shelf Tabs
  shelfTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  shelfTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
  },
  shelfTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
  },
  shelfTabText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  shelfTabTextActive: {
    color: Colors.accent,
  },
  // Book Rows
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
