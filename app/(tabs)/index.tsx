import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '../../lib/constants';
import { useFeed } from '../../hooks/useFeed';
import { FeedEventCard } from '../../components/feed/FeedEventCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { FeedEvent } from '../../stores/feedStore';

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 The Reading Gym</Text>
        <Text style={styles.headerSub}>What your friends are reading</Text>
      </View>

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
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  headerSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
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
});
