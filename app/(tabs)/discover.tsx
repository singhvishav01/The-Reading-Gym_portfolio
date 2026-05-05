import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { Input } from '../../components/ui/Input';
import { BookCard } from '../../components/books/BookCard';
import { UserCard } from '../../components/discover/UserCard';
import { searchBooks, type GoogleBook } from '../../lib/googleBooks';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type SearchMode = 'books' | 'people';

interface SearchUser {
  id: string;
  username: string;
  avatar_url: string | null;
  bio?: string;
  xp?: number;
}

export default function DiscoverScreen() {
  const { session } = useAuthStore();
  const [mode, setMode] = useState<SearchMode>('books');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [userResults, setUserResults] = useState<SearchUser[]>([]);
  const [friendshipMap, setFriendshipMap] = useState<Record<string, 'none' | 'pending' | 'accepted' | 'loading'>>({});
  const [recommended, setRecommended] = useState<GoogleBook[]>([]);
  const [communityBooks, setCommunityBooks] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 450);

  React.useEffect(() => {
    async function loadInitialData() {
      try {
        setInitialLoad(true);
        const recs = await searchBooks('subject:fiction bestseller');
        setRecommended(recs.slice(0, 6));

        const { data } = await supabase
          .from('reading_progress')
          .select('book_id, books(title, cover_url, author)')
          .order('updated_at', { ascending: false })
          .limit(10);

        if (data) {
          const mapped = data.map((d: any) => ({
            id: d.book_id,
            title: d.books?.title ?? 'Unknown Book',
            author: d.books?.author ?? 'Unknown Author',
            cover: d.books?.cover_url ?? '',
            description: '',
          } as GoogleBook));
          const unique = mapped.filter((b, idx, arr) => arr.findIndex(t => t.id === b.id) === idx);
          setCommunityBooks(unique.slice(0, 6));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoad(false);
      }
    }
    loadInitialData();
  }, []);

  // Search effect
  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setUserResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    if (mode === 'books') {
      searchBooks(debouncedQuery)
        .then(setResults)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      // People search
      searchUsers(debouncedQuery);
    }
  }, [debouncedQuery, mode]);

  async function searchUsers(q: string) {
    try {
      const { data, error: err } = await supabase
        .from('users')
        .select('id, username, avatar_url, bio, xp')
        .ilike('username', `%${q}%`)
        .neq('id', session?.user.id ?? '')
        .limit(20);

      if (err) throw err;
      setUserResults(data ?? []);

      // Check friendship status for each result
      if (data && data.length > 0 && session) {
        const statusMap: Record<string, 'none' | 'pending' | 'accepted'> = {};
        const ids = data.map((u: any) => u.id);

        const { data: friendships } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id, status')
          .or(
            `and(requester_id.eq.${session.user.id},addressee_id.in.(${ids.join(',')})),` +
            `and(addressee_id.eq.${session.user.id},requester_id.in.(${ids.join(',')}))`
          );

        ids.forEach((id: string) => {
          const match = friendships?.find(
            (f: any) =>
              (f.requester_id === session.user.id && f.addressee_id === id) ||
              (f.addressee_id === session.user.id && f.requester_id === id)
          );
          if (match) {
            statusMap[id] = match.status === 'accepted' ? 'accepted' : 'pending';
          } else {
            statusMap[id] = 'none';
          }
        });
        setFriendshipMap(statusMap);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFriend(userId: string) {
    if (!session) return;
    setFriendshipMap((prev) => ({ ...prev, [userId]: 'loading' }));

    const { error } = await supabase.from('friendships').insert({
      requester_id: session.user.id,
      addressee_id: userId,
    });

    if (error) {
      Alert.alert('Error', error.message);
      setFriendshipMap((prev) => ({ ...prev, [userId]: 'none' }));
    } else {
      setFriendshipMap((prev) => ({ ...prev, [userId]: 'pending' }));
    }
  }

  const handleBookPress = useCallback((book: GoogleBook) => {
    router.push(`/room/${book.id}`);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Mode Segmented Control */}
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, mode === 'books' && styles.segmentActive]}
          onPress={() => { setMode('books'); setQuery(''); }}
        >
          <Text style={[styles.segmentText, mode === 'books' && styles.segmentTextActive]}>📚 Books</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, mode === 'people' && styles.segmentActive]}
          onPress={() => { setMode('people'); setQuery(''); }}
        >
          <Text style={[styles.segmentText, mode === 'people' && styles.segmentTextActive]}>👥 People</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Input
          placeholder={mode === 'books' ? 'Search books, authors...' : 'Search by username...'}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Books Mode */}
      {mode === 'books' && (
        <>
          {!loading && !error && query.length > 0 && results.length === 0 && (
            <View style={styles.centered}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>No books found for "{query}"</Text>
            </View>
          )}

          {initialLoad && !query && (
            <View style={styles.centered}>
              <LoadingSpinner />
            </View>
          )}

          {!initialLoad && !loading && !query && (
            <View style={styles.discoverScroll}>
              <FlatList
                ListHeaderComponent={
                  <View style={styles.discoverContainer}>
                    {communityBooks.length > 0 && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Friends are reading</Text>
                        <FlatList
                          data={communityBooks}
                          keyExtractor={b => 'comm_' + b.id}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          renderItem={({ item }) => (
                            <View style={styles.horizontalCardWrapper}>
                              <BookCard book={item} onPress={() => handleBookPress(item)} />
                            </View>
                          )}
                          contentContainerStyle={styles.horizontalList}
                        />
                      </View>
                    )}

                    {recommended.length > 0 && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recommended for you</Text>
                        <FlatList
                          data={recommended}
                          keyExtractor={b => 'req_' + b.id}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          renderItem={({ item }) => (
                            <View style={styles.horizontalCardWrapper}>
                              <BookCard book={item} onPress={() => handleBookPress(item)} />
                            </View>
                          )}
                          contentContainerStyle={styles.horizontalList}
                        />
                      </View>
                    )}
                  </View>
                }
                data={[]}
                renderItem={() => null}
              />
            </View>
          )}

          {query.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <BookCard book={item} onPress={() => handleBookPress(item)} />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </>
      )}

      {/* People Mode */}
      {mode === 'people' && (
        <>
          {!loading && !error && query.length > 0 && userResults.length === 0 && (
            <View style={styles.centered}>
              <Text style={styles.emptyEmoji}>👤</Text>
              <Text style={styles.emptyText}>No users found for "{query}"</Text>
            </View>
          )}

          {!query && !loading && (
            <View style={styles.centered}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Search for readers by username</Text>
            </View>
          )}

          {query.length > 0 && (
            <FlatList
              data={userResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserCard
                  user={item}
                  friendshipStatus={friendshipMap[item.id] ?? 'none'}
                  onAddFriend={() => handleAddFriend(item.id)}
                />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.accent,
  },
  segmentText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  searchBar: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  discoverScroll: {
    flex: 1,
  },
  discoverContainer: {
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  horizontalList: {
    paddingHorizontal: Spacing.md,
  },
  horizontalCardWrapper: {
    width: 280,
    marginRight: Spacing.md,
  },
});
