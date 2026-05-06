import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { useFeed } from '../../hooks/useFeed';
import { FeedEventCard } from '../../components/feed/FeedEventCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { CreatePostModal } from '../../components/feed/CreatePostModal';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import type { AppUser } from '../../stores/authStore';
import type { FeedEvent } from '../../stores/feedStore';

function FeedHeader({ user }: { user: AppUser | null }) {
  if (!user) return null;
  return (
    <View style={styles.feedHeader}>
      <Text style={styles.appName}>The Reading Gym</Text>
      <View style={styles.headerStats}>
        {user.streak_days > 0 && (
          <View style={[styles.statPill, styles.streakPill]}>
            <Text style={styles.streakText}>🔥 {user.streak_days}</Text>
          </View>
        )}
        <View style={[styles.statPill, styles.xpPill]}>
          <Text style={styles.xpText}>⚡ {user.xp} XP</Text>
        </View>
      </View>
    </View>
  );
}

function EmptyFeed() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={styles.emptyTitle}>Your feed is empty</Text>
      <Text style={styles.emptySubtitle}>
        Search for a book, join a reading room, and start tracking chapters to see activity here.
      </Text>
    </View>
  );
}

export default function FeedScreen() {
  const { events, loading, refreshing, refresh } = useFeed();
  const { appUser } = useAuthStore();
  const [composeVisible, setComposeVisible] = React.useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <FeedHeader user={appUser} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <FeedHeader user={appUser} />

      <FlatList
        data={events}
        keyExtractor={(item: FeedEvent) => item.id}
        renderItem={({ item }) => <FeedEventCard event={item} />}
        ListEmptyComponent={<EmptyFeed />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
        contentContainerStyle={events.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setComposeVisible(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <CreatePostModal
        visible={composeVisible}
        onClose={() => setComposeVisible(false)}
        onPostSuccess={refresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  appName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.3,
  },
  headerStats: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  statPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  streakPill: {
    backgroundColor: 'rgba(232,83,26,0.15)',
    borderWidth: 1,
    borderColor: Colors.accent + '50',
  },
  streakText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  xpPill: {
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.gold + '50',
  },
  xpText: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
});
