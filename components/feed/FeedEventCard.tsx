import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, FontSize, FontWeight, Spacing } from '../../lib/constants';
import type { FeedEvent } from '../../stores/feedStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function buildActivityText(event: FeedEvent): string {
  const title = event.books?.title ?? event.metadata?.book_title ?? 'a book';
  switch (event.event_type) {
    case 'chapter_progress':
      return `reached Chapter ${event.metadata?.chapter_number} of "${title}"`;
    case 'room_joined':
      return `joined the reading room for "${title}"`;
    case 'chapter_reaction': {
      const emoji = event.metadata?.reaction_emoji ?? '❤️';
      return `reacted ${emoji} to Chapter ${event.metadata?.chapter_number} of "${title}"`;
    }
    case 'book_completed':
      return `finished reading "${title}" 🎉`;
    default:
      return `did something with "${title}"`;
  }
}

// Colour per event type
const EVENT_COLOR: Record<FeedEvent['event_type'], string> = {
  chapter_progress: Colors.accent,
  room_joined:      Colors.gold,
  chapter_reaction: Colors.danger,
  book_completed:   Colors.success,
  user_post:        Colors.accent,
};

// ─── Shared avatar ────────────────────────────────────────────────────────────

function Avatar({
  url,
  username,
  size = 42,
  color,
}: {
  url?: string | null;
  username: string;
  size?: number;
  color?: string;
}) {
  const initials = username.slice(0, 2).toUpperCase();
  const border   = color ?? Colors.accent;
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: border,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: border,
        backgroundColor: border + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: border, fontSize: size * 0.33, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Twitter-style action row ─────────────────────────────────────────────────

function ActionRow({ liked, onLike }: { liked: boolean; onLike: () => void }) {
  return (
    <View style={styles.actionRow}>
      <TouchableOpacity onPress={onLike} style={styles.actionBtn}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={18}
          color={liked ? Colors.danger : Colors.textMuted}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}>
        <Ionicons name="chatbubble-outline" size={17} color={Colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}>
        <Ionicons name="arrow-redo-outline" size={17} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Activity card (system events) ───────────────────────────────────────────

function ActivityCard({ event }: { event: FeedEvent }) {
  const [liked, setLiked] = useState(false);
  const accent   = EVENT_COLOR[event.event_type];
  const username = event.users?.username ?? '?';

  return (
    <View style={styles.tweetRow}>
      {/* Left column — avatar + connector line */}
      <View style={styles.leftCol}>
        <Avatar url={event.users?.avatar_url} username={username} size={42} color={accent} />
      </View>

      {/* Right column */}
      <View style={styles.rightCol}>
        {/* Name row */}
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{username}</Text>
          <Text style={styles.dot}> · </Text>
          <Text style={styles.timestamp}>{timeAgo(event.created_at)}</Text>
        </View>

        {/* Activity text */}
        <Text style={styles.tweetBody}>
          {buildActivityText(event)}
        </Text>

        {/* Book cover inline chip */}
        {event.books?.cover_url && (
          <View style={styles.bookChip}>
            <Image
              source={{ uri: event.books.cover_url }}
              style={styles.bookChipCover}
              resizeMode="cover"
            />
            <Text style={styles.bookChipTitle} numberOfLines={1}>
              {event.books.title ?? event.metadata?.book_title}
            </Text>
          </View>
        )}

        <ActionRow liked={liked} onLike={() => setLiked(!liked)} />
      </View>
    </View>
  );
}

// ─── Post card (user_post events) ────────────────────────────────────────────

function PostCard({ event }: { event: FeedEvent }) {
  const { width: screenWidth } = useWindowDimensions();
  const [liked, setLiked] = useState(false);

  const username    = event.users?.username ?? '?';
  const caption     = event.metadata?.caption ?? '';
  const imageUrl    = event.metadata?.image_url ?? event.metadata?.book_cover ?? event.books?.cover_url;
  const milestoneText = event.metadata?.milestone_text;

  // Image renders at 4:3 max so landscape images don't dominate
  const imgWidth  = screenWidth - Spacing.md * 2 - 42 - Spacing.sm; // right-col width
  const imgHeight = Math.round(imgWidth * 0.75);

  return (
    <View style={styles.tweetRow}>
      <View style={styles.leftCol}>
        <Avatar url={event.users?.avatar_url} username={username} size={42} />
      </View>

      <View style={styles.rightCol}>
        {/* Name row */}
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{username}</Text>
          {event.metadata?.book_title && (
            <>
              <Text style={styles.dot}> · </Text>
              <Text style={styles.bookNameInline} numberOfLines={1}>
                {event.metadata.book_title}
              </Text>
            </>
          )}
          <Text style={[styles.dot, { marginLeft: 'auto' }]}> </Text>
          <Text style={styles.timestamp}>{timeAgo(event.created_at)}</Text>
        </View>

        {/* Caption */}
        {caption ? (
          <Text style={styles.tweetBody}>{caption}</Text>
        ) : null}

        {/* Milestone badge */}
        {milestoneText && (
          <View style={styles.milestonePill}>
            <Text style={styles.milestonePillText}>{milestoneText}</Text>
          </View>
        )}

        {/* Embedded image — constrained height, rounded, NOT full-screen */}
        {imageUrl && (
          <View style={[styles.embeddedImage, { width: imgWidth, height: imgHeight }]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.embeddedImageFill}
              resizeMode="cover"
            />
          </View>
        )}

        <ActionRow liked={liked} onLike={() => setLiked(!liked)} />
      </View>
    </View>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function FeedEventCard({ event }: { event: FeedEvent }) {
  if (event.event_type === 'user_post') return <PostCard event={event} />;
  return <ActivityCard event={event} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Twitter two-column layout
  tweetRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  leftCol: {
    width: 42,
    alignItems: 'center',
  },
  rightCol: {
    flex: 1,
    gap: 4,
  },

  // Name / timestamp row
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  displayName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    flexShrink: 1,
  },
  dot: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    flexShrink: 0,
  },
  bookNameInline: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    flexShrink: 1,
    maxWidth: 120,
  },

  // Tweet body text
  tweetBody: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
  },

  // Book chip (activity cards)
  bookChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
    marginTop: 2,
    maxWidth: '90%',
  },
  bookChipCover: {
    width: 20,
    height: 28,
    borderRadius: 2,
  },
  bookChipTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    flexShrink: 1,
  },

  // Milestone pill (posts)
  milestonePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentDim,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent + '50',
  },
  milestonePillText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Embedded image (posts)
  embeddedImage: {
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  embeddedImageFill: {
    width: '100%',
    height: '100%',
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    padding: 2,
  },
});
